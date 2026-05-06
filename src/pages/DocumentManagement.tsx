import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { FileText, Search, Plus, Edit3, Trash2, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { DocumentModal } from '../components/ui/DocumentModal';
import { logActivity } from '../services/auditService';

export default function DocumentManagement() {
  const { isSuperAdmin } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'document_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'document_records');
    });
    return unsubscribe;
  }, []);

  const handleEdit = (p: any) => {
    setSelectedDocument(p);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedDocument(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tajuk: string) => {
    if (!isSuperAdmin) {
      alert("Hanya Super Admin dibenarkan memadam rekod.");
      return;
    }
    if (confirm(`Adakah anda pasti untuk memadam rekod dokumen "${tajuk}"?`)) {
      try {
        await deleteDoc(doc(db, 'document_records', id));
        await logActivity('DELETE', `Memadam rekod dokumen: ${tajuk}`);
      } catch (error) {
        console.error("Delete error:", error);
        alert("Ralat semasa memadam rekod");
      }
    }
  };

  const filteredDocuments = documents.filter(d => {
    const matchSearch = d.tajuk?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.namaPihak?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchJenis = selectedJenis === 'Semua' || d.jenisRekod === selectedJenis;
    
    return matchSearch && matchJenis;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Dokumen</h1>
          <p className="text-slate-500">Rekod terimaan dan edaran dokumen berkaitan Kariah, Surau, Pegawai & JHEAIPP.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gov-blue/20 transition-all font-medium"
        >
          <Plus size={20} /> REKOD DOKUMEN BARU
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Cari Tajuk Dokumen atau Nama Pihak Berkaitan..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-gov-blue/20 transition-all font-medium outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 min-w-max">
          {['Semua', 'Terimaan', 'Edaran'].map(jenis => (
            <button
              key={jenis}
              onClick={() => setSelectedJenis(jenis)}
              className={cn(
                "px-6 py-3 rounded-xl font-bold transition-all text-sm",
                selectedJenis === jenis 
                  ? "bg-gov-blue text-white shadow-md shadow-gov-blue/20" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
              )}
            >
              {jenis.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Tarikh & Masa</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Jenis Dokumen</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Perkara / Tajuk</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Pihak Berkaitan</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-400">Status & Tindakan</th>
                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-slate-400">Menu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                    <p className="mt-4 text-slate-500 font-medium text-sm">Memuat turun rekod dokumen...</p>
                  </td>
                </tr>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{d.tarikh}</div>
                      <div className="text-xs text-slate-500">{d.jam}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {d.jenisRekod === 'Terimaan' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <ArrowDownLeft size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <ArrowUpRight size={16} />
                          </div>
                        )}
                        <div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                            d.jenisRekod === 'Terimaan' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {d.jenisRekod}
                          </span>
                          <div className="text-xs text-slate-500 mt-0.5">{d.kategoriDokumen}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 max-w-[250px] line-clamp-2" title={d.tajuk}>{d.tajuk}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{d.entitiBerkaitan}</div>
                      {(d.namaPihak || d.subEntiti) && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] line-clamp-2">
                          {d.subEntiti && `${d.subEntiti} - `}{d.namaPihak}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 text-[10px] font-bold rounded-md uppercase",
                        d.status === 'Selesai' ? "bg-emerald-100 text-emerald-700" :
                        d.status === 'Dalam Proses' ? "bg-blue-100 text-blue-700" :
                        d.status === 'Ditolak' ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {d.status}
                      </span>
                      {d.tindakan && (
                         <p className="text-xs text-slate-500 mt-2 max-w-[200px] line-clamp-2" title={d.tindakan}>{d.tindakan}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(d)}
                          className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all"
                          title="Kemaskini"
                        >
                          <Edit3 size={18} />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDelete(d.id, d.tajuk)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Padam"
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">Tiada rekod dokumen dijumpai.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedDocument}
      />
    </div>
  );
}
