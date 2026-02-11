
import { CommitteeMember, MosqueInfo, User } from "../types";

const MEMBERS_KEY = "mymasjid_members_v1";
const MOSQUES_KEY = "mymasjid_mosques_v1";
const USERS_KEY = "mymasjid_users_v1";

const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('mymasjid_data_changed', { detail: { key } }));
};

// Seeding default admin if no users exist
if (getLocalData(USERS_KEY).length === 0) {
  setLocalData(USERS_KEY, [{
    id: 'admin-default',
    username: 'admin',
    password: 'admin123',
    role: 'superadmin'
  }]);
}

export const subscribeMembers = (callback: (data: CommitteeMember[]) => void) => {
  callback(getLocalData<CommitteeMember>(MEMBERS_KEY));
  const handler = (e: any) => e.detail.key === MEMBERS_KEY && callback(getLocalData<CommitteeMember>(MEMBERS_KEY));
  window.addEventListener('mymasjid_data_changed', handler);
  return () => window.removeEventListener('mymasjid_data_changed', handler);
};

export const subscribeMosques = (callback: (data: MosqueInfo[]) => void) => {
  callback(getLocalData<MosqueInfo>(MOSQUES_KEY));
  const handler = (e: any) => e.detail.key === MOSQUES_KEY && callback(getLocalData<MosqueInfo>(MOSQUES_KEY));
  window.addEventListener('mymasjid_data_changed', handler);
  return () => window.removeEventListener('mymasjid_data_changed', handler);
};

export const subscribeUsers = (callback: (data: User[]) => void) => {
  callback(getLocalData<User>(USERS_KEY));
  const handler = (e: any) => e.detail.key === USERS_KEY && callback(getLocalData<User>(USERS_KEY));
  window.addEventListener('mymasjid_data_changed', handler);
  return () => window.removeEventListener('mymasjid_data_changed', handler);
};

export const saveMemberToDb = async (member: CommitteeMember) => {
  const members = getLocalData<CommitteeMember>(MEMBERS_KEY);
  const index = members.findIndex(m => m.id === member.id);
  index >= 0 ? (members[index] = member) : members.push(member);
  setLocalData(MEMBERS_KEY, members);
};

export const deleteMemberFromDb = async (id: string) => {
  setLocalData(MEMBERS_KEY, getLocalData<CommitteeMember>(MEMBERS_KEY).filter(m => m.id !== id));
};

export const saveMosqueToDb = async (mosque: MosqueInfo) => {
  const mosques = getLocalData<MosqueInfo>(MOSQUES_KEY);
  const index = mosques.findIndex(m => m.id === mosque.id);
  index >= 0 ? (mosques[index] = mosque) : mosques.push(mosque);
  setLocalData(MOSQUES_KEY, mosques);
};

export const deleteMosqueFromDb = async (id: string) => {
  setLocalData(MOSQUES_KEY, getLocalData<MosqueInfo>(MOSQUES_KEY).filter(m => m.id !== id));
};

export const saveUserToDb = async (user: User) => {
  const users = getLocalData<User>(USERS_KEY);
  const index = users.findIndex(u => u.id === user.id);
  index >= 0 ? (users[index] = user) : users.push(user);
  setLocalData(USERS_KEY, users);
};

export const deleteUserFromDb = async (id: string) => {
  const users = getLocalData<User>(USERS_KEY);
  if (users.length <= 1) throw new Error("Tidak boleh memadam pengguna terakhir.");
  setLocalData(USERS_KEY, users.filter(u => u.id !== id));
};

export const getAllUsers = (): User[] => getLocalData<User>(USERS_KEY);
