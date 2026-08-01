import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
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

let isDbInitializedMemory = false;

async function checkOrMarkDbInitialized(hasData: boolean): Promise<boolean> {
  if (isDbInitializedMemory) return true;
  const metaRef = doc(db, "system_metadata", "database_init");
  try {
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      isDbInitializedMemory = true;
      return true;
    }
    if (hasData) {
      await setDoc(metaRef, { initialized: true, initializedAt: new Date().toISOString() }, { merge: true });
      isDbInitializedMemory = true;
      return true;
    }
  } catch (err) {
    console.warn("Erro ao verificar/marcar inicialização do banco de dados:", err);
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
          // Mark system initialized in Firestore so empty collections won't re-seed in future deployments or sessions
          const metaRef = doc(db, "system_metadata", "database_init");
          batch.set(metaRef, { initialized: true, initializedAt: new Date().toISOString() }, { merge: true });

          await batch.commit();
          isDbInitializedMemory = true;
        } catch (err) {
          console.error(`Erro ao semear dados na coleção ${collectionName}:`, err);
        }
        return;
      }

      onUpdate([]);
      return;
    }

    // Mark DB as initialized in Firestore since at least one collection has data
    checkOrMarkDbInitialized(true);

    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data()
      } as unknown as T);
    });

    onUpdate(items);
  }, (error) => {
    console.error(`Erro no listener da coleção ${collectionName}:`, error);
  });
}

// Save or Update item in Firestore
export async function saveDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  docId?: string
) {
  const colRef = collection(db, collectionName);
  const dataToSave = { ...data, updatedAt: new Date().toISOString() };
  
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
    if (id) {
      const docRef = doc(db, collectionName, id);
      batch.set(docRef, { ...dataWithoutId, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      const newRef = doc(colRef);
      batch.set(newRef, { ...dataWithoutId, createdAt: new Date().toISOString() });
    }
  }

  await batch.commit();
}
