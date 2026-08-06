import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
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

// Enable Firestore offline cache in browser IndexedDB
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Persistência mantida na aba ativa primária.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Navegador atual não suporta IndexedDB.');
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
  lixeira: 'lixeira'
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

// Generic helper to subscribe to a Firestore collection with real-time updates
export function subscribeToCollection<T extends { id?: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  initialSeedIfEmpty?: T[]
) {
  const colRef = collection(db, collectionName);

  return onSnapshot(colRef, async (snapshot: QuerySnapshot<DocumentData>) => {
    if (snapshot.empty) {
      // If offline or snapshot came from local cache, do NOT attempt re-seeding
      const isOfflineOrCache = (typeof navigator !== 'undefined' && !navigator.onLine) || snapshot.metadata.fromCache;
      if (isOfflineOrCache) {
        onUpdate([]);
        return;
      }

      const isAlreadyInitialized = await checkOrMarkDbInitialized(false);

      if (!isAlreadyInitialized && initialSeedIfEmpty && initialSeedIfEmpty.length > 0) {
        console.log(`Coleção ${collectionName} vazia no primeiro carregamento do sistema. Populando dados iniciais no Firestore...`);
        try {
          const batch = writeBatch(db);
          for (const item of initialSeedIfEmpty) {
            const newDocRef = doc(colRef);
            const { id, ...itemWithoutId } = item as any;
            batch.set(newDocRef, { ...itemWithoutId, createdAt: new Date().toISOString() });
          }
          // Mark system initialized in Firestore & LocalStorage
          const metaRef = doc(db, "system_metadata", "database_init");
          batch.set(metaRef, { initialized: true, initializedAt: new Date().toISOString() }, { merge: true });

          await batch.commit();
          isDbInitializedMemory = true;
          if (typeof window !== 'undefined') localStorage.setItem(LOCAL_INIT_KEY, 'true');
        } catch (err) {
          console.error(`Erro ao semear dados na coleção ${collectionName}:`, err);
        }
        return;
      }

      onUpdate([]);
      return;
    }

    // Mark DB as initialized since at least one collection has data
    checkOrMarkDbInitialized(true);

    const rawItems: T[] = [];
    snapshot.forEach((docSnap) => {
      rawItems.push({
        id: docSnap.id,
        ...docSnap.data()
      } as unknown as T);
    });

    // Deduplicate items by 'nome' / name fields to purge any existing duplicate documents in Firestore
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

    onUpdate(cleanItems);
  }, (error) => {
    console.error(`Erro no listener da coleção ${collectionName}:`, error);
  });
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

// Save or Update item in Firestore
export async function saveDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  docId?: string
) {
  const colRef = collection(db, collectionName);
  const rawDataToSave = { ...data, updatedAt: new Date().toISOString() };
  const dataToSave = sanitizeForFirestore(rawDataToSave);
  
  if (docId || data.id) {
    const targetId = docId || data.id!;
    const { id, ...cleanData } = dataToSave as any;
    const docRef = doc(db, collectionName, targetId);
    await setDoc(docRef, cleanData, { merge: true });
    return targetId;
  } else {
    const docRef = await addDoc(colRef, dataToSave);
    return docRef.id;
  }
}

// Delete item from Firestore
export async function removeDocument(collectionName: string, docId: string) {
  if (!docId) return;
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
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
