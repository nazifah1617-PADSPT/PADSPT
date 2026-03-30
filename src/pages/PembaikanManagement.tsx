import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit2, 
  Download, Filter, Calendar, Building2,
  FileDown, Loader2, X, Upload, Eye
} from 'lucide-react';
import { 
  collection, query, getDocs, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp,
  orderBy, where, Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PembaikanRecord {
  id: string;
  tajuk: string;
  tarikhTerima: string;
  tarikhHantar: string;
  catatan: string;
  failUrl: string;
  masjidSurauId: string;
  masjidSurauName: string;
  jenis: 'Masjid' | 'Surau';
  bulan: number;
  tahun: number;
  updatedBy: string;
  updatedAt: any;
}

interface Premis {
  id: string;
  nama: string;
  jenis: 'Masjid' | 'Surau';
}

export default function PembaikanManagement() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [records, setRecords] = useState<PembaikanRecord[]>([]);
  const [premisList, setPremisList] = useState<Premis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<PembaikanRecord> | null>(null);
  const [modalJenis, setModalJenis] = useState<'Masjid' | 'Surau' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterJenis, setFilterJenis] = useState('');
  const [filterPremis, setFilterPremis] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    fetchPremis();
  }, []);

  useEffect(() => {
    if (currentRecord?.jenis) {
      setModalJenis(currentRecord.jenis);
    }
  }, [currentRecord]);

  const fetchPremis = async () => {
    try {
      const masjids = await getDocs(collection(db, 'masjid_records'));
      const suraus = await getDocs(collection(db, 'surau_records'));
      
      const list: Premis[] = [
        ...masjids.docs.map(d => ({ id: d.id, nama: d.data().nama, jenis: 'Masjid' as const })),
        ...suraus.docs.map(d => ({ id: d.id, nama: d.data().nama, jenis: 'Surau' as const }))
      ];
      
      setPremisList(list.sort((a, b) => a.nama.localeCompare(b.nama)));
    } catch (error) {
      console.error("Error fetching premis:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const path = 'pembaikan_records';
    try {
      const q = query(collection(db, path), orderBy('tarikhTerima', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PembaikanRecord));
      setRecords(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord?.tajuk || !currentRecord?.tarikhTerima || !currentRecord?.masjidSurauId) return;

    setIsSubmitting(true);
    const path = 'pembaikan_records';
    try {
      const selectedPremis = premisList.find(p => p.id === currentRecord.masjidSurauId);
      const date = new Date(currentRecord.tarikhTerima);
      
      const data = {
        ...currentRecord,
        masjidSurauName: selectedPremis?.nama || '',
        jenis: selectedPremis?.jenis || 'Masjid',
        bulan: date.getMonth() + 1,
        tahun: date.getFullYear(),
        updatedBy: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      };

      if (currentRecord.id) {
        await updateDoc(doc(db, path, currentRecord.id), data);
      } else {
        await addDoc(collection(db, path), data);
      }

      setIsModalOpen(false);
      setCurrentRecord(null);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, currentRecord.id ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Adakah anda pasti ingin memadam rekod ini?")) return;
    const path = 'pembaikan_records';
    try {
      await deleteDoc(doc(db, path, id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const filtered = records.filter(r => {
      const matchJenis = !filterJenis || r.jenis === filterJenis;
      const matchPremis = !filterPremis || r.masjidSurauId === filterPremis;
      const matchMonth = !filterMonth || r.bulan === parseInt(filterMonth);
      const matchYear = !filterYear || r.tahun === parseInt(filterYear);
      return matchJenis && matchPremis && matchMonth && matchYear;
    });

    // Header
    doc.setFontSize(16);
    doc.text('LAPORAN REKOD PEMBAIKAN', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    
    let filterText = 'Semua Rekod';
    if (filterJenis || filterMonth || filterYear) {
      filterText = `Filter: ${filterJenis || 'Semua'} | ${filterMonth ? format(new Date(2000, parseInt(filterMonth)-1), 'MMMM') : 'Semua Bulan'} | ${filterYear}`;
    }
    doc.text(filterText, 105, 28, { align: 'center' });
    doc.text(`Dijana pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 34, { align: 'center' });

    const tableData = filtered.map((r, i) => [
      i + 1,
      r.tajuk,
      r.masjidSurauName,
      r.jenis,
      format(new Date(r.tarikhTerima), 'dd/MM/yyyy'),
      format(new Date(r.tarikhHantar), 'dd/MM/yyyy'),
      r.catatan || '-'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['No', 'Tajuk Pembaikan', 'Premis', 'Jenis', 'Tarikh Terima', 'Tarikh JHEAIPP', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 48, 96], textColor: [255, 255, 255] },
      styles: { fontSize: 8 }
    });

    doc.save(`Laporan_Pembaikan_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = r.tajuk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.masjidSurauName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = !filterJenis || r.jenis === filterJenis;
    const matchPremis = !filterPremis || r.masjidSurauId === filterPremis;
    const matchMonth = !filterMonth || r.bulan === parseInt(filterMonth);
    const matchYear = !filterYear || r.tahun === parseInt(filterYear);
    return matchSearch && matchJenis && matchPremis && matchMonth && matchYear;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengurusan Pembaikan</h1>
          <p className="text-slate-500 text-sm">Urus dan pantau rekod pembaikan masjid & surau</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FileDown size={18} />
            Jana Laporan PDF
          </button>
          <button
            onClick={() => {
              setCurrentRecord({
                tarikhTerima: format(new Date(), 'yyyy-MM-dd'),
                tarikhHantar: format(new Date(), 'yyyy-MM-dd'),
              });
              setModalJenis('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Pembaikan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari tajuk..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
          value={filterJenis}
          onChange={(e) => {
            setFilterJenis(e.target.value);
            setFilterPremis(''); // Reset premis when jenis changes
          }}
        >
          <option value="">Semua Jenis</option>
          <option value="Masjid">Masjid</option>
          <option value="Surau">Surau</option>
        </select>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
          value={filterPremis}
          onChange={(e) => setFilterPremis(e.target.value)}
        >
          <option value="">Semua Premis</option>
          {premisList
            .filter(p => !filterJenis || p.jenis === filterJenis)
            .map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
        </select>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{format(new Date(2000, i), 'MMMM')}</option>
          ))}
        </select>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          {Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tajuk & Premis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh Terima</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh JHEAIPP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fail</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                    <p className="mt-2 text-slate-500">Memuatkan data...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tiada rekod pembaikan dijumpai.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{record.tajuk}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 size={12} />
                        {record.masjidSurauName} ({record.jenis})
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(record.tarikhTerima), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(record.tarikhHantar), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {record.catatan || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {record.failUrl ? (
                        <a 
                          href={record.failUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gov-blue hover:underline flex items-center gap-1 text-sm"
                        >
                          <FileText size={14} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs italic">Tiada fail</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setCurrentRecord(record);
                            setModalJenis(record.jenis);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Padam"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="gov-gradient px-6 py-4 flex justify-between items-center text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText size={24} />
                  {currentRecord?.id ? 'Kemaskini Pembaikan' : 'Tambah Pembaikan Baru'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tajuk Pembaikan</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
                      value={currentRecord?.tajuk || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, tajuk: e.target.value })}
                      placeholder="Contoh: Pembaikan Bumbung Masjid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Jenis Premis</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
                      value={modalJenis}
                      onChange={(e) => {
                        const val = e.target.value as 'Masjid' | 'Surau';
                        setModalJenis(val);
                        setCurrentRecord({ ...currentRecord, jenis: val, masjidSurauId: '' });
                      }}
                    >
                      <option value="">Pilih Jenis...</option>
                      <option value="Masjid">Masjid</option>
                      <option value="Surau">Surau</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Masjid / Surau</label>
                    <select
                      required
                      disabled={!modalJenis}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      value={currentRecord?.masjidSurauId || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, masjidSurauId: e.target.value })}
                    >
                      <option value="">{modalJenis ? `Pilih ${modalJenis}...` : 'Sila pilih jenis dahulu'}</option>
                      {premisList
                        .filter(p => p.jenis === modalJenis)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.nama}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tarikh Terima</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
                      value={currentRecord?.tarikhTerima || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, tarikhTerima: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tarikh Hantar ke JHEAIPP</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
                      value={currentRecord?.tarikhHantar || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, tarikhHantar: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none resize-none"
                      value={currentRecord?.catatan || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, catatan: e.target.value })}
                      placeholder="Butiran tambahan..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Lampiran Fail (PDF)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-gov-blue outline-none"
                        value={currentRecord?.failUrl || ''}
                        onChange={(e) => setCurrentRecord({ ...currentRecord, failUrl: e.target.value })}
                        placeholder="URL fail PDF (Sila muat naik ke storan luaran)"
                      />
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400" title="Muat naik fail ke storan luaran dan masukkan URL di sini">
                        <Upload size={20} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">* Buat masa ini, sila masukkan URL fail PDF yang telah dimuat naik ke storan awan (Google Drive/Dropbox/etc).</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gov-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Rekod'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
