import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { User, Video, Comment, Playlist, Notification, HistoryItem } from '../../types';

let firestoreDb: Firestore | null = null;

export const initFirebase = (): Firestore | null => {
  if (firestoreDb) return firestoreDb;

  try {
    let config: any = null;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else if (process.env.FIREBASE_CONFIG) {
      try {
        config = JSON.parse(process.env.FIREBASE_CONFIG);
      } catch (e) {
        console.warn('[Firebase] Invalid FIREBASE_CONFIG env variable');
      }
    }

    // Default configuration fallback
    if (!config || !config.projectId) {
      config = {
        projectId: "basic-turbine-6ds98",
        appId: "1:809591251353:web:17083d93d9b40c2a4fb308",
        apiKey: "AIzaSyAPz9i-rQe41HDmAAaES8t83bJHm8U0hjk",
        authDomain: "basic-turbine-6ds98.firebaseapp.com",
        firestoreDatabaseId: "ai-studio-viewpoint-ec293ec6-f0e0-4f4a-9738-6f4651c0750c",
        storageBucket: "basic-turbine-6ds98.firebasestorage.app",
        messagingSenderId: "809591251353"
      };
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    const dbId = config.firestoreDatabaseId;
    firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
    console.log(`[Firebase] Connected to Firestore database: ${dbId || '(default)'} (Project: ${config.projectId})`);
    return firestoreDb;
  } catch (err: any) {
    console.warn('[Firebase] Initialization error:', err?.message || err);
    return null;
  }
};

export class FirestoreSync {
  private db: Firestore | null = null;

  constructor() {
    this.db = initFirebase();
  }

  isAvailable(): boolean {
    return this.db !== null;
  }

  // Load collection
  async loadCollection<T extends { _id: string }>(collectionName: string): Promise<T[]> {
    if (!this.db) return [];
    try {
      const colRef = collection(this.db, collectionName);
      const snapshot = await getDocs(colRef);
      const items: T[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as T;
        items.push({ ...data, _id: docSnap.id });
      });
      console.log(`[Firebase] Loaded ${items.length} items from collection '${collectionName}'`);
      return items;
    } catch (err: any) {
      console.warn(`[Firebase] Error loading collection '${collectionName}':`, err?.message || err);
      return [];
    }
  }

  // Save/Update item
  async saveDoc<T extends { _id: string }>(collectionName: string, item: T): Promise<void> {
    if (!this.db || !item._id) return;
    try {
      const docRef = doc(this.db, collectionName, String(item._id));
      await setDoc(docRef, JSON.parse(JSON.stringify(item)), { merge: true });
    } catch (err: any) {
      console.warn(`[Firebase] Error saving doc '${item._id}' to '${collectionName}':`, err?.message || err);
    }
  }

  // Delete item
  async deleteDoc(collectionName: string, docId: string): Promise<void> {
    if (!this.db || !docId) return;
    try {
      const docRef = doc(this.db, collectionName, String(docId));
      await deleteDoc(docRef);
    } catch (err: any) {
      console.warn(`[Firebase] Error deleting doc '${docId}' from '${collectionName}':`, err?.message || err);
    }
  }
}

export const firestoreSync = new FirestoreSync();
