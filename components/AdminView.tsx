
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Category, CommitteeMember, MosqueInfo, User } from '../types';
import { 
  PARLIMEN_DUN, 
  JAWATAN_AJK, 
  JAWATAN_PEGAWAI 
} from '../constants';
import { 
  saveMemberToDb, 
  deleteMemberFromDb, 
  saveMosqueToDb, 
  deleteMosqueFromDb,
  saveUserToDb,
  deleteUserFromDb,
  subscribeUsers
} from '../services/firebase';
import { parseImportedData } from '../services/gemini';

interface Props {
  members: CommitteeMember[];
  mosqueInfo: MosqueInfo[];
  currentUser: User | null;
}

const AdminView: React.FC<Props> = ({ members, mosqueInfo, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'DATA' | 'MOSQUE' | 'USERS'>('DATA');
  const [editingMember, setEditingMember] = useState<Partial<CommitteeMember> | null>(null);
  const [editingMosque, setEditingMosque] = useState<Partial<MosqueInfo> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'preview'>('idle');
  const [importedData, setImportedData] = useState<Partial<CommitteeMember>[]>([]);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    if (activeTab === 'USERS') {
      const unsub = subscribeUsers(setUsers);
      return unsub;
    }
  }, [activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    let text = "";

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_txt(sheet);
      } else if (file.name.endsWith('.docx')) {
        const data = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: data });
        text = result.value;
      } else {
        text = await file.text();
      }

      const extracted = await parseImportedData(text);
      setImportedData(extracted);
      setImportStatus('preview');
    } catch (err) {
      alert("Gagal membaca fail. Sila pastikan format betul atau gunakan fungsi salin/tampal teks.");
      setImportStatus('idle');
    }
  };

  const confirmImport = async () => {
    setIsSaving(true);
    try {
      for (const item of importedData) {
        let jantina: 'LELAKI' | 'PEREMPUAN' = 'LELAKI';
        let umur = 'N/A';
        if (item.nokp && item.nokp.length === 12) {
          const last = parseInt(item.nokp.slice(-1));
          jantina = (last % 2 !== 0) ? 'LELAKI' : 'PEREMPUAN';
          const yearPrefix = parseInt(item.nokp.substring(0, 2));
          const currentYear = new Date().getFullYear();
          const birthYear = (yearPrefix > (currentYear % 100)) ? (1900 + yearPrefix) : (2000 + yearPrefix);
          umur = `${currentYear - birthYear} TAHUN`;
        }

        const finalMember = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          jantina,
          umur,
          nama: item.nama?.toUpperCase() || '',
          tempat: item.tempat?.toUpperCase() || '',
          notel: item.notel || '',
          alamat: item.alamat?.toUpperCase() || '',
          pekerjaan: item.pekerjaan?.toUpperCase() || '',
          tarikhLantikan: new Date().toISOString().split('T')[0],
          tarikhTamat: '',
          parlimen: item.parlimen || '',
          dun: item.dun || '',
          jawatan: item.jawatan || 'AHLI JAWATANKUASA',
          jenis: item.jenis || Category.MASJID
        } as CommitteeMember;
        await saveMemberToDb(finalMember);
      }
      setIsImportModalOpen(false);
      setImportStatus('idle');
      alert(`Berjaya import ${importedData.length} rekod.`);
    } catch (err) {
      alert("Ralat semasa menyimpan data import.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAgeAndGender = (ic: string) => {
    if (ic.length < 12) {
      setEditingMember(prev => ({ ...prev, nokp: ic }));
      return;
    }
    const last = parseInt(ic.slice(-1));
    const jantina = (last % 2 !== 0) ? 'LELAKI' : 'PEREMPUAN';
    const yearPrefix = parseInt(ic.substring(0, 2));
    const currentYear = new Date().getFullYear();
    const birthYear = (yearPrefix > (currentYear % 100)) ? (1900 + yearPrefix) : (2000 + yearPrefix);
    const age = currentYear - birthYear;
    
    setEditingMember(prev => ({ 
      ...prev, 
      jantina: jantina as any, 
      umur: `${age} TAHUN`,
      nokp: ic
    }));
  };

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);
    try {
      const finalMember = {
        ...editingMember,
        id: editingMember.id || Math.random().toString(36).substr(2, 9),
        nama: editingMember.nama?.toUpperCase(),
        tempat: editingMember.tempat?.toUpperCase(),
        alamat: editingMember.alamat?.toUpperCase(),
        pekerjaan: editingMember.pekerjaan?.toUpperCase(),
      } as CommitteeMember;
      await saveMemberToDb(finalMember);
      setEditingMember(null);
    } catch (err) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('DATA')} className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'DATA' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}>DATA JAWATANKUASA</button>
        <button onClick={() => setActiveTab('MOSQUE')} className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'MOSQUE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}>PENGURUSAN MASJID</button>
        {isSuperAdmin && (
          <button onClick={() => setActiveTab('USERS')} className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:text-slate-900'}`}>PENGGUNA</button>
        )}
      </div>

      {activeTab === 'DATA' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl relative">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingMember ? 'Borang Data Ahli' : 'Senarai Jawatankuasa'}
              </h3>
              {!editingMember && (
                <div className="flex gap-2">
                  <button onClick={() => setIsImportModalOpen(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    IMPORT PINTAR (AI)
                  </button>
                  <button onClick={() => setEditingMember({ jenis: Category.MASJID, jantina: 'LELAKI' as any, parlimen: '', dun: '', jawatan: JAWATAN_AJK[0], tempat: mosqueInfo[0]?.namaMasjid || '' })} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md">+ TAMBAH DATA</button>
                </div>
              )}
            </div>

            {editingMember ? (
              <form onSubmit={saveMember} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kategori</label>
                  <select required value={editingMember.jenis} onChange={e => setEditingMember({ ...editingMember, jenis: e.target.value as any })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={Category.MASJID}>MASJID</option>
                    <option value={Category.SURAU}>SURAU</option>
                    <option value={Category.PEGAWAI}>PEGAWAI MASJID</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. KP</label>
                  <input required maxLength={12} placeholder="CONTOH: 800101071234" value={editingMember.nokp || ''} onChange={e => calculateAgeAndGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Penuh</label>
                  <input required value={editingMember.nama || ''} onChange={e => setEditingMember({ ...editingMember, nama: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold uppercase" />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jawatan</label>
                  <select required value={editingMember.jawatan} onChange={e => setEditingMember({ ...editingMember, jawatan: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold">
                    {[...JAWATAN_AJK, ...JAWATAN_PEGAWAI].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. Telefon</label>
                  <input required value={editingMember.notel || ''} onChange={e => setEditingMember({ ...editingMember, notel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pekerjaan</label>
                  <input required value={editingMember.pekerjaan || ''} onChange={e => setEditingMember({ ...editingMember, pekerjaan: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold uppercase" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tempat Bertugas (Masjid/Surau)</label>
                  <input required value={editingMember.tempat || ''} onChange={e => setEditingMember({ ...editingMember, tempat: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold uppercase" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Parlimen</label>
                  <select required value={editingMember.parlimen} onChange={e => setEditingMember({ ...editingMember, parlimen: e.target.value, dun: '' })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold">
                    <option value="">PILIH PARLIMEN</option>
                    {Object.keys(PARLIMEN_DUN).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">DUN</label>
                  <select required value={editingMember.dun} onChange={e => setEditingMember({ ...editingMember, dun: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold">
                    <option value="">PILIH DUN</option>
                    {editingMember.parlimen && PARLIMEN_DUN[editingMember.parlimen]?.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat Kediaman</label>
                  <textarea required value={editingMember.alamat || ''} onChange={e => setEditingMember({ ...editingMember, alamat: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold uppercase min-h-[80px]" />
                </div>

                <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setEditingMember(null)} className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan Data'}</button>
                </div>
              </form>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="py-4 px-6 border-b">Nama & Jawatan</th>
                      <th className="py-4 px-6 border-b">No KP</th>
                      <th className="py-4 px-6 border-b">No Tel</th>
                      <th className="py-4 px-6 border-b">Alamat</th>
                      <th className="py-4 px-6 border-b">Pekerjaan</th>
                      <th className="py-4 px-6 border-b">Umur & Jantina</th>
                      <th className="py-4 px-6 border-b text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="text-sm font-bold uppercase text-slate-900">{m.nama}</div>
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.jawatan}</div>
                          <div className="text-[9px] text-slate-400 uppercase">{m.tempat}</div>
                        </td>
                        <td className="py-4 px-6 text-xs font-mono font-bold text-slate-700">{m.nokp}</td>
                        <td className="py-4 px-6 text-xs font-mono font-bold text-slate-700">{m.notel}</td>
                        <td className="py-4 px-6 max-w-[200px]">
                           <div className="text-[9px] text-slate-500 line-clamp-2 uppercase leading-tight font-semibold">{m.alamat || '-'}</div>
                        </td>
                        <td className="py-4 px-6 text-[10px] font-bold text-slate-600 uppercase">{m.pekerjaan || '-'}</td>
                        <td className="py-4 px-6">
                           <div className="text-[10px] font-bold text-slate-800">{m.umur}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase">{m.jantina}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => setEditingMember(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-[10px] font-black uppercase border border-blue-100 transition-colors">Edit</button>
                            {isSuperAdmin && (
                              <button onClick={() => { if(confirm('Padam rekod ini?')) deleteMemberFromDb(m.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md text-[10px] font-black uppercase border border-red-100 transition-colors">Padam</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal logic remains the same... */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsImportModalOpen(false)} />
          <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Import Data Pintar (AI)</h3>
                <p className="text-xs text-blue-100 opacity-80">Muat naik PDF, Word atau Excel. AI akan mengekstrak data jawatankuasa untuk anda.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-blue-100 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {importStatus === 'idle' && (
                <div className="border-4 border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-2">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h4 className="font-black text-slate-800 uppercase tracking-widest">Pilih Fail Anda</h4>
                  <p className="text-sm text-slate-500 max-w-xs">Sokongan format: .xlsx, .docx, .txt</p>
                  <label className="mt-4 px-8 py-3 bg-blue-600 text-white font-black text-xs uppercase rounded-xl cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">
                    PILIH FAIL DARI PERANTI
                    <input type="file" accept=".xlsx,.xls,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}

              {importStatus === 'loading' && (
                <div className="p-16 text-center flex flex-col items-center gap-6">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800 uppercase animate-pulse">AI Sedang Menganalisis...</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Mengekstrak data jawatankuasa daripada dokumen</p>
                  </div>
                </div>
              )}

              {importStatus === 'preview' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-900 uppercase">Pratinjau Data Ekstrak ({importedData.length} Rekod)</h4>
                    <button onClick={() => setImportStatus('idle')} className="text-[10px] font-black text-blue-600 uppercase underline">Pilih Fail Lain</button>
                  </div>
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-900 text-white font-black uppercase tracking-tighter">
                        <tr>
                          <th className="p-3">Nama & Jawatan</th>
                          <th className="p-3">No KP</th>
                          <th className="p-3">Alamat</th>
                          <th className="p-3">Pekerjaan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importedData.map((d, i) => (
                          <tr key={i} className="hover:bg-blue-50">
                            <td className="p-3">
                               <div className="font-bold uppercase text-slate-900">{d.nama}</div>
                               <div className="font-semibold text-blue-600 uppercase">{d.jawatan}</div>
                            </td>
                            <td className="p-3 font-mono">{d.nokp}</td>
                            <td className="p-3 uppercase max-w-[200px] truncate">{d.alamat || '-'}</td>
                            <td className="p-3 uppercase font-semibold text-slate-500">{d.pekerjaan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">Sila semak data di atas. AI telah mengekstrak Alamat dan Pekerjaan yang dijumpai. Jika maklumat tidak lengkap, anda boleh mengedit secara manual selepas mengesahkan import.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase">Batal</button>
              {importStatus === 'preview' && (
                <button onClick={confirmImport} disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700">
                  {isSaving ? 'MEMPROSES...' : 'SAHKAN & IMPORT SEKARANG'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Pengurusan Masjid logic remains the same... */}
      {activeTab === 'MOSQUE' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase">Maklumat Masjid</h3>
              <button onClick={() => setEditingMosque({ id: Math.random().toString(36).substr(2, 9) })} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-700 transition-all">+ TAMBAH MASJID</button>
           </div>
           
           {editingMosque && (
             <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Masjid</label>
                   <input required value={editingMosque.namaMasjid || ''} onChange={e => setEditingMosque({ ...editingMosque, namaMasjid: e.target.value.toUpperCase() })} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold uppercase" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. Pendaftaran</label>
                   <input required value={editingMosque.noPendaftaran || ''} onChange={e => setEditingMosque({ ...editingMosque, noPendaftaran: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold" />
                 </div>
                 <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                    <button onClick={() => setEditingMosque(null)} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Batal</button>
                    <button onClick={async () => {
                      if (!editingMosque.namaMasjid) return;
                      await saveMosqueToDb(editingMosque as MosqueInfo);
                      setEditingMosque(null);
                    }} className="px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg shadow-md">Simpan Masjid</button>
                 </div>
               </div>
             </div>
           )}

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <tbody className="divide-y divide-slate-100">
                 {mosqueInfo.map(i => (
                   <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4">
                        <div className="text-sm font-bold uppercase text-slate-900">{i.namaMasjid}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">NO PENDAFTARAN: {i.noPendaftaran}</div>
                     </td>
                     <td className="p-4 text-right">
                       <button onClick={() => setEditingMosque(i)} className="text-blue-600 text-[10px] font-black uppercase hover:bg-blue-50 px-3 py-1.5 rounded-md mr-2 transition-all">Edit</button>
                       {isSuperAdmin && (
                         <button onClick={() => { if(confirm('Padam masjid ini?')) deleteMosqueFromDb(i.id) }} className="text-red-500 text-[10px] font-black uppercase hover:bg-red-50 px-3 py-1.5 rounded-md transition-all">Padam</button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
