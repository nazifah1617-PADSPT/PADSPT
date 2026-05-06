import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { X, Save, FileText, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../../services/auditService';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const DocumentModal = ({ isOpen, onClose, initialData }: DocumentModalProps) => {
  const getDefaultDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDefaultTime = () => {
    const today = new Date();
    const hh = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const [formData, setFormData] = useState<any>({
    jenisRekod: 'Terimaan',
    kategoriDokumen: 'Surat',
    tajuk: '',
    entitiBerkaitan: 'JK Kariah Masjid',
    subEntiti: '',
    namaPihak: '',
    tarikh: getDefaultDate(),
    jam: getDefaultTime(),
    tindakan: '',
    status: 'Dalam Proses'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({
      jenisRekod: 'Terimaan',
      kategoriDokumen: 'Surat',
      tajuk: '',
      entitiBerkaitan: 'JK Kariah Masjid',
      subEntiti: '',
      namaPihak: '',
      tarikh: getDefaultDate(),
      jam: getDefaultTime(),
      tindakan: '',
      status: 'Dalam Proses'
    });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (!dataToSave.namaPihak) {
        dataToSave.namaPihak = '-';
      }

      if (initialData?.id) {
        await updateDoc(doc(db, 'document_records', initialData.id), dataToSave);
        await logActivity('UPDATE', `Kemaskini rekod dokumen: ${formData.tajuk}`);
      } else {
        await addDoc(collection(db, 'document_records'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        await logActivity('CREATE', `Tambah rekod dokumen: ${formData.tajuk}`);
      }
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      handleFirestoreError(error, initialData?.id ? OperationType.UPDATE : OperationType.CREATE, 'document_records');
      alert("Ralat semasa menyimpan rekod. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gov-blue/10 rounded-xl flex items-center justify-center text-gov-blue">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {initialData ? 'Kemaskini Rekod Dokumen' : 'Rekod Dokumen Baru'}
                </h2>
                <p className="text-sm text-slate-500">Merekod maklumat keluar masuk dokumen.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
            <form id="doc-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Jenis Rekod</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
                    value={formData.jenisRekod}
                    onChange={(e) => setFormData({...formData, jenisRekod: e.target.value})}
                  >
                    <option value="Terimaan">Terimaan (Masuk)</option>
                    <option value="Edaran">Edaran (Keluar)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Kategori Dokumen</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
                    value={formData.kategoriDokumen}
                    onChange={(e) => setFormData({...formData, kategoriDokumen: e.target.value})}
                  >
                    <option value="Surat">Surat</option>
                    <option value="Borang">Borang</option>
                    <option value="Kertas Kerja">Kertas Kerja</option>
                    <option value="Permohonan">Permohonan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Perkara / Tajuk Dokumen</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all uppercase"
                  placeholder="Cth: Penghantaran Minit Mesyuarat Kariah..."
                  value={formData.tajuk}
                  onChange={(e) => setFormData({...formData, tajuk: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Entiti Berkaitan</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
                    value={formData.entitiBerkaitan}
                    onChange={(e) => setFormData({...formData, entitiBerkaitan: e.target.value, subEntiti: ''})}
                  >
                    <option>JK Kariah Masjid</option>
                    <option>Surau</option>
                    <option>Pegawai Masjid</option>
                    <option>JHEAIPP</option>
                  </select>
                </div>
                
                {formData.entitiBerkaitan === 'JHEAIPP' ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Bahagian JHEAIPP</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
                      value={formData.subEntiti}
                      onChange={(e) => setFormData({...formData, subEntiti: e.target.value})}
                    >
                      <option value="">-- Sila Pilih --</option>
                      <option>Bahagian Masjid dan Surau</option>
                      <option>Bahagian Pembangunan</option>
                      <option>Bahagian Dakwah</option>
                      <option>Bahagian Pendidikan</option>
                      <option>NiNCeR (Nikah Cerai Rujuk)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Nama Pihak / Individu / Masjid / Surau</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all uppercase"
                      placeholder="Cth: Masjid Jamek Tuan Abdullah"
                      value={formData.namaPihak}
                      onChange={(e) => setFormData({...formData, namaPihak: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> Tarikh</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all font-medium"
                    value={formData.tarikh}
                    onChange={(e) => setFormData({...formData, tarikh: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> Masa</label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all font-medium"
                    value={formData.jam}
                    onChange={(e) => setFormData({...formData, jam: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all font-bold text-slate-700"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option>Selesai</option>
                    <option>Dalam Proses</option>
                    <option>KIV</option>
                    <option>Ditolak</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tindakan / Catatan</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all h-24 uppercase"
                    placeholder="Catatan tindakan..."
                    value={formData.tindakan}
                    onChange={(e) => setFormData({...formData, tindakan: e.target.value})}
                  />
                </div>
              </div>

            </form>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              BATAL
            </button>
            <button 
              form="doc-form"
              type="submit" 
              disabled={loading}
              className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gov-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  SIMPAN REKOD
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
