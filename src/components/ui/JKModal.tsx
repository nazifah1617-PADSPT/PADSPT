import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { logActivity } from '../../services/auditService';

import { MASJID_LIST, PENANG_PARLIAMENT_DUN, DAERAH_LIST, DAERAH_PARLIMEN } from '../../constants';

interface JKModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  collectionName?: string;
  typeLabel?: string;
}

export const JKModal = ({ isOpen, onClose, initialData, collectionName = 'jk_records', typeLabel = 'JK Kariah' }: JKModalProps) => {
  const [formData, setFormData] = useState<any>({
    namaPenuh: '',
    noKP: '',
    noTel: '',
    alamat: '',
    masjidName: '',
    jawatan: 'AJK',
    statusLantikan: 'Aktif',
    daerah: '',
    parlimen: '',
    dun: '',
    sesi: '',
    tarikhTamatSesi: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        namaPenuh: '',
        noKP: '',
        noTel: '',
        alamat: '',
        masjidName: '',
        jawatan: 'AJK',
        statusLantikan: 'Aktif',
        daerah: '',
        parlimen: '',
        dun: '',
        sesi: '',
        tarikhTamatSesi: '',
        ...initialData
      });
    } else {
      setFormData({
        namaPenuh: '',
        noKP: '',
        noTel: '',
        alamat: '',
        masjidName: '',
        jawatan: 'AJK',
        statusLantikan: 'Aktif',
        daerah: '',
        parlimen: '',
        dun: '',
        sesi: '',
        tarikhTamatSesi: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Normalize data to uppercase for searchability
    const normalizedData = {
      ...formData,
      namaPenuh: formData.namaPenuh.toUpperCase().trim(),
      noKP: formData.noKP.replace(/-/g, '').trim(),
      masjidName: formData.masjidName.toUpperCase().trim(),
      jawatan: formData.jawatan.toUpperCase().trim(),
      statusLantikan: formData.statusLantikan.toUpperCase().trim(),
    };

    try {
      if (initialData?.id) {
        await setDoc(doc(db, collectionName, initialData.id), {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('EDIT', `Mengemaskini rekod ${typeLabel}: ${normalizedData.namaPenuh}`);
      } else {
        await addDoc(collection(db, collectionName), {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('CREATE', `Menambah rekod ${typeLabel} baru: ${normalizedData.namaPenuh}`);
      }
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDaerahChange = (value: string) => {
    setFormData({ ...formData, daerah: value, parlimen: '', dun: '' });
  };

  const handleParlimenChange = (value: string) => {
    setFormData({ ...formData, parlimen: value, dun: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="gov-gradient p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{initialData ? `Kemaskini Rekod ${typeLabel}` : `Tambah Rekod ${typeLabel} Baru`}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nama Penuh</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.namaPenuh}
                onChange={(e) => setFormData({...formData, namaPenuh: e.target.value})}
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">No. Telefon</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.noTel}
                onChange={(e) => setFormData({...formData, noTel: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Jawatan</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.jawatan}
                onChange={(e) => setFormData({...formData, jawatan: e.target.value})}
              >
                <option>PENGERUSI</option>
                <option>TIM. PENGERUSI</option>
                <option>SETIAUSAHA</option>
                <option>BENDAHARI</option>
                <option>AJK</option>
                <option>AJK WANITA</option>
                <option>PEMERIKSA KIRA-KIRA</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.statusLantikan}
                onChange={(e) => setFormData({...formData, statusLantikan: e.target.value})}
              >
                <option>AKTIF</option>
                <option>TAMAT TEMPOH</option>
                <option>LETAK JAWATAN</option>
                <option>MENINGGAL DUNIA</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400">{typeLabel === 'JK Surau' ? 'Nama Surau' : 'Nama Masjid'}</label>
            {typeLabel === 'JK Surau' ? (
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.masjidName}
                onChange={(e) => setFormData({...formData, masjidName: e.target.value})}
              />
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Sesi (Cth: 2024/2026)</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.sesi}
                onChange={(e) => setFormData({...formData, sesi: e.target.value})}
                placeholder="2024/2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Tarikh Tamat Sesi</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.tarikhTamatSesi}
                onChange={(e) => setFormData({...formData, tarikhTamatSesi: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Daerah</label>
              <select 
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Parlimen</label>
              <select 
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
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all">BATAL</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gov-blue text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gov-blue/20 hover:bg-gov-blue/90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            SIMPAN REKOD
          </button>
        </div>
      </div>
    </div>
  );
};
