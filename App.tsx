
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
import { subscribeMembers, subscribeMosques, resetConnection } from './services/firebase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('PUBLIC');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [mosqueInfo, setMosqueInfo] = useState<MosqueInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    let unsubM = () => {};
    let unsubQ = () => {};

    try {
      unsubM = subscribeMembers((data) => {
        setMembers(data);
        setIsLoading(false);
        setDbError(false);
      });
      
      unsubQ = subscribeMosques((data) => {
        setMosqueInfo(data);
      });
    } catch (e) {
      console.error("Connection initiation failed:", e);
      setDbError(true);
    }

    const timer = setTimeout(() => {
      if (isLoading && members.length === 0) {
        setDbError(true);
        setIsLoading(false);
      }
    }, 6000);

    return () => { 
      unsubM(); 
      unsubQ(); 
      clearTimeout(timer);
    };
  }, [isLoading, members.length]);

  const handleHardReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col p-6">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 border-r-transparent shadow-lg"></div>
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Logo" className="h-14 w-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-4 max-w-xs">
           <h2 className="text-blue-900 font-black tracking-widest animate-pulse uppercase text-sm">Menghubungkan ke Pangkalan Data...</h2>
           <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
             <div className="h-full bg-blue-600 animate-shimmer" style={{ width: '100%' }}></div>
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Firebase Cluster: data-kariah-spt</p>
        </div>
      </div>
    );
  }

  if (dbError && members.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white flex-col p-8 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-orange-50 p-10 rounded-full mb-8 border-4 border-orange-100">
          <svg className="w-20 h-20 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Sambungan Tergendala</h2>
        <p className="text-sm text-slate-500 max-w-md mb-10 leading-relaxed font-medium">Sistem menghadapi masalah untuk menghubungi Firestore. Ini mungkin disebabkan oleh sekatan rangkaian, ketiadaan pangkalan data, atau ralat konfigurasi pada Firebase Console.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Cuba Lagi</button>
          <button onClick={handleHardReset} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95">Reset Paksa (Hard Reset)</button>
        </div>
        
        <p className="mt-12 text-[9px] font-black text-slate-300 uppercase tracking-widest">Pejabat Agama Daerah SPT • 2025</p>
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
              <button onClick={() => { setCurrentUser(null); setViewMode('PUBLIC'); }} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm uppercase">LOG KELUAR</button>
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
              <p className="text-[9px] mt-2 opacity-30 uppercase tracking-widest font-black">Sistem Maklumat Masjid SPT v3.6 (Connection Reset Update)</p>
            </div>
          </div>
        </div>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onSuccess={(user) => { setCurrentUser(user); setViewMode('ADMIN'); setIsLoginOpen(false); }} />}
    </div>
  );
};

export default App;
