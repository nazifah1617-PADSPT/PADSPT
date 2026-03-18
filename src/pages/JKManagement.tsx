import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logActivity } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  UserPlus,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { cn, formatIC } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { JKModal } from '../components/ui/JKModal';

export default function JKManagement() {
  const { isSuperAdmin } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'jk_records'), orderBy('updatedAt', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) return;
    if (confirm(`Adakah anda pasti untuk memadam rekod ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'jk_records', id));
        await logActivity('DELETE', `Memadam rekod JK: ${name}`);
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleEdit = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.namaPenuh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.noKP?.includes(searchTerm) ||
                         r.masjidName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'Semua' || r.statusLantikan === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan JK Kariah</h1>
          <p className="text-slate-500">Kawal selia data ahli jawatankuasa kariah masjid.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-gov-blue text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 hover:bg-gov-blue/90 transition-all"
        >
          <UserPlus size={20} />
          TAMBAH JK BARU
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari Nama, No. KP atau Masjid..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {['Semua', 'Aktif', 'Tamat tempoh', 'Letak jawatan', 'Meninggal dunia'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                selectedStatus === status 
                  ? "bg-gov-blue text-white shadow-md" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRecords.map((jk) => (
            <motion.div
              key={jk.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  jk.statusLantikan === 'Aktif' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                )}>
                  <Users size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(jk)}
                    className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-50 rounded-lg transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleDelete(jk.id, jk.namaPenuh)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1">{jk.namaPenuh}</h3>
              <p className="text-xs font-mono text-slate-400 mb-4">{formatIC(jk.noKP)}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="font-medium truncate">{jk.masjidName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="font-medium truncate">{jk.daerah}, {jk.parlimen}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-medium">Jawatan: {jk.jawatan}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  jk.statusLantikan === 'Aktif' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>
                  {jk.statusLantikan}
                </span>
                <p className="text-[10px] text-slate-300 font-medium">
                  Dikemaskini: {jk.updatedAt?.toDate()?.toLocaleDateString('ms-MY')}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <JKModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedRecord} 
      />

      {filteredRecords.length === 0 && !loading && (
        <div className="bg-white p-20 rounded-3xl border border-slate-100 text-center">
          <Users size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">Tiada Rekod</h3>
          <p className="text-slate-500">Sila cuba carian lain atau tambah rekod baru.</p>
        </div>
      )}
    </div>
  );
}

