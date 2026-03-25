import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings, Search, Plus, User, Shield, Edit3, Trash2, Loader2, Mail, X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { logActivity } from '../services/auditService';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'ADMIN' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch all users from the 'users' collection
    const qUsers = query(collection(db, 'users'), limit(500));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'REGISTERED' })));
      setLoading(false);
    });

    // Fetch pending admins from 'admin_users'
    const qAdmin = query(collection(db, 'admin_users'), limit(100));
    const unsubAdmin = onSnapshot(qAdmin, (snap) => {
      setPendingAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'PENDING' })));
    });

    return () => {
      unsubUsers();
      unsubAdmin();
    };
  }, []);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({ name: user.name || '', email: user.email || '', role: user.role || 'ADMIN' });
    } else {
      setSelectedUser(null);
      setFormData({ name: '', email: '', role: 'ADMIN' });
    }
    setIsModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, email: string, type: string} | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    const normalizedEmail = formData.email.toLowerCase().trim();
    const updatedFormData = { ...formData, email: normalizedEmail };

    try {
      if (selectedUser) {
        if (selectedUser.type === 'PENDING') {
          // Update the pending invite in admin_users
          await updateDoc(doc(db, 'admin_users', selectedUser.id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });
        } else {
          // Update the registered user document directly
          await updateDoc(doc(db, 'users', selectedUser.id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });
          
          // Also sync to admin_users if they are now an admin
          if (formData.role === 'ADMIN' || formData.role === 'SUPER_ADMIN') {
            const adminQuery = query(collection(db, 'admin_users'), where('email', '==', normalizedEmail));
            const adminSnap = await getDocs(adminQuery);
            if (adminSnap.empty) {
              await addDoc(collection(db, 'admin_users'), {
                ...updatedFormData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } else {
              await updateDoc(doc(db, 'admin_users', adminSnap.docs[0].id), {
                ...updatedFormData,
                updatedAt: serverTimestamp()
              });
            }
          } else {
            // If role changed to USER, remove from admin_users
            const adminQuery = query(collection(db, 'admin_users'), where('email', '==', normalizedEmail));
            const adminSnap = await getDocs(adminQuery);
            if (!adminSnap.empty) {
              await deleteDoc(doc(db, 'admin_users', adminSnap.docs[0].id));
            }
          }
        }
        
        await logActivity('UPDATE_USER', `Mengemaskini peranan pengguna: ${normalizedEmail} kepada ${formData.role}`);
      } else {
        // Manual add - check if user already exists
        const userQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
        const userSnap = await getDocs(userQuery);
        
        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });
        } else {
          // If they don't exist yet, we add to admin_users so they get the role when they first log in
          await addDoc(collection(db, 'admin_users'), {
            ...updatedFormData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        await logActivity('ADD_USER', `Menambah/Mengemaskini akses: ${normalizedEmail}`);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage("Gagal menyimpan data pengguna. Sila cuba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, email: string, type: string) => {
    setUserToDelete({ id, email, type });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setSaving(true);
    try {
      if (userToDelete.type === 'PENDING') {
        await deleteDoc(doc(db, 'admin_users', userToDelete.id));
      } else {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        
        // Also remove from admin_users
        const adminQuery = query(collection(db, 'admin_users'), where('email', '==', userToDelete.email.toLowerCase()));
        const adminSnap = await getDocs(adminQuery);
        if (!adminSnap.empty) {
          await deleteDoc(doc(db, 'admin_users', adminSnap.docs[0].id));
        }
      }
      
      await logActivity('DELETE_USER', `Memadam akses: ${userToDelete.email}`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage("Gagal memadam data pengguna.");
    } finally {
      setSaving(false);
    }
  };

  const combinedUsers = React.useMemo(() => {
    const list = [...users];
    
    // Add pending admins if they aren't already in the users list
    pendingAdmins.forEach(pending => {
      const exists = users.find(u => u.email?.toLowerCase() === pending.email?.toLowerCase());
      if (!exists) {
        list.push(pending);
      }
    });

    return list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [users, pendingAdmins]);

  const filteredUsers = combinedUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Admin</h1>
          <p className="text-slate-500">Kawal akses pegawai ke dalam sistem e-Kariah.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 transition-all"
        >
          <Plus size={20} /> TAMBAH ADMIN BARU
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Cari Nama atau Email Admin..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* New Users Alert */}
      {users.some(u => u.role === 'USER') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Terdapat Pengguna Baru</h3>
              <p className="text-amber-700 text-sm">Beberapa pengguna telah mendaftar secara automatik tetapi belum mempunyai akses pentadbir.</p>
            </div>
          </div>
          <button 
            onClick={() => setSearchTerm('USER')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
          >
            LIHAT PENGGUNA BARU
          </button>
        </motion.div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-bottom border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Nama Admin</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Email Rasmi</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Peranan (Role)</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                  <p className="mt-4 text-slate-400 font-medium">Memuatkan data admin...</p>
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} />
                      <span className="text-sm">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className={u.role === 'SUPER_ADMIN' ? "text-gov-gold" : "text-gov-blue"} />
                      <span className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded-md uppercase",
                        u.role === 'SUPER_ADMIN' ? "bg-gov-gold/10 text-gov-gold" : "bg-gov-blue/10 text-gov-blue"
                      )}>
                        {u.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.type === 'PENDING' ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">
                        DIJEMPUT (BELUM LOG MASUK)
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
                        AKTIF
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(u)}
                        className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(u.id, u.email, u.type)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  Tiada rekod admin dijumpai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedUser ? 'Kemaskini Admin' : 'Tambah Admin Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} />
                    {errorMessage}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Penuh</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Rasmi</label>
                  <input 
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Peranan (Role)</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">PENGGUNA BIASA (Carian Sahaja)</option>
                    <option value="ADMIN">ADMIN (Boleh Edit, Tiada Padam)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Akses Penuh)</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    BATAL
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue/90 shadow-lg shadow-gov-blue/20 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    SIMPAN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Padam Akses?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Adakah anda pasti untuk memadam akses untuk <span className="font-bold text-slate-700">{userToDelete?.email}</span>? Tindakan ini tidak boleh diundur.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  BATAL
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                  PADAM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
