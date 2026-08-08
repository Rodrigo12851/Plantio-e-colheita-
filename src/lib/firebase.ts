import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  DocumentData,
  QuerySnapshot
} from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const customDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId;

export const db = (customDatabaseId && customDatabaseId !== "(default)")
  ? getFirestore(app, customDatabaseId)
  : getFirestore(app);

// Enable Firestore offline cache in browser IndexedDB with multi-tab support
if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Fallback to single tab persistence if multi-tab isn't available or fails
      enableIndexedDbPersistence(db).catch(() => {});
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Navegador atual não suporta IndexedDB.');
    } else {
      console.warn('[Firebase] Persistência offline ajustada:', err?.message || err);
    }
  });
}

// Collection names helper
export const COLLECTIONS = {
  colheita: 'colheita',
  plantio: 'plantio',
  culturas: 'culturas',
  variedades: 'variedades',
  pivos: 'pivos',
  glebas: 'glebas',
  fazendas: 'fazendas',
  empresas: 'empresas',
  anos: 'anos',
  colaboradores: 'colaboradores',
  motoristas: 'motoristas',
  onibus: 'onibus',
  amarracoes: 'amarracoes',
  unidades: 'unidades',
  lixeira: 'lixeira',
  usuarios: 'usuarios'
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;

const LOCAL_INIT_KEY = 'cristalina_system_initialized_v2';
let isDbInitializedMemory = typeof window !== 'undefined' && localStorage.getItem(LOCAL_INIT_KEY) === 'true';

export async function checkOrMarkDbInitialized(hasData: boolean): Promise<boolean> {
  if (isDbInitializedMemory) return true;
  if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_INIT_KEY) === 'true') {
    isDbInitializedMemory = true;
    return true;
  }
  
  // If offline, assume initialized to prevent any accidental re-seeding
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    isDbInitializedMemory = true;
    return true;
  }

  const metaRef = doc(db, "system_metadata", "database_init");
  try {
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      isDbInitializedMemory = true;
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_INIT_KEY, 'true');
      return true;
    }
    if (hasData) {
      await setDoc(metaRef, { initialized: true, initializedAt: new Date().toISOString() }, { merge: true });
      isDbInitializedMemory = true;
      if (typeof window !== 'undefined') localStorage.setItem(LOCAL_INIT_KEY, 'true');
      return true;
    }
  } catch (err) {
    console.warn("Aviso ao verificar inicialização do banco de dados (offline/erro):", err);
    // Return true on error/offline so we NEVER re-seed deleted items
    return true;
  }
  return false;
}

// Local Storage Cache Helpers for Offline Support
const getLocalCacheKey = (colName: string) => `CRISTALINA_OFFLINE_CACHE_${colName}`;

export function getLocalCache<T>(colName: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalCacheKey(colName));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[LocalCache] Erro ao ler cache de ${colName}:`, e);
  }
  return [];
}

export function setLocalCache<T>(colName: string, data: T[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getLocalCacheKey(colName), JSON.stringify(data));
  } catch (e) {
    console.warn(`[LocalCache] Erro ao salvar cache de ${colName}:`, e);
  }
}

// Active subscribers map for instant local offline updates
const activeSubscribers: Record<string, Set<(data: any[]) => void>> = {};

function notifySubscribers(collectionName: string, items: any[]) {
  if (activeSubscribers[collectionName]) {
    activeSubscribers[collectionName].forEach(callback => {
      try {
        callback(items);
      } catch (err) {
        console.error(`[LocalCache] Erro ao notificar subscriber de ${collectionName}:`, err);
      }
    });
  }
}

// Generic helper to subscribe to a Firestore collection with real-time updates & local fallback
export function subscribeToCollection<T extends { id?: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  initialSeedIfEmpty?: T[]
) {
  if (!activeSubscribers[collectionName]) {
    activeSubscribers[collectionName] = new Set();
  }
  activeSubscribers[collectionName].add(onUpdate as any);

  // 1. Immediate local cache / initial seed load for instant offline UI
  let localData = getLocalCache<T>(collectionName);
  if ((!localData || localData.length === 0) && initialSeedIfEmpty && initialSeedIfEmpty.length > 0) {
    localData = initialSeedIfEmpty;
    setLocalCache(collectionName, localData);
  }
  if (localData && localData.length > 0) {
    onUpdate(localData);
  }

  // 2. Firestore Listener
  const colRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(colRef, async (snapshot: QuerySnapshot<DocumentData>) => {
    if (snapshot.empty) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      // Check if this specific collection has already been seeded in Firestore
      const metaColRef = doc(db, "system_metadata", `seed_${collectionName}`);
      let isColSeeded = false;
      if (!isOffline) {
        try {
          const metaSnap = await getDoc(metaColRef);
          if (metaSnap.exists()) {
            isColSeeded = true;
          }
        } catch (e) {
          console.warn(`[Firebase] Aviso ao ler metadados da coleção ${collectionName}:`, e);
        }
      }

      // If the collection is empty AND hasn't been seeded yet AND we have initial seed data:
      if (!isOffline && !isColSeeded && initialSeedIfEmpty && initialSeedIfEmpty.length > 0) {
        console.log(`[Firebase] Coleção "${collectionName}" vazia no Firestore. Semeando dados iniciais...`);
        try {
          const batch = writeBatch(db);
          for (const item of initialSeedIfEmpty) {
            const itemId = (item as any).id || doc(colRef).id;
            const docRef = doc(db, collectionName, itemId);
            const cleanItem = sanitizeForFirestore({ ...item, id: itemId });
            batch.set(docRef, { ...cleanItem, createdAt: new Date().toISOString() }, { merge: true });
          }
          batch.set(metaColRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
          await batch.commit();
          console.log(`[Firebase] Coleção "${collectionName}" semeada com sucesso no Firestore com ${initialSeedIfEmpty.length} item(ns).`);
          return;
        } catch (err) {
          console.error(`[Firebase] Erro ao semear coleção "${collectionName}" no Firestore:`, err);
        }
      }

      // If offline and we have local cache, keep showing local cache
      const currentCache = getLocalCache<T>(collectionName);
      if (isOffline && currentCache && currentCache.length > 0) {
        onUpdate(currentCache);
        return;
      }

      // If already seeded or offline with no cache, notify empty
      setLocalCache(collectionName, []);
      onUpdate([]);
      return;
    }

    // Mark collection as seeded since snapshot contains documents
    const metaColRef = doc(db, "system_metadata", `seed_${collectionName}`);
    setDoc(metaColRef, { seeded: true, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

    const rawItems: T[] = [];
    snapshot.forEach((docSnap) => {
      rawItems.push({
        id: docSnap.id,
        ...docSnap.data()
      } as unknown as T);
    });

    const nameBasedCollections = [
      'empresas', 'unidades', 'fazendas', 'pivos', 'glebas', 
      'culturas', 'anos', 'colaboradores', 'motoristas', 'onibus'
    ];

    let cleanItems = rawItems;
    if (nameBasedCollections.includes(collectionName)) {
      const seenNames = new Set<string>();
      cleanItems = [];
      for (const item of rawItems) {
        const nameVal = (item as any).nome || (item as any).empresa || (item as any).titulo || '';
        const normKey = nameVal.toString().trim().toLowerCase();
        if (!normKey) {
          cleanItems.push(item);
          continue;
        }
        if (seenNames.has(normKey)) {
          if (item.id) {
            deleteDoc(doc(db, collectionName, item.id)).catch(err => {
              console.warn(`[Firebase Cleanup] Erro ao deletar documento duplicado ${item.id} da coleção ${collectionName}:`, err);
            });
          }
        } else {
          seenNames.add(normKey);
          cleanItems.push(item);
        }
      }
    }

    setLocalCache(collectionName, cleanItems);
    onUpdate(cleanItems);
  }, (error) => {
    console.error(`Erro no listener da coleção ${collectionName}:`, error);
    const fallbackCache = getLocalCache<T>(collectionName);
    if (fallbackCache && fallbackCache.length > 0) {
      onUpdate(fallbackCache);
    }
  });

  return () => {
    if (activeSubscribers[collectionName]) {
      activeSubscribers[collectionName].delete(onUpdate as any);
    }
    unsubscribe();
  };
}

// Helper to strip undefined values recursively so Firestore never throws unsupported field errors
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// Save or Update item in Firestore & Local Storage
export async function saveDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  docId?: string
) {
  const targetId = docId || data.id || `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawDataToSave = { ...data, id: targetId, updatedAt: new Date().toISOString() };
  const dataToSave = sanitizeForFirestore(rawDataToSave);

  // 1. Immediate local cache update for offline instant response
  const currentItems = getLocalCache<T>(collectionName);
  const existingIdx = currentItems.findIndex(i => (i as any).id === targetId);
  let updatedItems: T[] = [];
  if (existingIdx >= 0) {
    updatedItems = [...currentItems];
    updatedItems[existingIdx] = dataToSave as unknown as T;
  } else {
    updatedItems = [dataToSave as unknown as T, ...currentItems];
  }
  setLocalCache(collectionName, updatedItems);
  notifySubscribers(collectionName, updatedItems);

  // 2. Background Firestore persistence
  try {
    const docRef = doc(db, collectionName, targetId);
    await setDoc(docRef, dataToSave, { merge: true });
    console.log(`[Firebase] Documento ${targetId} salvo com sucesso na coleção ${collectionName}.`);
  } catch (err) {
    console.warn(`[Firebase] Gravação salva localmente no modo offline para ${collectionName}:`, err);
  }

  return targetId;
}

// Delete item from Firestore & Local Storage
export async function removeDocument(collectionName: string, docId: string) {
  if (!docId) return;

  // 1. Immediate local cache update
  const currentItems = getLocalCache<any>(collectionName);
  const updatedItems = currentItems.filter(i => i.id !== docId);
  setLocalCache(collectionName, updatedItems);
  notifySubscribers(collectionName, updatedItems);

  // 2. Background Firestore removal
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[Firebase] Exclusão realizada localmente no modo offline para ${collectionName}:`, err);
  }
}

// Save entire array (Sync array to Firestore collection)
export async function syncCollection<T extends { id?: string }>(
  collectionName: string,
  items: T[]
) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  const batch = writeBatch(db);

  // Delete items no longer in list
  snapshot.forEach((docSnap) => {
    if (!items.some(i => i.id === docSnap.id)) {
      batch.delete(docSnap.ref);
    }
  });

  // Add/Update items
  for (const item of items) {
    const { id, ...dataWithoutId } = item as any;
    const cleanData = sanitizeForFirestore(dataWithoutId);
    if (id) {
      const docRef = doc(db, collectionName, id);
      batch.set(docRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      const newRef = doc(colRef);
      batch.set(newRef, { ...cleanData, createdAt: new Date().toISOString() });
    }
  }

  await batch.commit();
}
