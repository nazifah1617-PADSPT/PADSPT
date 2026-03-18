import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Settings, Search, Plus, User, Shield, Edit3, Trash2, Loader2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'admin_users'), orderBy('email', 'asc'), limit(50));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Admin</h1>
          <p className="text-slate-500">Kawal akses pegawai ke dalam sistem e-Kariah.</p>
        </div>
        <button className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 transition-all">
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
            ) : users.length > 0 ? (
              users.map((u) => (
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
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
                      AKTIF
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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
    </div>
  );
}
