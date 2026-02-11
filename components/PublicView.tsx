
import React, { useState, useMemo } from 'react';
import { Category, CommitteeMember, MosqueInfo } from '../types';
import { PARLIMEN_DUN, POSITION_RANK, JAWATAN_AJK, JAWATAN_PEGAWAI } from '../constants';
import { generateSinglePdf, generateListPdf } from '../utils/pdf';

interface Props {
  members: CommitteeMember[];
  mosqueInfo: MosqueInfo[];
}

const PublicView: React.FC<Props> = ({ members, mosqueInfo }) => {
  const [filters, setFilters] = useState({
    kategori: 'all',
    tempat: '',
    parlimen: '',
    dun: '',
    jawatan: '',
    search: ''
  });

  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'bil', 'jawatan', 'nama', 'nokp', 'notel', 'alamat', 'pekerjaan', 'jantina', 'umur'
  ]);

  const availableTempat = useMemo(() => {
    const relevant = filters.kategori === 'all' 
      ? members 
      : members.filter(m => m.jenis === filters.kategori);
    return Array.from(new Set(relevant.map(m => m.tempat))).sort();
  }, [members, filters.kategori]);

  const allJawatan = useMemo(() => {
    return Array.from(new Set([...JAWATAN_AJK, ...JAWATAN_PEGAWAI])).sort((a, b) => 
      (POSITION_RANK[a] || 99) - (POSITION_RANK[b] || 99)
    );
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (filters.kategori !== 'all' && m.jenis !== filters.kategori) return false;
      if (filters.tempat && m.tempat !== filters.tempat) return false;
      if (filters.parlimen && m.parlimen !== filters.parlimen) return false;
      if (filters.dun && m.dun !== filters.dun) return false;
      if (filters.jawatan && !m.jawatan.toUpperCase().includes(filters.jawatan.toUpperCase())) return false;
      if (filters.search) {
        const s = filters.search.toUpperCase();
        return m.nama.toUpperCase().includes(s) || m.nokp.includes(s) || m.tempat.toUpperCase().includes(s);
      }
      return true;
    }).sort((a, b) => {
      if (a.tempat !== b.tempat) return a.tempat.localeCompare(b.tempat);
      return (POSITION_RANK[a.jawatan] || 99) - (POSITION_RANK[b.jawatan] || 99);
    });
  }, [members, filters]);

  const stats = useMemo(() => ({
    total: filteredMembers.length,
    masjid: filteredMembers.filter(m => m.jenis === Category.MASJID).length,
    surau: filteredMembers.filter(m => m.jenis === Category.SURAU).length,
    pegawai: filteredMembers.filter(m => m.jenis === Category.PEGAWAI).length,
  }), [filteredMembers]);

  const getTempatLabel = () => {
    switch (filters.kategori) {
      case Category.MASJID: return "NAMA MASJID";
      case Category.SURAU: return "NAMA SURAU";
      case Category.PEGAWAI: return "TEMPAT BERTUGAS";
      default: return "NAMA TEMPAT";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase sm:text-4xl">PORTAL DATA MAKLUMAT MASJID DAN SURAU</h2>
        <p className="text-slate-500 font-medium italic">Daerah Seberang Perai Tengah</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'JUMLAH REKOD', val: stats.total, color: 'blue', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857' },
          { label: 'JK MASJID', val: stats.masjid, color: 'emerald', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
          { label: 'JK SURAU', val: stats.surau, color: 'amber', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' },
          { label: 'PEGAWAI', val: stats.pegawai, color: 'purple', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ].map((s, idx) => (
          <div key={idx} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-${s.color}-500 transition-all hover:shadow-md`}>
            <div className={`bg-${s.color}-100 text-${s.color}-600 p-2.5 rounded-lg`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} /></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
              <p className={`text-xl font-extrabold text-${s.color}-700`}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori</label>
            <select value={filters.kategori} onChange={e => setFilters(prev => ({ ...prev, kategori: e.target.value, tempat: '' }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="all">SEMUA</option>
              <option value={Category.MASJID}>MASJID</option>
              <option value={Category.SURAU}>SURAU</option>
              <option value={Category.PEGAWAI}>PEGAWAI</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{getTempatLabel()}</label>
            <select value={filters.tempat} onChange={e => setFilters(prev => ({ ...prev, tempat: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">SEMUA TEMPAT</option>
              {availableTempat.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Parlimen</label>
            <select value={filters.parlimen} onChange={e => setFilters(prev => ({ ...prev, parlimen: e.target.value, dun: '' }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">SEMUA PARLIMEN</option>
              {Object.keys(PARLIMEN_DUN).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DUN</label>
            <select value={filters.dun} onChange={e => setFilters(prev => ({ ...prev, dun: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">SEMUA DUN</option>
              {filters.parlimen && PARLIMEN_DUN[filters.parlimen]?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carian Jawatan</label>
            <select value={filters.jawatan} onChange={e => setFilters(prev => ({ ...prev, jawatan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">SEMUA JAWATAN</option>
              {allJawatan.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carian Teks</label>
            <input type="text" placeholder="NAMA / KP..." value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
           <button 
             onClick={() => generateListPdf(filteredMembers, filters, selectedColumns)}
             disabled={filteredMembers.length === 0}
             className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
             Cetak Laporan Senarai (PDF)
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr className="text-[10px] font-black uppercase tracking-widest">
              <th className="py-4 px-6 border-b border-slate-700">Nama & Jawatan</th>
              <th className="py-4 px-6 border-b border-slate-700">Tempat</th>
              <th className="py-4 px-6 border-b border-slate-700">No. Telefon</th>
              <th className="py-4 px-6 border-b border-slate-700 text-center">Profil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.length > 0 ? filteredMembers.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-900 uppercase text-sm group-hover:text-blue-700">{m.nama}</div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{m.jawatan}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-xs font-bold text-slate-700 uppercase">{m.tempat}</div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.jenis}</div>
                </td>
                <td className="py-4 px-6 text-xs font-mono font-bold text-slate-600">{m.notel}</td>
                <td className="py-4 px-6 text-center">
                  <button onClick={() => generateSinglePdf(m)} className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 00-2 2z" /></svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="py-20 text-center font-bold text-slate-400 uppercase tracking-widest">Tiada rekod dijumpai</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PublicView;
