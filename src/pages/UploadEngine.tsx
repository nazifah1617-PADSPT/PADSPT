import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Save, Trash2, Edit3, Download, Database, RefreshCw } from 'lucide-react';
import { processKariahDocument } from '../services/aiService';
import { logActivity } from '../services/auditService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn, validateIC, formatIC } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function UploadEngine() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await processKariahDocument(base64, file.type);
        
        // Add default status if missing
        const members = result.members.map((m: any) => ({
          ...m,
          statusLantikan: m.statusLantikan || 'Aktif',
          masjidName: result.masjidInfo?.masjidName || '',
          parlimen: result.masjidInfo?.parlimen || '',
          dun: result.masjidInfo?.dun || '',
          daerah: result.masjidInfo?.daerah || '',
        }));
        
        setExtractedData({ ...result, members });
        await logActivity('UPLOAD', `Memproses fail: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Processing error:", error);
      setMessage({ type: 'error', text: 'Gagal memproses fail. Sila cuba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const saveAll = async () => {
    if (!extractedData) return;
    setSaving(true);
    try {
      const batch = extractedData.members;
      for (const member of batch) {
        await addDoc(collection(db, 'jk_records'), {
          ...member,
          updatedAt: serverTimestamp(),
        });
      }
      await logActivity('SAVE_BATCH', `Menyimpan ${batch.length} rekod dari upload`);
      setMessage({ type: 'success', text: `Berjaya menyimpan ${batch.length} rekod ke dalam sistem.` });
      setExtractedData(null);
      setFile(null);
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: 'error', text: 'Gagal menyimpan data.' });
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (index: number) => {
    const newMembers = [...extractedData.members];
    newMembers.splice(index, 1);
    setExtractedData({ ...extractedData, members: newMembers });
  };

  const downloadBackup = async () => {
    if (!extractedData) return;
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eKariah_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await logActivity('BACKUP', `Muat turun backup data upload: ${file?.name}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upload Data Pintar</h1>
          <p className="text-slate-500">Gunakan AI untuk mengekstrak data dari dokumen PDF, Excel atau CSV secara automatik.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Cetak Halaman"
          >
            <Download size={20} />
          </button>
          <button 
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Sync Manual ke Cloud"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {!extractedData ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center"
        >
          <div className="bg-gov-blue/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload size={40} className="text-gov-blue" />
          </div>
          <h3 className="text-xl font-bold mb-2">Pilih Fail Dokumen</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Sokongan untuk format PDF (Imbasan/Digital), XLSX, dan CSV.</p>
          
          <div className="flex flex-col items-center gap-4">
            <label className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2">
              <FileText size={20} />
              {file ? file.name : 'PILIH FAIL'}
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.xlsx,.csv" />
            </label>
            
            {file && (
              <button 
                onClick={processFile}
                disabled={loading}
                className="text-gov-blue font-bold hover:underline flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                MULAKAN PROSES AI
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hasil Ekstraksi AI</h2>
              <p className="text-sm text-slate-500">Sila semak dan sahkan data sebelum disimpan.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setExtractedData(null)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                BATAL
              </button>
              <button 
                onClick={saveAll}
                disabled={saving}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                SIMPAN SEMUA REKOD
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-bottom border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Nama Penuh</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">No. KP</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Jawatan</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">Masjid</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {extractedData.members.map((member: any, idx: number) => {
                  const isICValid = validateIC(member.noKP);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{member.namaPenuh}</p>
                        <p className="text-xs text-slate-500">{member.pekerjaan || 'Tiada Pekerjaan'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-mono text-sm", !isICValid && "text-red-500 font-bold")}>
                            {formatIC(member.noKP)}
                          </span>
                          {!isICValid && (
                            <div className="group/tip relative">
                              <AlertCircle size={14} className="text-red-500" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                IC Tidak Sah (Mesti 12 digit)
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gov-blue/10 text-gov-blue text-[10px] font-bold rounded-md">
                          {member.jawatan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{member.masjidName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{member.daerah}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-all">
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => removeMember(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4">
            <button 
              onClick={downloadBackup}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-gov-blue transition-all"
            >
              <Database size={14} /> MUAT TURUN BACKUP JSON (UNTUK USB/OFFLINE)
            </button>
          </div>
        </motion.div>
      )}

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "fixed bottom-8 right-8 p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]",
            message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span className="font-bold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 opacity-70 hover:opacity-100">×</button>
        </motion.div>
      )}
    </div>
  );
}
