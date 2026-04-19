import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { logActivity } from '../../services/auditService';
import { MASJID_LIST, DAERAH_LIST, DAERAH_PARLIMEN, PENANG_PARLIAMENT_DUN } from '../../constants';

interface PegawaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const PegawaiModal = ({ isOpen, onClose, initialData }: PegawaiModalProps) => {
  const [formData, setFormData] = useState<any>({
    nama: '',
    jawatan: 'Imam',
    noKP: '',
    noTel: '',
    masjidName: '',
    daerah: '',
    parlimen: '',
    dun: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ nama: '', jawatan: 'Imam', noKP: '', noTel: '', masjidName: '', daerah: '', parlimen: '', dun: '' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleDaerahChange = (value: string) => {
    setFormData({ ...formData, daerah: value, parlimen: '', dun: '' });
  };

  const handleParlimenChange = (value: string) => {
    setFormData({ ...formData, parlimen: value, dun: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedData = {
        ...formData,
        nama: formData.nama.toUpperCase().trim(),
        jawatan: formData.jawatan.toUpperCase().trim(),
        noKP: formData.noKP.replace(/-/g, '').trim(),
        masjidName: formData.masjidName.toUpperCase().trim(),
        daerah: formData.daerah.toUpperCase().trim(),
        parlimen: formData.parlimen.toUpperCase().trim(),
        dun: formData.dun.toUpperCase().trim(),
      };

      if (initialData?.id) {
        await setDoc(doc(db, 'pegawai_records', initialData.id), {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('EDIT_PEGAWAI', `Mengemaskini rekod Pegawai: ${normalizedData.nama}`);
      } else {
        await addDoc(collection(db, 'pegawai_records'), {
          ...normalizedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity('CREATE_PEGAWAI', `Menambah rekod Pegawai baru: ${normalizedData.nama}`);
      }
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Gagal menyimpan data pegawai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="gov-gradient p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{initialData ? 'Kemaskini Pegawai' : 'Tambah Pegawai Baru'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nama Penuh</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">No. KP</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.noKP}
                onChange={(e) => setFormData({...formData, noKP: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Jawatan</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.jawatan}
                onChange={(e) => setFormData({...formData, jawatan: e.target.value})}
              >
                <option>IMAM</option>
                <option>BILAL</option>
                <option>SIAK</option>
                <option>NOJA</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">No. Telefon</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.noTel}
                onChange={(e) => setFormData({...formData, noTel: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nama Masjid</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.masjidName}
                onChange={(e) => setFormData({...formData, masjidName: e.target.value})}
              >
                <option value="">PILIH MASJID...</option>
                {MASJID_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Daerah</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.daerah}
                onChange={(e) => handleDaerahChange(e.target.value)}
              >
                <option value="">PILIH DAERAH...</option>
                {DAERAH_LIST.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Parlimen</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none disabled:opacity-50"
                value={formData.parlimen}
                disabled={!formData.daerah}
                onChange={(e) => handleParlimenChange(e.target.value)}
              >
                <option value="">PILIH PARLIMEN...</option>
                {formData.daerah && DAERAH_PARLIMEN[formData.daerah]?.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">DUN</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none disabled:opacity-50"
                value={formData.dun}
                disabled={!formData.parlimen}
                onChange={(e) => setFormData({...formData, dun: e.target.value})}
              >
                <option value="">PILIH DUN...</option>
                {formData.parlimen && PENANG_PARLIAMENT_DUN[formData.parlimen]?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all">BATAL</button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-gov-blue text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 hover:bg-gov-blue/90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              SIMPAN REKOD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
