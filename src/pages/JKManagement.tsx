import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
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
  Clock,
  Printer,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn, formatIC } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { JKModal } from '../components/ui/JKModal';
import { PrintPreviewModal } from '../components/ui/PrintPreviewModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ROLE_PRIORITY: { [key: string]: number } = {
  'pengerusi': 1,
  'tim. pengerusi': 2,
  'timb. pengerusi': 2,
  'tim pengerusi': 2,
  'timb pengerusi': 2,
  'timbalan pengerusi': 2,
  'naib pengerusi': 2,
  'setiausaha': 3,
  'bendahari': 4,
  'ajk': 5,
  'ajk wanita': 6,
  'pemeriksa kira-kira': 7,
  'pemeriksa kira kira': 7,
  'pemeriksa kira': 7
};

const getPriority = (jawatan: string) => {
  if (!jawatan) return 99;
  const normalized = jawatan.toLowerCase().trim();
  return ROLE_PRIORITY[normalized] || 99;
};

export default function JKManagement() {
  const { isSuperAdmin } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [masjidDetails, setMasjidDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [selectedDaerah, setSelectedDaerah] = useState('Semua');
  const [selectedParlimen, setSelectedParlimen] = useState('Semua');
  const [selectedDun, setSelectedDun] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const [expandedMasjids, setExpandedMasjids] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGroupType, setPreviewGroupType] = useState<'masjid' | 'parlimen' | 'dun'>('masjid');

  const handlePrintRequest = (groupBy: 'masjid' | 'parlimen' | 'dun' = 'masjid') => {
    let data = selectedForPrint.length > 0 
      ? records.filter(r => selectedForPrint.includes(r.id))
      : filteredRecords;
    
    if (data.length === 0) {
      alert("Tiada rekod dipilih untuk dicetak.");
      return;
    }

    setPreviewData(data);
    setPreviewGroupType(groupBy);
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    const q = query(collection(db, 'jk_records'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecords(data);
      setLoading(false);
      // Expand all by default
      const uniqueMasjids = Array.from(new Set(data.map(r => r.masjidName)));
      setExpandedMasjids(uniqueMasjids as string[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'jk_records');
    });

    // Fetch masjid records for metadata lookup
    const qMasjid = query(collection(db, 'masjid_records'));
    const unsubMasjid = onSnapshot(qMasjid, (snap) => {
      setMasjidDetails(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubMasjid();
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) {
      alert("Hanya Super Admin dibenarkan memadam rekod.");
      return;
    }
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
    const matchesSearch = (r.namaPenuh || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.noKP || '').includes(searchTerm) ||
                         (r.noTel || '').includes(searchTerm) ||
                         (r.masjidName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'Semua' || r.statusLantikan === selectedStatus;
    const matchesDaerah = selectedDaerah === 'Semua' || r.daerah === selectedDaerah;
    const matchesParlimen = selectedParlimen === 'Semua' || r.parlimen === selectedParlimen;
    const matchesDun = selectedDun === 'Semua' || r.dun === selectedDun;
    return matchesSearch && matchesStatus && matchesDaerah && matchesParlimen && matchesDun;
  });

  const uniqueDaerahs = useMemo(() => {
    const d = records.map(r => r.daerah).filter(Boolean);
    return ['Semua', ...Array.from(new Set(d))].sort();
  }, [records]);

  const uniqueParlimens = useMemo(() => {
    let p = records;
    if (selectedDaerah !== 'Semua') {
      p = p.filter(r => r.daerah === selectedDaerah);
    }
    const filtered = p.map(r => r.parlimen).filter(Boolean);
    return ['Semua', ...Array.from(new Set(filtered))].sort();
  }, [records, selectedDaerah]);

  const uniqueDuns = useMemo(() => {
    let d = records;
    if (selectedParlimen !== 'Semua') {
      d = d.filter(r => r.parlimen === selectedParlimen);
    }
    const filtered = d.map(r => r.dun).filter(Boolean);
    return ['Semua', ...Array.from(new Set(filtered))].sort();
  }, [records, selectedParlimen]);

  // Group by Masjid
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredRecords.forEach(r => {
      const masjid = r.masjidName || 'Tiada Nama Masjid';
      if (!groups[masjid]) groups[masjid] = [];
      groups[masjid].push(r);
    });
    
    // Sort members within each group by priority
    Object.keys(groups).forEach(masjid => {
      groups[masjid].sort((a, b) => {
        const pA = getPriority(a.jawatan);
        const pB = getPriority(b.jawatan);
        if (pA !== pB) return pA - pB;
        return a.namaPenuh.localeCompare(b.namaPenuh);
      });
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRecords]);

  const toggleMasjid = (masjid: string) => {
    setExpandedMasjids(prev => 
      prev.includes(masjid) ? prev.filter(m => m !== masjid) : [...prev, masjid]
    );
  };

  const toggleSelectMember = (id: string) => {
    setSelectedForPrint(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectMasjid = (masjid: string, members: any[]) => {
    const memberIds = members.map(m => m.id);
    const allSelected = memberIds.every(id => selectedForPrint.includes(id));
    
    if (allSelected) {
      setSelectedForPrint(prev => prev.filter(id => !memberIds.includes(id)));
    } else {
      setSelectedForPrint(prev => Array.from(new Set([...prev, ...memberIds])));
    }
  };

  const generatePDF = (groupBy?: 'parlimen' | 'dun') => {
    const doc = new jsPDF();
    let printData = selectedForPrint.length > 0 
      ? records.filter(r => selectedForPrint.includes(r.id))
      : filteredRecords;

    if (printData.length === 0) {
      alert("Tiada rekod dipilih untuk dicetak.");
      return;
    }

    // If grouping by Parlimen or DUN, we might want to sort differently
    const masjidNames = Array.from(new Set(printData.map(r => r.masjidName).filter(Boolean)));
    const filenamePrefix = masjidNames.length === 1 
      ? masjidNames[0].toUpperCase().replace(/[/\\?%*:|"<>]/g, '_') 
      : (groupBy ? `Laporan_JK_${groupBy}` : 'Senarai_JK_Kariah');

    if (groupBy) {
      const groups: { [key: string]: any[] } = {};
      printData.forEach(r => {
        const key = r[groupBy] || `Tiada ${groupBy.toUpperCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });

      let currentY = 20;
      const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

      sortedGroups.forEach(([groupName, members], index) => {
        if (index > 0) {
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          } else {
            currentY += 10;
          }
        }

        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text(`SENARAI JAWATANKUASA KARIAH`, 105, currentY, { align: 'center' });
        currentY += 8;
        doc.text(`MENGIKUT ${groupBy.toUpperCase()}: ${groupName.toUpperCase()}`, 105, currentY, { align: 'center' });
        currentY += 10;

        let tableBody: any[] = [];
        let currentMasjid = '';

        members.sort((a,b) => {
          const masjidA = a.masjidName || '';
          const masjidB = b.masjidName || '';
          if (masjidA !== masjidB) return masjidA.localeCompare(masjidB);
          
          const pA = getPriority(a.jawatan);
          const pB = getPriority(b.jawatan);
          if (pA !== pB) return pA - pB;
          
          return (a.namaPenuh || '').localeCompare(b.namaPenuh || '');
        }).forEach((r, i) => {
          if (previewGroupType !== 'masjid') {
            const mName = r.masjidName || '-';
            if (mName !== currentMasjid) {
              currentMasjid = mName;
              tableBody.push([{
                content: mName.toUpperCase(),
                colSpan: 6,
                styles: { fillColor: [240, 245, 250], textColor: [0, 51, 102], fontStyle: 'bold', halign: 'left' }
              }]);
            }
          }

          tableBody.push([
            i + 1,
            r.namaPenuh.toUpperCase(),
            r.jawatan.toUpperCase(),
            (r.masjidName || '-').toUpperCase(),
            r.noTel || '-',
            r.statusLantikan.toUpperCase()
          ]);
        });

        autoTable(doc, {
          startY: currentY,
          head: [['BIL', 'NAMA PENUH', 'JAWATAN', 'NAMA MASJID', 'NO. TELEFON', 'STATUS']],
          body: tableBody,
          headStyles: { fillColor: [0, 51, 102] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 20 },
        });
      });

      doc.save(`${filenamePrefix}_${new Date().getTime()}.pdf`);
      logActivity('PRINT', `Mencetak PDF Laporan ${groupBy} (${printData.length} rekod)`);
      return;
    }

    // Default grouping by Masjid
    const printGroups: { [key: string]: any[] } = {};
    printData.forEach(r => {
      const masjid = r.masjidName || 'Tiada Nama Masjid';
      if (!printGroups[masjid]) printGroups[masjid] = [];
      printGroups[masjid].push(r);
    });

    let currentY = 20;

    Object.entries(printGroups).forEach(([masjid, members], index) => {
      if (index > 0) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        } else {
          currentY += 10; // Add some spacing between masjids on the same page
        }
      }

      // Sort members by priority
      const sortedMembers = [...members].sort((a, b) => {
        const pA = getPriority(a.jawatan);
        const pB = getPriority(b.jawatan);
        if (pA !== pB) return pA - pB;
        return a.namaPenuh.localeCompare(b.namaPenuh);
      });

      const firstMember = sortedMembers[0];
      const parlimen = firstMember.parlimen || '-';
      const dun = firstMember.dun || '-';

      // Find masjid metadata
      const masjidInfo = masjidDetails.find(m => m.nama?.toUpperCase() === masjid.toUpperCase());

      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text(`SENARAI JAWATANKUASA KARIAH`, 105, currentY, { align: 'center' });
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
        if (masjidInfo.noFail) line2 += ` | NO. FAIL: ${masjidInfo.noFail}`;
        doc.text(line2, 105, currentY, { align: 'center' });
        currentY += 7;
      } else {
        currentY += 2;
      }

      autoTable(doc, {
        startY: currentY,
        head: [['BIL', 'NAMA PENUH', 'JAWATAN', 'NAMA MASJID', 'NO. TELEFON', 'STATUS']],
        body: sortedMembers.map((r, i) => [
          i + 1,
          r.namaPenuh.toUpperCase(),
          r.jawatan.toUpperCase(),
          (r.masjidName || '-').toUpperCase(),
          r.noTel || '-',
          r.statusLantikan.toUpperCase()
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
    logActivity('PRINT', `Mencetak PDF Senarai JK (${printData.length} rekod)`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengurusan JK Kariah</h1>
          <p className="text-slate-500">Kawal selia data ahli jawatankuasa kariah masjid.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative group">
            <button 
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all"
            >
              <Printer size={20} />
              CETAK LAPORAN <ChevronDown size={16} />
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button 
                onClick={() => handlePrintRequest('masjid')}
                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Building2 size={16} className="text-gov-blue" /> Ikut Masjid
              </button>
              <button 
                onClick={() => handlePrintRequest('parlimen')}
                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50"
              >
                <MapPin size={16} className="text-gov-blue" /> Ikut Parlimen
              </button>
              <button 
                onClick={() => handlePrintRequest('dun')}
                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50"
              >
                <MapPin size={16} className="text-gov-blue" /> Ikut DUN
              </button>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-gov-blue text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 hover:bg-gov-blue/90 transition-all"
          >
            <UserPlus size={20} />
            TAMBAH JK BARU
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Cari Nama, No. KP, No. Tel atau Masjid..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['SEMUA', 'AKTIF', 'TAMAT TEMPOH', 'LETAK JAWATAN', 'MENINGGAL DUNIA'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status === 'SEMUA' ? 'Semua' : status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  (selectedStatus === status || (selectedStatus === 'Semua' && status === 'SEMUA'))
                    ? "bg-gov-blue text-white shadow-md" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tapis Mengikut Daerah</p>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-gov-blue/20"
                value={selectedDaerah}
                onChange={(e) => {
                  setSelectedDaerah(e.target.value);
                  setSelectedParlimen('Semua');
                  setSelectedDun('Semua');
                }}
              >
                {uniqueDaerahs.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tapis Mengikut Parlimen</p>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-gov-blue/20"
                value={selectedParlimen}
                onChange={(e) => {
                  setSelectedParlimen(e.target.value);
                  setSelectedDun('Semua');
                }}
              >
                {uniqueParlimens.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <Building2 size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tapis Mengikut DUN</p>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-gov-blue/20"
                value={selectedDun}
                onChange={(e) => setSelectedDun(e.target.value)}
              >
                {uniqueDuns.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped List View */}
      <div className="space-y-6">
        {groupedRecords.map(([masjid, members]) => (
          <div key={masjid} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleMasjid(masjid)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-all"
                >
                  {expandedMasjids.includes(masjid) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <div className="w-10 h-10 bg-gov-blue/10 rounded-xl flex items-center justify-center text-gov-blue">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{masjid}</h3>
                  <p className="text-xs text-slate-500">{members.length} Ahli Jawatankuasa</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleSelectMasjid(masjid, members)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-gov-blue transition-all"
                >
                  {members.every(m => selectedForPrint.includes(m.id)) ? <CheckSquare size={18} className="text-gov-blue" /> : <Square size={18} />}
                  PILIH SEMUA
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedMasjids.includes(masjid) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white border-b border-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400 w-12"></th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400">Nama Penuh</th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400">No. Telefon</th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400">Jawatan</th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400">Status</th>
                          <th className="px-6 py-3 text-[10px] uppercase font-bold text-slate-400 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {members.map((jk) => (
                          <tr key={jk.id} className={cn(
                            "hover:bg-slate-50/50 transition-colors group",
                            selectedForPrint.includes(jk.id) && "bg-gov-blue/5"
                          )}>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => toggleSelectMember(jk.id)}
                                className="text-slate-300 hover:text-gov-blue transition-all"
                              >
                                {selectedForPrint.includes(jk.id) ? <CheckSquare size={20} className="text-gov-blue" /> : <Square size={20} />}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{jk.namaPenuh}</p>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{jk.noTel || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-slate-600">{jk.jawatan}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                jk.statusLantikan === 'Aktif' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                              )}>
                                {jk.statusLantikan}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEdit(jk)}
                                  className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all"
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <JKModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedRecord} 
        collectionName="jk_records"
        typeLabel="JK Kariah"
      />

      <PrintPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData}
        metadata={masjidDetails}
        typeLabel="KARIAH"
        title={previewGroupType === 'masjid' ? 'SENARAI JAWATANKUASA KARIAH MASJID' : `LAPORAN JK KARIAH MENGIKUT ${previewGroupType.toUpperCase()}`}
        groupType={previewGroupType}
        onConfirm={() => generatePDF(previewGroupType === 'masjid' ? undefined : previewGroupType)}
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


