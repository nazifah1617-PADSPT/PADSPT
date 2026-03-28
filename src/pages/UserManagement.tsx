import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
// @ts-ignore
import firebaseConfig from '../../firebase-applet-config.json';
import { Settings, Search, Plus, User, Shield, Edit3, Trash2, Loader2, Mail, X, Save, AlertCircle, CheckCircle2, Key, Eye, EyeOff } from 'lucide-react';
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
  const [formData, setFormData] = useState({ name: '', email: '', role: 'ADMIN', password: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (email: string) => {
    setShowPasswords(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const handleResetPassword = async (email: string) => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`Emel tetapan semula kata laluan telah dihantar ke ${email}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await logActivity('RESET_PASSWORD', `Menghantar emel tetapan semula kata laluan kepada: ${email}`);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setErrorMessage(`Gagal menghantar emel: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Bootstrap requested admins in Firestore
  useEffect(() => {
    const bootstrapAdmins = async () => {
      // List of initial admins to ensure are in the system
      const requestedEmails = [
        { name: 'Admin JHEAIPP', email: 'admin@penang.gov.my' },
        { name: 'Super Admin', email: 'photonazifah1617@gmail.com' }
      ];

      try {
        for (const admin of requestedEmails) {
          const adminDoc = await getDoc(doc(db, 'admin_users', admin.email));
          
          if (!adminDoc.exists()) {
            // Check if they are already in users collection
            const uQ = query(collection(db, 'users'), where('email', '==', admin.email));
            const uSnap = await getDocs(uQ);
            
            if (uSnap.empty) {
              await setDoc(doc(db, 'admin_users', admin.email), {
                name: admin.name,
                email: admin.email,
                role: admin.email === 'photonazifah1617@gmail.com' ? 'SUPER_ADMIN' : 'ADMIN',
                password: 'Password123!', // Default password for bootstrapped accounts
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              console.log(`Bootstrapped admin: ${admin.email}`);
            } else {
              // Update existing user role
              await updateDoc(doc(db, 'users', uSnap.docs[0].id), {
                role: 'ADMIN',
                updatedAt: serverTimestamp()
              });
            }
          }
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
      }
    };

    bootstrapAdmins();
  }, []);

  useEffect(() => {
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
      setFormData({ 
        name: user.name || '', 
        email: user.email || '', 
        role: user.role || 'ADMIN',
        password: user.password || '' 
      });
    } else {
      setSelectedUser(null);
      setFormData({ name: '', email: '', role: 'ADMIN', password: '' });
    }
    setIsModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, email: string, type: string} | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const normalizedEmail = formData.email.toLowerCase().trim();
    const updatedFormData = { ...formData, email: normalizedEmail };

    try {
      // Prevent changing role of main Super Admin
      if (selectedUser && selectedUser.email.toLowerCase() === 'photonazifah1617@gmail.com' && formData.role !== 'SUPER_ADMIN') {
        setErrorMessage("Peranan Super Admin utama tidak boleh diubah.");
        setSaving(false);
        return;
      }

      // Use a secondary app instance for Auth operations to avoid logging out current user
      let secondaryApp;
      const apps = getApps();
      const existingApp = apps.find(a => a.name === 'SecondaryAuth');
      if (existingApp) {
        secondaryApp = existingApp;
      } else {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuth');
      }
      const secondaryAuth = getAuth(secondaryApp);

      if (selectedUser) {
        if (selectedUser.type === 'PENDING') {
          // Update the pending invite in admin_users
          await updateDoc(doc(db, 'admin_users', selectedUser.id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });

          // If password is changed, try to update Auth if we have the old one or if it's a new creation
          if (formData.password && formData.password !== selectedUser.password) {
            try {
              // This is tricky without Admin SDK, but if it's still PENDING, 
              // we might be able to just create it if it didn't exist or re-auth
              await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, formData.password);
            } catch (e) {
              // If already exists, we can't easily update it from here without old password
              console.warn("Could not update Auth password for pending user, they may need to use reset email.");
            }
          }
        } else {
          // Update the registered user document directly
          await updateDoc(doc(db, 'users', selectedUser.id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });
          
          // Also sync to admin_users if they are now an admin
          if (formData.role === 'ADMIN' || formData.role === 'SUPER_ADMIN') {
            await setDoc(doc(db, 'admin_users', normalizedEmail), {
              ...updatedFormData,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else {
            // If role changed to USER, remove from admin_users
            await deleteDoc(doc(db, 'admin_users', normalizedEmail));
          }
        }
        
        await logActivity('UPDATE_USER', `Mengemaskini peranan pengguna: ${normalizedEmail} kepada ${formData.role}`);
      } else {
        // Manual add - check if user already exists in Auth
        try {
          if (formData.password) {
            await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, formData.password);
            console.log("Auth user created successfully");
          }
        } catch (authErr: any) {
          if (authErr.code !== 'auth/email-already-in-use') {
            console.error("Auth creation error:", authErr);
            // We continue anyway to save to Firestore, but maybe show warning
          }
        }

        const userQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
        const userSnap = await getDocs(userQuery);
        
        if (!userSnap.empty) {
          await updateDoc(doc(db, 'users', userSnap.docs[0].id), {
            ...updatedFormData,
            updatedAt: serverTimestamp()
          });
        } else {
          // If they don't exist yet, we add to admin_users so they get the role when they first log in
          await setDoc(doc(db, 'admin_users', normalizedEmail), {
            ...updatedFormData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        
        await logActivity('ADD_USER', `Menambah/Mengemaskini akses: ${normalizedEmail}`);
      }
      setSuccessMessage(`Berjaya menyimpan akses untuk ${normalizedEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
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
    
    // Prevent deleting the main Super Admin
    if (userToDelete.email.toLowerCase() === 'photonazifah1617@gmail.com') {
      setErrorMessage("Akaun Super Admin utama tidak boleh dipadam.");
      setIsDeleteModalOpen(false);
      return;
    }

    setSaving(true);
    try {
      if (userToDelete.type === 'PENDING') {
        await deleteDoc(doc(db, 'admin_users', userToDelete.email.toLowerCase()));
      } else {
        await deleteDoc(doc(db, 'users', userToDelete.id));
        
        // Also remove from admin_users
        await deleteDoc(doc(db, 'admin_users', userToDelete.email.toLowerCase()));
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
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 transition-all"
          >
            <Plus size={20} /> TAMBAH ADMIN BARU
          </button>
        </div>
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

      {/* Global Feedback */}
      <AnimatePresence>
        {(errorMessage || successMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-2xl w-full space-y-2">
              {errorMessage && (
                <div className="p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3 shadow-2xl border border-red-500">
                  <AlertCircle size={24} className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Ralat</p>
                    <p className="text-sm opacity-90">{errorMessage}</p>
                  </div>
                  <button onClick={() => setErrorMessage(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}
              {successMessage && (
                <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 shadow-2xl border border-emerald-500">
                  <CheckCircle2 size={24} className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Berjaya</p>
                    <p className="text-sm opacity-90">{successMessage}</p>
                  </div>
                  <button onClick={() => setSuccessMessage(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Users Alert */}
      {users.some(u => u.role === 'USER' || !u.role) && (
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
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Katalaluan</th>
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
                      <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 min-w-[100px] text-center">
                        {showPasswords[u.email] ? (u.password || 'N/A') : '••••••••'}
                      </span>
                      <button 
                        onClick={() => togglePasswordVisibility(u.email)}
                        className="p-1 text-slate-400 hover:text-gov-blue transition-colors"
                        title={showPasswords[u.email] ? "Sembunyi Katalaluan" : "Lihat Katalaluan"}
                      >
                        {showPasswords[u.email] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
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
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase w-fit">
                          DIJEMPUT (BELUM LOG MASUK)
                        </span>
                        <p className="text-[9px] text-amber-600 font-medium italic leading-tight">
                          *Akses Admin telah diberikan. Status akan bertukar kepada 'AKTIF' selepas pengguna log masuk buat kali pertama.
                        </p>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
                        AKTIF
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleResetPassword(u.email)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Hantar Emel Reset Password"
                      >
                        <Key size={18} />
                      </button>
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
                {successMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    {successMessage}
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
                    disabled={selectedUser?.email.toLowerCase() === 'photonazifah1617@gmail.com'}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium disabled:opacity-50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Katalaluan</label>
                  <input 
                    type="text"
                    required={!selectedUser}
                    placeholder={selectedUser ? "Tinggalkan kosong jika tiada perubahan" : "Masukkan katalaluan"}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">*Katalaluan ini akan disimpan untuk rujukan Super Admin.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Peranan (Role)</label>
                  <select 
                    disabled={selectedUser?.email.toLowerCase() === 'photonazifah1617@gmail.com'}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium disabled:opacity-50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">PENGGUNA BIASA (Carian Sahaja)</option>
                    <option value="ADMIN">ADMIN (Boleh Edit, Tiada Padam)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Akses Penuh)</option>
                  </select>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={() => handleResetPassword(formData.email)}
                    disabled={saving || !formData.email}
                    className="w-full px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-100"
                  >
                    <Key size={18} />
                    HANTAR EMEL RESET PASSWORD
                  </button>
                  <div className="flex gap-3">
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
