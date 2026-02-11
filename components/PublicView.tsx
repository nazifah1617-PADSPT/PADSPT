
import React, { useState, useMemo } from 'react';
import { Category, CommitteeMember, MosqueInfo } from '../types';
import { PARLIMEN_DUN, POSITION_RANK } from '../constants';
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

  // Pilihan kolum untuk cetakan
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'bil', 'jawatan', 'nama', 'nokp', 'notel', 'alamat', 'pekerjaan', 'jantina', 'umur'
  ]);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const availableTempat = useMemo(() => {
    const relevant = filters.kategori === 'all' 
      ? members 
      : members.filter(m => m.jenis === filters.kategori);
    return Array.from(new Set(relevant.map(m => m.tempat))).sort();
  }, [members, filters.kategori]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (filters.kategori !== 'all' && m.jenis !== filters.kategori) return false;
      if (filters.tempat && m.tempat !== filters.tempat) return false;
      if (filters.parlimen && m.parlimen !== filters.parlimen) return false;
      if (filters.dun && m.dun !== filters.dun) return false;
      // Carian jawatan secara fleksibel (includes)
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

  // Label dinamik untuk penapis tempat
  const getTempatLabel = () => {
    switch (filters.kategori) {
      case Category.MASJID:
        return "NAMA MASJID";
      case Category.SURAU:
        return "NAMA SURAU";
      case Category.PEGAWAI:
        return "TEMPAT BERTUGAS";
      default:
        return "NAMA TEMPAT";
    }
  };

  const columnOptions = [
    { id: 'bil', label: 'BIL' },
    { id: 'jawatan', label: 'JAWATAN' },
    { id: 'nama', label: 'NAMA' },
    { id: 'nokp', label: 'NO. KP' },
    { id: 'notel', label: 'TEL' },
    { id: 'alamat', label: 'ALAMAT' },
    { id: 'pekerjaan', label: 'PEKERJAAN' },
    { id: 'jantina', label: 'JNTN' },
    { id: 'umur', label: 'UMUR' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase sm:text-4xl">PORTAL DATA MAKLUMAT MASJID DAN SURAU</h2>
        <p className="text-slate-500 font-medium">Sila gunakan penapis di bawah untuk mengecilkan carian anda.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Jumlah Rekod</p><p className="text-xl font-extrabold text-slate-800">{stats.total}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Masjid</p><p className="text-xl font-extrabold text-emerald-700">{stats.masjid}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Surau</p><p className="text-xl font-extrabold text-amber-700">{stats.surau}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pegawai</p><p className="text-xl font-extrabold text-purple-700">{stats.pegawai}</p></div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kategori</label>
            <select 
              value={filters.kategori}
              onChange={e => setFilters(prev => ({ ...prev, kategori: e.target.value, tempat: '' }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
            >
              <option value="all">SEMUA KATEGORI</option>
              <option value={Category.MASJID}>MASJID</option>
              <option value={Category.SURAU}>SURAU</option>
              <option value={Category.PEGAWAI}>PEGAWAI MASJID</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{getTempatLabel()}</label>
            <select 
              value={filters.tempat}
              onChange={e => setFilters(prev => ({ ...prev, tempat: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
            >
              <option value="">SEMUA TEMPAT</option>
              {availableTempat.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Parlimen</label>
            <select 
              value={filters.parlimen}
              onChange={e => setFilters(prev => ({ ...prev, parlimen: e.target.value, dun: '' }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
            >
              <option value="">SEMUA PARLIMEN</option>
              {Object.keys(PARLIMEN_DUN).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">DUN</label>
            <select 
              value={filters.dun}
              onChange={e => setFilters(prev => ({ ...prev, dun: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
            >
              <option value="">SEMUA DUN</option>
              {filters.parlimen && PARLIMEN_DUN[filters.parlimen]?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Carian Jawatan</label>
            <input 
              type="text"
              placeholder="E.G. PENGERUSI, IMAM..."
              value={filters.jawatan}
              onChange={e => setFilters(prev => ({ ...prev, jawatan: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold uppercase placeholder:normal-case placeholder:font-normal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Carian Teks</label>
            <input 
              type="text"
              placeholder="NAMA, KP ATAU TEMPAT..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold uppercase placeholder:normal-case placeholder:font-normal"
            />
          </div>
        </div>
        
        {(filters.tempat || filters.parlimen || filters.dun || filters.jawatan || filters.search) && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pilihan Maklumat untuk Dicetak:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {columnOptions.map(opt => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedColumns.includes(opt.id)}
                      onChange={() => toggleColumn(opt.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase transition-colors">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => generateListPdf(filteredMembers, filters, selectedColumns)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                CETAK SENARAI PILIHAN (PDF)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Nama Penuh & KP</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Jawatan & Pekerjaan</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">Tempat Bertugas</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">No. Telefon</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest border-b border-slate-700 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 uppercase">{m.nama}</div>
                    <div className="text-[10px] font-mono text-slate-400">{m.nokp}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-semibold text-slate-700">{m.jawatan}</div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase">{m.pekerjaan || '-'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-bold text-slate-800 uppercase">{m.tempat}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{m.jenis}</div>
                  </td>
                  <td className="py-4 px-6 text-sm font-mono font-medium text-slate-600">{m.notel}</td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => generateSinglePdf(m)}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      title="Cetak PDF Individu"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="font-bold text-slate-600 uppercase tracking-widest">Tiada data dijumpai</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PublicView;
