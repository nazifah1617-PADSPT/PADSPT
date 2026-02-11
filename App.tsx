
import React, { useState, useEffect } from 'react';
import { 
  ViewMode, 
  CommitteeMember, 
  MosqueInfo, 
  User 
} from './types';
import PublicView from './components/PublicView';
import AdminView from './components/AdminView';
import LoginModal from './components/LoginModal';
import AiAssistant from './components/AiAssistant';
import { subscribeMembers, subscribeMosques } from './services/firebase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('PUBLIC');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [mosqueInfo, setMosqueInfo] = useState<MosqueInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    // Firebase Listeners
    const unsubM = subscribeMembers((data) => {
      setMembers(data);
      setIsLoading(false);
      setDbError(false);
    });
    
    const unsubQ = subscribeMosques((data) => {
      setMosqueInfo(data);
      setIsLoading(false);
      setDbError(false);
    });

    // Timeout safety - if still loading after 8s, show potential error
    const timer = setTimeout(() => {
      if (isLoading && members.length === 0) {
        setDbError(true);
        setIsLoading(false);
      }
    }, 8000);

    return () => { 
      unsubM(); 
      unsubQ(); 
      clearTimeout(timer);
    };
  }, [isLoading, members.length]);

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('PUBLIC');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
        <div className="relative">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Logo" className="h-12 w-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="mt-8 text-center space-y-2">
           <p className="text-blue-900 font-black tracking-widest animate-pulse uppercase text-xs">Menghubungkan ke Pangkalan Data Firebase...</p>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Production Mode: data-kariah-spt</p>
        </div>
      </div>
    );
  }

  if (dbError && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col p-8 text-center animate-in fade-in duration-700">
        <div className="bg-red-50 p-8 rounded-full mb-6 border-2 border-red-100">
          <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase mb-3 tracking-tighter">Pangkalan Data Belum Aktif</h2>
        <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">Sistem tidak dapat menghubungi Cloud Firestore. Sila pastikan anda telah mengaktifkan <strong>Firestore Database</strong> di Firebase Console bagi projek <strong>data-kariah-spt</strong> dan menetapkan <strong>Rules</strong> yang betul.</p>
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">Cuba Hubung Semula</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Logo" className="h-14 w-auto" />
          <div className="border-l border-slate-200 pl-4">
            <h1 className="text-sm md:text-lg font-black text-blue-900 tracking-tight leading-tight uppercase">Pejabat Agama Daerah Seberang Perai Tengah</h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Jabatan Hal Ehwal Agama Islam Pulau Pinang</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {viewMode === 'ADMIN' ? (
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-900 lowercase tracking-tighter">{currentUser?.email}</p>
                <div className="flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{currentUser?.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm uppercase">LOG KELUAR</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={() => setIsLoginOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-blue-600 shadow-xl shadow-slate-100 transition-all hover:-translate-y-0.5 uppercase tracking-widest">Portal Pentadbir</button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Awan Aktif (PROD)</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-7xl">
        {viewMode === 'PUBLIC' ? (
          <PublicView members={members} mosqueInfo={mosqueInfo} />
        ) : (
          <AdminView members={members} mosqueInfo={mosqueInfo} currentUser={currentUser} />
        )}
      </main>

      <AiAssistant members={members} />

      <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-20 border-t-8 border-blue-600">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3">
              <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" className="h-8 grayscale brightness-200" alt="logo" />
              JHEAINPP
            </h3>
            <div className="space-y-1 text-xs opacity-70">
              <p className="font-bold">Jabatan Hal Ehwal Agama Islam Negeri Pulau Pinang</p>
              <p>Lebuh Pantai, 10300 Pulau Pinang</p>
              <p>Tel: 04-684 7000 | Faks: 04-263 3232</p>
            </div>
          </div>
          <div className="md:text-right flex flex-col justify-end space-y-4">
            <div className="flex flex-wrap md:justify-end gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
               <a href="#" className="hover:text-blue-400">Dasar Privasi</a>
               <a href="#" className="hover:text-blue-400">Terma Perkhidmatan</a>
               <a href="#" className="hover:text-blue-400">Bantuan AI</a>
            </div>
            <div>
              <p className="text-xs">&copy; 2025 JHEAINPP. Hak Cipta Terpelihara.</p>
              <p className="text-[9px] mt-2 opacity-30 uppercase tracking-widest font-black">Sistem Maklumat Masjid SPT v3.5 (Build: 20250211)</p>
            </div>
          </div>
        </div>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onSuccess={(user) => { setCurrentUser(user); setViewMode('ADMIN'); setIsLoginOpen(false); }} />}
    </div>
  );
};

export default App;
