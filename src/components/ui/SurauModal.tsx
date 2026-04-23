import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Map as MapIcon } from 'lucide-react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { logActivity } from '../../services/auditService';
import { PENANG_PARLIAMENT_DUN, DAERAH_LIST, DAERAH_PARLIMEN } from '../../constants';

interface SurauModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const SurauModal = ({ isOpen, onClose, initialData }: SurauModalProps) => {
  const [formData, setFormData] = useState<any>({
    nama: '',
    kod: '',
    noFailSurau: '',
    daerah: '',
    parlimen: '',
    dun: '',
    alamat: '',
    latitude: '',
    longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (initialData) setFormData({
      ...initialData,
      latitude: initialData.latitude || '',
      longitude: initialData.longitude || '',
      noFailSurau: initialData.noFailSurau || '',
    });
    else setFormData({ nama: '', kod: '', noFailSurau: '', daerah: '', parlimen: '', dun: '', alamat: '', latitude: '', longitude: '' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleGeocode = async () => {
    if (!formData.alamat) {
      alert("Sila masukkan alamat terlebih dahulu.");
      return;
    }
    setGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.alamat + ', Penang, Malaysia')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
      } else {
        alert("Lokasi tidak dijumpai. Sila masukkan koordinat secara manual.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Ralat semasa mencari lokasi.");
    } finally {
      setGeocoding(false);
    }
  };

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
        kod: formData.kod.toUpperCase().trim(),
        noFailSurau: formData.noFailSurau.toUpperCase().trim(),
        daerah: formData.daerah.toUpperCase().trim(),
        parlimen: formData.parlimen.toUpperCase().trim(),
        dun: formData.dun.toUpperCase().trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (initialData?.id) {
        await setDoc(doc(db, 'surau_records', initialData.id), {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
        await logActivity('EDIT_SURAU', `Mengemaskini rekod Surau: ${normalizedData.nama}`);
      } else {
        await addDoc(collection(db, 'surau_records'), {
          ...normalizedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity('CREATE_SURAU', `Menambah rekod Surau baru: ${normalizedData.nama}`);
      }
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Gagal menyimpan data surau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="gov-gradient p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">{initialData ? 'Kemaskini Surau' : 'Tambah Surau Baru'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nama Surau</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none uppercase"
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">No. Pendaftaran</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none uppercase"
                value={formData.kod}
                onChange={(e) => setFormData({...formData, kod: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400">No. Fail Surau</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none uppercase"
              value={formData.noFailSurau}
              onChange={(e) => setFormData({...formData, noFailSurau: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400">Alamat Penuh</label>
              <button 
                type="button" 
                onClick={handleGeocode}
                disabled={geocoding}
                className="text-[10px] font-bold text-gov-blue hover:underline flex items-center gap-1"
              >
                {geocoding ? <Loader2 className="animate-spin" size={12} /> : <MapIcon size={12} />}
                CARI KOORDINAT (GEOCODE)
              </button>
            </div>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none min-h-[100px]"
              value={formData.alamat}
              onChange={(e) => setFormData({...formData, alamat: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Latitude</label>
              <input 
                type="number"
                step="any"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                placeholder="Contoh: 5.4141"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400">Longitude</label>
              <input 
                type="number"
                step="any"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-gov-blue/20 outline-none"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                placeholder="Contoh: 100.3288"
              />
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
