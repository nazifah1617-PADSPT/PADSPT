
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs,
  query,
  limit
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MEMBERS_COLL = "members";
const MOSQUES_COLL = "mosques";
const USERS_COLL = "users";

export const subscribeMembers = (callback: (data: CommitteeMember[]) => void) => {
  return onSnapshot(collection(db, MEMBERS_COLL), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as CommitteeMember);
    callback(data);
  }, (err) => {
    console.error("Firestore Error:", err);
  });
};

export const subscribeMosques = (callback: (data: MosqueInfo[]) => void) => {
  return onSnapshot(collection(db, MOSQUES_COLL), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as MosqueInfo);
    callback(data);
  }, (err) => {
    console.error("Firestore Error (Mosques):", err);
  });
};

export const subscribeUsers = (callback: (data: User[]) => void) => {
  return onSnapshot(collection(db, USERS_COLL), (snapshot) => {
    const data = snapshot.docs.map(doc => doc.data() as User);
    callback(data);
  }, (err) => {
    console.error("Firestore Error (Users):", err);
  });
};

export const saveMemberToDb = async (member: CommitteeMember) => {
  try {
    await setDoc(doc(db, MEMBERS_COLL, member.id), member);
  } catch (err) {
    console.error("Gagal simpan ke Cloud Firestore:", err);
    throw err;
  }
};

export const deleteMemberFromDb = async (id: string) => {
  try {
    await deleteDoc(doc(db, MEMBERS_COLL, id));
  } catch (err) {
    console.error("Gagal padam dari Firestore:", err);
    throw err;
  }
};

export const saveMosqueToDb = async (mosque: MosqueInfo) => {
  try {
    await setDoc(doc(db, MOSQUES_COLL, mosque.id), mosque);
  } catch (err) {
    console.error("Gagal simpan lokasi:", err);
    throw err;
  }
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
    const users = snapshot.docs.map(doc => doc.data() as User);
    if (users.length === 0) {
      // Maklumat log masuk lalai yang baru
      return [{ 
        id: 'admin-primary', 
        email: 'ahmadhafizan@penang.gov.my', 
        password: 'uItm2008254962', 
        role: 'superadmin' 
      }];
    }
    return users;
  } catch (err) {
    return [{ 
      id: 'admin-primary', 
      email: 'ahmadhafizan@penang.gov.my', 
      password: 'uItm2008254962', 
      role: 'superadmin' 
    }];
  }
};
