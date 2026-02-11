
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
  subscribeUsers,
  deleteUserFromDb,
  saveUserToDb
} from '../services/firebase';
import { parseImportedData } from '../services/gemini';

interface Props {
  members: CommitteeMember[];
  mosqueInfo: MosqueInfo[];
  currentUser: User | null;
}

type AdminTab = 'JK_MASJID' | 'JK_SURAU' | 'PEGAWAI' | 'MOSQUE' | 'USERS';

const AdminView: React.FC<Props> = ({ members, mosqueInfo, currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('JK_MASJID');
  const [editingMember, setEditingMember] = useState<Partial<CommitteeMember> | null>(null);
  const [editingMosque, setEditingMosque] = useState<Partial<MosqueInfo> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
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

  const filteredMembers = members.filter(m => {
    if (activeTab === 'JK_MASJID') return m.jenis === Category.MASJID;
    if (activeTab === 'JK_SURAU') return m.jenis === Category.SURAU;
    if (activeTab === 'PEGAWAI') return m.jenis === Category.PEGAWAI;
    return false;
  });

  const getActiveCategory = (): Category => {
    if (activeTab === 'JK_SURAU') return Category.SURAU;
    if (activeTab === 'PEGAWAI') return Category.PEGAWAI;
    return Category.MASJID;
  };

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
      const contextualData = extracted.map((item: any) => ({
        ...item,
        jenis: getActiveCategory()
      }));
      setImportedData(contextualData);
      setImportStatus('preview');
    } catch (err) {
      alert("Gagal membaca fail.");
      setImportStatus('idle');
    }
  };

  const confirmImport = async () => {
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      for (const item of importedData) {
        const finalMember = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          jantina: 'LELAKI',
          umur: 'N/A',
          nama: item.nama?.toUpperCase() || '',
          tempat: item.tempat?.toUpperCase() || '',
          notel: item.notel || '',
          alamat: item.alamat?.toUpperCase() || '',
          pekerjaan: item.pekerjaan?.toUpperCase() || '',
          tarikhLantikan: new Date().toISOString().split('T')[0],
          tarikhTamat: '',
          jawatan: item.jawatan || (activeTab === 'PEGAWAI' ? JAWATAN_PEGAWAI[0] : JAWATAN_AJK[0]),
          jenis: getActiveCategory()
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

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);
    try {
      const finalMember = {
        ...editingMember,
        id: editingMember.id && !editingMember.id.includes('temp-') ? editingMember.id : Math.random().toString(36).substr(2, 9),
      } as CommitteeMember;
      await saveMemberToDb(finalMember);
      setEditingMember(null);
    } catch (err) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.email || !editingUser.password) return;
    setIsSaving(true);
    try {
      const newUser = {
        ...editingUser,
        id: editingUser.id || Math.random().toString(36).substr(2, 9),
        role: editingUser.role || 'user'
      } as User;
      await saveUserToDb(newUser);
      setEditingUser(null);
      alert("Pengguna berjaya disimpan.");
    } catch (err) {
      alert("Gagal menyimpan maklumat pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneMember = (member: CommitteeMember) => {
    if (!isSuperAdmin) return;
    const { id, nama, nokp, notel, ...rest } = member;
    setEditingMember({
      ...rest,
      id: `temp-${Math.random().toString(36).substr(2, 5)}`,
      nama: '',
      nokp: '',
      notel: ''
    });
  };

  const tabStyle = (tab: AdminTab) => `px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 translate-y-[-2px]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`;

  const renderDataTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {editingMember ? 'KEMASKINI DATA' : `SENARAI ${activeTab.replace('_', ' ')}`}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pengurusan {activeTab.replace('JK_', '')}</p>
          </div>
          {!editingMember && isSuperAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setIsImportModalOpen(true)} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 uppercase">
                Import AI
              </button>
              <button onClick={() => setEditingMember({ jenis: getActiveCategory(), jantina: 'LELAKI', parlimen: '', dun: '', jawatan: activeTab === 'PEGAWAI' ? JAWATAN_PEGAWAI[0] : JAWATAN_AJK[0], tempat: mosqueInfo[0]?.namaMasjid || '' })} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-xl hover:bg-blue-600 transition-all uppercase">
                Tambah Rekod
              </button>
            </div>
          )}
        </div>

        {editingMember ? (
          <form onSubmit={saveMember} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Penuh</label>
              <input required value={editingMember.nama || ''} onChange={e => setEditingMember({ ...editingMember, nama: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. KP</label>
              <input required maxLength={12} value={editingMember.nokp || ''} onChange={e => setEditingMember({...editingMember, nokp: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jawatan</label>
              <select required value={editingMember.jawatan} onChange={e => setEditingMember({ ...editingMember, jawatan: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold">
                {(editingMember.jenis === Category.PEGAWAI ? JAWATAN_PEGAWAI : JAWATAN_AJK).map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tempat / Kariah</label>
              <input required value={editingMember.tempat || ''} onChange={e => setEditingMember({ ...editingMember, tempat: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. Telefon</label>
              <input required value={editingMember.notel || ''} onChange={e => setEditingMember({ ...editingMember, notel: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pekerjaan</label>
              <input value={editingMember.pekerjaan || ''} onChange={e => setEditingMember({ ...editingMember, pekerjaan: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold uppercase outline-none" />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setEditingMember(null)} className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest">Batal</button>
              <button type="submit" disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg">
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="p-5">Nama & Jawatan</th>
                  <th className="p-5">Lokasi</th>
                  <th className="p-5 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map(m => (
                  <tr key={m.id} className="hover:bg-blue-50/30 group">
                    <td className="p-5">
                      <div className="text-sm font-extrabold uppercase text-slate-900 group-hover:text-blue-700">{m.nama}</div>
                      <div className="text-[10px] text-blue-600 font-black uppercase">{m.jawatan}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs font-bold uppercase text-slate-700">{m.tempat}</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase">{m.notel}</div>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-4">
                        <button onClick={() => setEditingMember(m)} className="text-blue-600 text-[10px] font-black uppercase hover:underline">Edit</button>
                        {isSuperAdmin && (
                          <>
                            <button onClick={() => handleCloneMember(m)} className="text-emerald-600 text-[10px] font-black uppercase hover:underline">Salin</button>
                            <button onClick={() => { if(confirm('Padam?')) deleteMemberFromDb(m.id) }} className="text-red-500 text-[10px] font-black uppercase hover:underline">Padam</button>
                          </>
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
  );

  return (
    <div className="space-y-8">
      <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full lg:max-w-fit gap-1">
        <button onClick={() => setActiveTab('JK_MASJID')} className={tabStyle('JK_MASJID')}>JK MASJID</button>
        <button onClick={() => setActiveTab('JK_SURAU')} className={tabStyle('JK_SURAU')}>JK SURAU</button>
        <button onClick={() => setActiveTab('PEGAWAI')} className={tabStyle('PEGAWAI')}>PEGAWAI</button>
        <button onClick={() => setActiveTab('MOSQUE')} className={tabStyle('MOSQUE')}>URUS TEMPAT</button>
        {isSuperAdmin && (
          <button onClick={() => setActiveTab('USERS')} className={tabStyle('USERS')}>PENGGUNA</button>
        )}
      </div>

      {['JK_MASJID', 'JK_SURAU', 'PEGAWAI'].includes(activeTab) && renderDataTab()}

      {activeTab === 'MOSQUE' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Pengurusan Tempat Ibadah</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Senarai Masjid dan Surau Berdaftar</p>
              </div>
              {isSuperAdmin && (
                <button onClick={() => setEditingMosque({ id: Math.random().toString(36).substr(2, 9) })} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest">+ TAMBAH TEMPAT</button>
              )}
           </div>
           
           {editingMosque && (
             <form onSubmit={async (e) => {
               e.preventDefault();
               await saveMosqueToDb(editingMosque as MosqueInfo);
               setEditingMosque(null);
             }} className="mb-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Masjid / Surau</label>
                   <input required value={editingMosque.namaMasjid || ''} onChange={e => setEditingMosque({ ...editingMosque, namaMasjid: e.target.value.toUpperCase() })} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">No. Pendaftaran</label>
                   <input required value={editingMosque.noPendaftaran || ''} onChange={e => setEditingMosque({ ...editingMosque, noPendaftaran: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setEditingMosque(null)} className="px-5 py-2 text-[10px] font-black uppercase text-slate-500">Batal</button>
                    <button type="submit" className="px-8 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Simpan Lokasi</button>
                 </div>
             </form>
           )}

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <tbody className="divide-y divide-slate-100">
                 {mosqueInfo.map(i => (
                   <tr key={i.id} className="hover:bg-blue-50/30 transition-colors">
                     <td className="p-5">
                        <div className="text-sm font-extrabold uppercase text-slate-900">{i.namaMasjid}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PENDAFTARAN: {i.noPendaftaran}</div>
                     </td>
                     <td className="p-5 text-right">
                       <button onClick={() => setEditingMosque(i)} className="text-blue-600 text-[10px] font-black uppercase hover:underline mr-4">Edit</button>
                       {isSuperAdmin && (
                         <button onClick={() => { if(confirm('Padam?')) deleteMosqueFromDb(i.id) }} className="text-red-500 text-[10px] font-black uppercase hover:underline">Padam</button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'USERS' && isSuperAdmin && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Pengurusan Pengguna</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daftar e-mel dan tetapkan kata laluan petugas</p>
              </div>
              <button onClick={() => setEditingUser({ role: 'user', email: '', password: '' })} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest">+ PENGGUNA BARU</button>
           </div>

           {editingUser && (
             <form onSubmit={handleSaveUser} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alamat E-mel</label>
                  <input required type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="petugas@email.com" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kata Laluan</label>
                  <input required type="text" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none" placeholder="Tetapkan kata laluan" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peranan</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-semibold">
                    <option value="user">Petugas (Edit Sahaja)</option>
                    <option value="superadmin">Super Admin (Kawalan Penuh)</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2 text-[10px] font-black uppercase text-slate-500">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-8 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Simpan Pengguna</button>
                </div>
             </form>
           )}

           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                   <th className="p-5 border-b border-slate-100">Alamat E-mel</th>
                   <th className="p-5 border-b border-slate-100">Tahap Akses</th>
                   <th className="p-5 border-b border-slate-100 text-center">Tindakan</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                     <td className="p-5 font-bold text-slate-800 lowercase">{u.email}</td>
                     <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                     </td>
                     <td className="p-5 text-center">
                        {/* Halang pemadaman admin utama */}
                        {u.email !== 'ahmadhafizan@penang.gov.my' && (
                          <div className="flex justify-center gap-3">
                            <button onClick={() => setEditingUser(u)} className="text-blue-600 text-[10px] font-black uppercase hover:underline">Edit</button>
                            <button onClick={() => { if(confirm('Padam akses pengguna ini?')) deleteUserFromDb(u.id) }} className="text-red-500 text-[10px] font-black uppercase hover:underline">Padam</button>
                          </div>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {isImportModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSaving && setIsImportModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Import Pintar AI</h3>
                <p className="text-[10px] text-blue-100 uppercase font-black tracking-widest opacity-80 mt-1">Hanya Super Admin dibenarkan menambah data baru</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {importStatus === 'idle' && (
                <div className="border-4 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center gap-6">
                  <div className="p-5 bg-blue-100 text-blue-600 rounded-full">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <label className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer hover:bg-blue-600 shadow-xl transition-all">
                    MUAT NAIK FAIL
                    <input type="file" accept=".xlsx,.xls,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}

              {importStatus === 'loading' && (
                <div className="p-16 text-center flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <h4 className="font-black text-slate-800 uppercase animate-pulse tracking-widest">AI Sedang Mengekstrak...</h4>
                </div>
              )}

              {importStatus === 'preview' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Pratinjau {importedData.length} Rekod</h4>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-[9px]">
                      <thead className="bg-slate-900 text-white font-black uppercase">
                        <tr><th className="p-4">Nama</th><th className="p-4">Jawatan</th><th className="p-4">No KP</th></tr>
                      </thead>
                      <tbody>
                        {importedData.map((d, i) => (
                          <tr key={i} className="border-b"><td className="p-4 uppercase">{d.nama}</td><td className="p-4 uppercase">{d.jawatan}</td><td className="p-4">{d.nokp}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest">Batal</button>
              {importStatus === 'preview' && (
                <button onClick={confirmImport} disabled={isSaving} className="px-10 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-blue-700 transition-all">
                  IMPORT SEKARANG
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
