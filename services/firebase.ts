
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs,
  enableNetwork,
  disableNetwork,
  initializeFirestore,
  Firestore
} from "firebase/firestore";
import { CommitteeMember, MosqueInfo, User } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyD2gJmtlROsWbVH9Wu5vj1dFk_yikb-i0M",
  authDomain: "data-kariah-spt.firebaseapp.com",
  projectId: "data-kariah-spt",
  storageBucket: "data-kariah-spt.firebasestorage.app",
  messagingSenderId: "722689795539",
  appId: "1:722689795539:web:34a96856b152426cb0fb26",
  measurementId: "G-FQ3B3VYCX4"
};

// Inisialisasi Firebase App secara selamat
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore
// Guna getFirestore() terus selalunya lebih stabil jika tiada version mismatch
let db: Firestore;
try {
  db = getFirestore(app);
} catch (e) {
  // Fallback jika perlukan inisialisasi paksa
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
}

const MEMBERS_COLL = "members";
const MOSQUES_COLL = "mosques";
const USERS_COLL = "users";

const sanitizeData = <T>(d: any): T => ({ ...d.data(), id: d.id } as T);

export const resetConnection = async () => {
  try {
    await disableNetwork(db);
    await enableNetwork(db);
  } catch (e) {
    console.error("Network reset failed", e);
  }
};

export const subscribeMembers = (callback: (data: CommitteeMember[]) => void) => {
  return onSnapshot(collection(db, MEMBERS_COLL), (snapshot) => {
    callback(snapshot.docs.map(doc => sanitizeData<CommitteeMember>(doc)));
  }, (err) => {
    console.error("Firestore Error (Members):", err);
  });
};

export const subscribeMosques = (callback: (data: MosqueInfo[]) => void) => {
  return onSnapshot(collection(db, MOSQUES_COLL), (snapshot) => {
    callback(snapshot.docs.map(doc => sanitizeData<MosqueInfo>(doc)));
  }, (err) => console.error("Firestore Error (Mosques):", err));
};

export const subscribeUsers = (callback: (data: User[]) => void) => {
  return onSnapshot(collection(db, USERS_COLL), (snapshot) => {
    callback(snapshot.docs.map(doc => sanitizeData<User>(doc)));
  }, (err) => console.error("Firestore Error (Users):", err));
};

export const saveMemberToDb = async (member: CommitteeMember) => {
  await setDoc(doc(db, MEMBERS_COLL, member.id), member);
};

export const deleteMemberFromDb = async (id: string) => {
  await deleteDoc(doc(db, MEMBERS_COLL, id));
};

export const saveMosqueToDb = async (mosque: MosqueInfo) => {
  await setDoc(doc(db, MOSQUES_COLL, mosque.id), mosque);
};

export const deleteMosqueFromDb = async (id: string) => {
  await deleteDoc(doc(db, MOSQUES_COLL, id));
};

export const saveUserToDb = async (user: User) => {
  await setDoc(doc(db, USERS_COLL, user.id), user);
};

export const deleteUserFromDb = async (id: string) => {
  await deleteDoc(doc(db, USERS_COLL, id));
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLL));
    const users = snapshot.docs.map(doc => sanitizeData<User>(doc));
    return users.length > 0 ? users : [{ 
      id: 'admin-primary', 
      email: 'ahmadhafizan@penang.gov.my', 
      password: 'uItm2008254962', 
      role: 'superadmin' 
    }];
  } catch {
    return [{ 
      id: 'admin-primary', 
      email: 'ahmadhafizan@penang.gov.my', 
      password: 'uItm2008254962', 
      role: 'superadmin' 
    }];
  }
};
