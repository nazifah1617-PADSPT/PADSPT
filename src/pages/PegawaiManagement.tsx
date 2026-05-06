import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { UserCheck, Search, Plus, Building2, Phone, Edit3, Trash2, Loader2, Filter, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { PegawaiModal } from '../components/ui/PegawaiModal';
import { logActivity } from '../services/auditService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PegawaiManagement() {
  const { isSuperAdmin } = useAuth();
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null);

  const [masjidDetails, setMasjidDetails] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'pegawai_records'), orderBy('nama', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPegawai(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'pegawai_records');
    });

    // Fetch masjid & surau records for metadata lookup
    const qMasjid = query(collection(db, 'masjid_records'));
    const unsubMasjid = onSnapshot(qMasjid, (snap) => {
      setMasjidDetails(prev => {
        const others = prev.filter(p => !snap.docs.find(d => d.id === p.id));
        return [...others, ...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'masjid' }))];
      });
    });

    const qSurau = query(collection(db, 'surau_records'));
    const unsubSurau = onSnapshot(qSurau, (snap) => {
      setMasjidDetails(prev => {
        const others = prev.filter(p => !snap.docs.find(d => d.id === p.id));
        return [...others, ...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'surau' }))];
      });
    });

    return () => {
      unsubscribe();
      unsubMasjid();
      unsubSurau();
    };
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
    if (!isSuperAdmin) {
      alert("Hanya Super Admin dibenarkan memadam rekod.");
      return;
    }
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

  const JAWATAN_ORDER: Record<string, number> = {
    'IMAM': 1,
    'BILAL': 2,
    'SIAK': 3,
    'NOJA': 3,
  };

  const getJawatanOrder = (jawatan: string) => {
    return JAWATAN_ORDER[jawatan?.toUpperCase()] || 99;
  };

  const groupedPegawai = filteredPegawai.reduce((acc, p) => {
    const masjid = p.masjidName || 'TIADA NAMA MASJID';
    if (!acc[masjid]) acc[masjid] = [];
    acc[masjid].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedMasjidNames = Object.keys(groupedPegawai).sort((a, b) => a.localeCompare(b));

  const handlePrint = () => {
    if (filteredPegawai.length === 0) {
      alert("Tiada rekod untuk dicetak.");
      return;
    }

    const doc = new jsPDF();
    let currentY = 20;

    const masjidNames = Array.from(new Set(filteredPegawai.map(r => r.masjidName).filter(Boolean)));
    const filenamePrefix = masjidNames.length === 1 
      ? masjidNames[0].toUpperCase().replace(/[/\\?%*:|"<>]/g, '_') 
      : 'Senarai_Pegawai_Masjid';

    sortedMasjidNames.forEach((masjid, index) => {
      if (index > 0) {
        doc.addPage();
        currentY = 20;
      }

      const members = groupedPegawai[masjid].sort((a, b) => getJawatanOrder(a.jawatan) - getJawatanOrder(b.jawatan));
      const firstMember = members[0];
      const parlimen = firstMember.parlimen || '-';
      const dun = firstMember.dun || '-';
      
      const masjidInfo = masjidDetails.find(m => m.nama?.toUpperCase() === masjid.toUpperCase());

      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text('SENARAI PEGAWAI MASJID', 105, currentY, { align: 'center' });
      currentY += 8;
      doc.text(`${masjid.toUpperCase()}`, 105, currentY, { align: 'center' });
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const line1 = `PARLIMEN: ${parlimen.toUpperCase()} | DUN: ${dun.toUpperCase()}`;
      doc.text(line1, 105, currentY, { align: 'center' });
      currentY += 5;

      if (masjidInfo) {
        let line2 = `NO. PENDAFTARAN: ${masjidInfo.kod || '-'}`;
        const failData = masjidInfo.noFail || masjidInfo.noFailSurau;
        if (failData) line2 += ` | NO. FAIL: ${failData}`;
        doc.text(line2, 105, currentY, { align: 'center' });
        currentY += 7;
      } else {
        currentY += 2;
      }

      autoTable(doc, {
        startY: currentY,
        head: [['BIL', 'NAMA PENUH', 'NO. TELEFON', 'JAWATAN', 'STATUS']],
        body: members.map((r, i) => [
          i + 1,
          (r.nama || '-').toUpperCase(),
          r.noTel || '-',
          (r.jawatan === 'NOJA' ? 'SIAK' : (r.jawatan || '-')).toUpperCase(),
          (r.statusLantikan || 'AKTIF').toUpperCase()
        ]),
        headStyles: { fillColor: [0, 51, 102] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 20 },
        didDrawPage: (data) => {
          currentY = data.cursor?.y || currentY;
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    });

    doc.save(`${filenamePrefix}_${new Date().getTime()}.pdf`);
    logActivity('PRINT', `Mencetak PDF Senarai Pegawai (${filteredPegawai.length} rekod)`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan Pegawai Masjid</h1>
          <p className="text-slate-500">Senarai Imam, Bilal, dan Siak berdaftar di seluruh Pulau Pinang.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Printer size={20} /> CETAK LAPORAN
          </button>
          <button 
            onClick={handleAdd}
            className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gov-blue/20 transition-all"
          >
            <Plus size={20} /> TAMBAH PEGAWAI BARU
          </button>
        </div>
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
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Daerah</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Tindakan</th>
            </tr>
          </thead>
          {loading ? (
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-gov-blue" size={32} />
                  <p className="mt-4 text-slate-400 font-medium">Memuatkan data pegawai...</p>
                </td>
              </tr>
            </tbody>
          ) : sortedMasjidNames.length > 0 ? (
            sortedMasjidNames.map((masjidName) => (
              <tbody key={masjidName} className="divide-y divide-slate-50">
                <tr className="bg-slate-100">
                  <td colSpan={5} className="px-6 py-3 font-bold text-gov-blue text-sm">
                    {masjidName}
                  </td>
                </tr>
                {groupedPegawai[masjidName]
                  .sort((a, b) => getJawatanOrder(a.jawatan) - getJawatanOrder(b.jawatan))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 ml-4">
                          <div className="w-10 h-10 bg-gov-blue/5 rounded-xl flex items-center justify-center text-gov-blue">
                            <UserCheck size={20} />
                          </div>
                          <p className="font-bold text-slate-900">{p.nama}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-600">{p.noKP}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gov-blue/10 text-gov-blue text-[10px] font-bold rounded-md uppercase">
                          {p.jawatan === 'NOJA' ? 'SIAK' : p.jawatan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{p.daerah}</p>
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
                  ))}
              </tbody>
            ))
          ) : (
            <tbody className="divide-y divide-slate-50">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  Tiada rekod pegawai dijumpai.
                </td>
              </tr>
            </tbody>
          )}
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
