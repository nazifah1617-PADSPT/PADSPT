import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Building2, Search, Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MasjidModal } from '../components/ui/MasjidModal';
import { logActivity } from '../services/auditService';

export default function MasjidManagement() {
  const { isSuperAdmin } = useAuth();
  const [masjid, setMasjid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMasjid, setSelectedMasjid] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'masjid_records'), orderBy('nama', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMasjid(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'masjid_records');
    });
    return unsubscribe;
  }, []);

  const handleEdit = (m: any) => {
    setSelectedMasjid(m);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMasjid(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert("Hanya Super Admin dibenarkan memadam rekod.");
      return;
    }
    if (confirm(`Adakah anda pasti untuk memadam rekod masjid ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'masjid_records', id));
        await logActivity('DELETE_MASJID', `Memadam rekod masjid: ${name}`);
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const filteredMasjid = masjid.filter(m => 
    m.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.kod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.noFail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.daerah?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Masjid</h1>
          <p className="text-slate-500">Senarai masjid berdaftar di bawah Jabatan Hal Ehwal Agama Islam Pulau Pinang.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 transition-all"
        >
          <Plus size={20} /> TAMBAH MASJID BARU
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Cari Nama Masjid, No. Pendaftaran, No. Fail atau Daerah..."
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
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Nama Masjid</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">No. Pendaftaran</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">No. Fail</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Daerah</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Parlimen / DUN</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                  <p className="mt-4 text-slate-400 font-medium">Memuatkan data masjid...</p>
                </td>
              </tr>
            ) : filteredMasjid.length > 0 ? (
              filteredMasjid.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gov-blue/5 rounded-xl flex items-center justify-center text-gov-blue relative">
                        <Building2 size={20} />
                        {m.latitude && m.longitude && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-islamic-green rounded-full border-2 border-white" title="Koordinat Tersedia" />
                        )}
                      </div>
                      <p className="font-bold text-slate-900">{m.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600 uppercase">{m.kod}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">{m.noFail || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                      {m.daerah}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">{m.parlimen}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{m.dun}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(m)}
                        className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      {isSuperAdmin && (
                        <button 
                          onClick={() => handleDelete(m.id, m.nama)}
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
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                  Tiada rekod masjid dijumpai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MasjidModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedMasjid} 
      />
    </div>
  );
}
