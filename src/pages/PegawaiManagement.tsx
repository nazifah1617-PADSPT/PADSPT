import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCheck, Search, Plus, Building2, Phone, Edit3, Trash2, Loader2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { PegawaiModal } from '../components/ui/PegawaiModal';
import { logActivity } from '../services/auditService';

export default function PegawaiManagement() {
  const { isSuperAdmin } = useAuth();
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'pegawai_records'), orderBy('nama', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPegawai(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleEdit = (p: any) => {
    setSelectedPegawai(p);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPegawai(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Adakah anda pasti untuk memadam rekod pegawai ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'pegawai_records', id));
        await logActivity('DELETE_PEGAWAI', `Memadam rekod pegawai: ${name}`);
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const filteredPegawai = pegawai.filter(p => 
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.noKP?.includes(searchTerm) ||
    p.masjidName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Pegawai Masjid</h1>
          <p className="text-slate-500">Senarai Imam, Bilal, dan Noja berdaftar di seluruh Pulau Pinang.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 transition-all"
        >
          <Plus size={20} /> TAMBAH PEGAWAI BARU
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Cari Nama Pegawai, No. KP atau Masjid..."
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
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Nama Pegawai</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">No. KP</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Jawatan</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Masjid</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                  <p className="mt-4 text-slate-400 font-medium">Memuatkan data pegawai...</p>
                </td>
              </tr>
            ) : filteredPegawai.length > 0 ? (
              filteredPegawai.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gov-blue/5 rounded-xl flex items-center justify-center text-gov-blue">
                        <UserCheck size={20} />
                      </div>
                      <p className="font-bold text-slate-900">{p.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.noKP}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gov-blue/10 text-gov-blue text-[10px] font-bold rounded-md uppercase">
                      {p.jawatan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">{p.masjidName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{p.daerah}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      {isSuperAdmin && (
                        <button 
                          onClick={() => handleDelete(p.id, p.nama)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  Tiada rekod pegawai dijumpai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PegawaiModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedPegawai} 
      />
    </div>
  );
}
