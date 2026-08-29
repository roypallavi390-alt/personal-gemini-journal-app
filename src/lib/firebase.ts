import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, JournalInsight } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References helpers
export const getUserEntriesCollection = (userId: string) => 
  collection(db, 'users', userId, 'entries');

export const getUserInsightsCollection = (userId: string) => 
  collection(db, 'users', userId, 'insights');

// Firestore DB operations with strict user isolation

/**
 * Save or update a journal entry for the authenticated user
 */
export async function saveJournalEntry(userId: string, entry: Partial<JournalEntry> & { id?: string }): Promise<string> {
  if (!userId) throw new Error('User ID is required for saving entries');

  const now = new Date().toISOString();
  
  if (entry.id) {
    const entryRef = doc(db, 'users', userId, 'entries', entry.id);
    const updateData: Partial<JournalEntry> = {
      ...entry,
      updatedAt: now,
    };
    await setDoc(entryRef, updateData, { merge: true });
    return entry.id;
  } else {
    const entriesCol = getUserEntriesCollection(userId);
    const newEntry: Omit<JournalEntry, 'id'> = {
      userId,
      title: entry.title || 'Untitled Reflection',
      summary: entry.summary || '',
      keyTakeaways: entry.keyTakeaways || [],
      mood: entry.mood || 'reflective',
      tags: entry.tags || [],
      messages: entry.messages || [],
      mode: entry.mode || 'freeform',
      createdAt: entry.createdAt || now,
      updatedAt: now,
    };
    const docRef = await addDoc(entriesCol, newEntry);
    return docRef.id;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Fetch a single journal entry
 */
export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as JournalEntry;
}

/**
 * Fetch all journal entries for a user ordered by updatedAt descending
 */
export async function getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const entriesCol = getUserEntriesCollection(userId);
  const q = query(entriesCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
}

/**
 * Save an AI Journal Insight report for the authenticated user
 */
export async function saveJournalInsight(userId: string, insight: Omit<JournalInsight, 'id'>): Promise<string> {
  if (!userId) throw new Error('User ID is required');
  const insightsCol = getUserInsightsCollection(userId);
  const docRef = await addDoc(insightsCol, insight);
  return docRef.id;
}

/**
 * Get all AI Journal Insights for a user
 */
export async function getUserJournalInsights(userId: string): Promise<JournalInsight[]> {
  if (!userId) return [];
  const insightsCol = getUserInsightsCollection(userId);
  const q = query(insightsCol, orderBy('createdAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalInsight));
}

export { 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile
};
