import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { logActivity } from '../../services/auditService';

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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({
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
    });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await setDoc(doc(db, collectionName, initialData.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('EDIT', `Mengemaskini rekod ${typeLabel}: ${formData.namaPenuh}`);
      } else {
        await addDoc(collection(db, collectionName), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('CREATE', `Menambah rekod ${typeLabel} baru: ${formData.namaPenuh}`);
      }
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
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
                <option>Pengerusi</option>
                <option>Tim. Pengerusi</option>
                <option>Setiausaha</option>
                <option>Bendahari</option>
                <option>AJK</option>
                <option>AJK Wanita</option>
                <option>Pemeriksa Kira-kira</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.statusLantikan}
                onChange={(e) => setFormData({...formData, statusLantikan: e.target.value})}
              >
                <option>Aktif</option>
                <option>Tamat tempoh</option>
                <option>Letak jawatan</option>
                <option>Meninggal dunia</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400">{typeLabel === 'JK Surau' ? 'Nama Surau' : 'Nama Masjid'}</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
              value={formData.masjidName}
              onChange={(e) => setFormData({...formData, masjidName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Daerah</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.daerah}
                onChange={(e) => setFormData({...formData, daerah: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Parlimen</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.parlimen}
                onChange={(e) => setFormData({...formData, parlimen: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">DUN</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.dun}
                onChange={(e) => setFormData({...formData, dun: e.target.value})}
              />
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
