/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { CompanyProfile, Client, Product, Document } from './types';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTHENTICATION HELPERS ---

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    // If invalid-credential or user-not-found, try auto-registering to make it a seamless "Quick Login"
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        return result.user;
      } catch (regErr) {
        console.error('Error auto-registering with email:', regErr);
        throw regErr;
      }
    }
    console.error('Error logging in with email:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// --- SEEDING / INITIAL SETUP ---

export async function isCollectionEmpty(userId: string, collectionName: string): Promise<boolean> {
  try {
    const colRef = collection(db, 'users', userId, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.empty;
  } catch (error) {
    console.error(`Error checking if ${collectionName} is empty for user ${userId}:`, error);
    return true;
  }
}

export async function seedInitialData(
  userId: string,
  profile: CompanyProfile,
  clients: Client[],
  products: Product[],
  documents: Document[]
) {
  try {
    const batch = writeBatch(db);

    // 1. Seed Company Profile
    const profileRef = doc(db, 'users', userId, 'profile', 'company');
    batch.set(profileRef, profile);

    // 2. Seed Clients
    clients.forEach(client => {
      const ref = doc(db, 'users', userId, 'clients', client.id);
      batch.set(ref, client);
    });

    // 3. Seed Products
    products.forEach(product => {
      const ref = doc(db, 'users', userId, 'products', product.id);
      batch.set(ref, product);
    });

    // 4. Seed Documents
    documents.forEach(document => {
      const ref = doc(db, 'users', userId, 'documents', document.id);
      batch.set(ref, document);
    });

    await batch.commit();
    console.log(`Successfully seeded Firestore for user ${userId}`);
  } catch (error) {
    console.error('Error seeding initial data to Firestore:', error);
  }
}

// --- REAL-TIME LISTENERS ---

export function listenToCompanyProfile(userId: string, onUpdate: (profile: CompanyProfile) => void) {
  const docRef = doc(db, 'users', userId, 'profile', 'company');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as CompanyProfile);
    }
  }, (error) => {
    console.error('Error listening to company profile:', error);
  });
}

export function listenToClients(userId: string, onUpdate: (clients: Client[]) => void) {
  const colRef = collection(db, 'users', userId, 'clients');
  return onSnapshot(colRef, (snapshot) => {
    const clients: Client[] = [];
    snapshot.forEach(docSnap => {
      clients.push(docSnap.data() as Client);
    });
    onUpdate(clients);
  }, (error) => {
    console.error('Error listening to clients:', error);
  });
}

export function listenToProducts(userId: string, onUpdate: (products: Product[]) => void) {
  const colRef = collection(db, 'users', userId, 'products');
  return onSnapshot(colRef, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach(docSnap => {
      products.push(docSnap.data() as Product);
    });
    onUpdate(products);
  }, (error) => {
    console.error('Error listening to products:', error);
  });
}

export function listenToDocuments(userId: string, onUpdate: (documents: Document[]) => void) {
  const colRef = collection(db, 'users', userId, 'documents');
  return onSnapshot(colRef, (snapshot) => {
    const documents: Document[] = [];
    snapshot.forEach(docSnap => {
      documents.push(docSnap.data() as Document);
    });
    onUpdate(documents);
  }, (error) => {
    console.error('Error listening to documents:', error);
  });
}

// --- PERSISTENCE WRITE OPERATIONS ---

export async function saveCompanyProfileToCloud(userId: string, profile: CompanyProfile) {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'company');
    await setDoc(docRef, profile);
  } catch (error) {
    console.error('Error saving company profile to cloud:', error);
  }
}

export async function saveClientToCloud(userId: string, client: Client) {
  try {
    const docRef = doc(db, 'users', userId, 'clients', client.id);
    await setDoc(docRef, client);
  } catch (error) {
    console.error('Error saving client to cloud:', error);
  }
}

export async function deleteClientFromCloud(userId: string, id: string) {
  try {
    const docRef = doc(db, 'users', userId, 'clients', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting client from cloud:', error);
  }
}

export async function saveProductToCloud(userId: string, product: Product) {
  try {
    const docRef = doc(db, 'users', userId, 'products', product.id);
    await setDoc(docRef, product);
  } catch (error) {
    console.error('Error saving product to cloud:', error);
  }
}

export async function deleteProductFromCloud(userId: string, id: string) {
  try {
    const docRef = doc(db, 'users', userId, 'products', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product from cloud:', error);
  }
}

export async function saveDocumentToCloud(userId: string, document: Document) {
  try {
    const docRef = doc(db, 'users', userId, 'documents', document.id);
    await setDoc(docRef, document);
  } catch (error) {
    console.error('Error saving document to cloud:', error);
  }
}

export async function deleteDocumentFromCloud(userId: string, id: string) {
  try {
    const docRef = doc(db, 'users', userId, 'documents', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document from cloud:', error);
  }
}

export async function saveMultipleProductsToCloud(userId: string, products: Product[]) {
  try {
    const batch = writeBatch(db);
    products.forEach(p => {
      const ref = doc(db, 'users', userId, 'products', p.id);
      batch.set(ref, p);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error saving multiple products to cloud:', error);
  }
}
