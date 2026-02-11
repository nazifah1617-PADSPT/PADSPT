
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulasi sedikit kelewatan untuk menunjukkan loader (UX)
    const timer = setTimeout(() => {
      const unsubM = subscribeMembers((data) => {
        setMembers(data);
      });
      const unsubQ = subscribeMosques((data) => {
        setMosqueInfo(data);
        setIsLoading(false);
      });

      return () => { unsubM(); unsubQ(); };
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('PUBLIC');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Logo" className="h-10 w-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-blue-900 font-black tracking-widest animate-pulse uppercase text-xs text-center px-4">Menyediakan Arkib Tempatan Pejabat Agama SPT...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Logo" className="h-12 w-auto" />
          <div>
            <h1 className="text-sm md:text-lg font-extrabold text-blue-900 tracking-tight leading-tight uppercase">Pejabat Agama Daerah Seberang Perai Tengah</h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Jabatan Hal Ehwal Agama Islam Pulau Pinang</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {viewMode === 'ADMIN' ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700 uppercase">{currentUser?.username}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase">{currentUser?.role}</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors border border-red-100">LOG KELUAR</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setIsLoginOpen(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 uppercase tracking-wide">Portal Pentadbir</button>
              <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Mod Simpanan Tempatan Aktif</span>
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

      <footer className="bg-slate-900 text-slate-400 py-10 px-4 mt-12 border-t-8 border-blue-600">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-white font-bold mb-2 uppercase tracking-widest">Jabatan Hal Ehwal Agama Islam Negeri Pulau Pinang</h3>
            <p className="text-sm leading-relaxed">Lebuh Pantai, 10300 Pulau Pinang</p>
            <p className="text-sm mt-1">Tel: 04-684 7000 | 04-684 7777</p>
          </div>
          <div className="md:text-right flex flex-col justify-center">
            <p className="text-xs">&copy; 2025 JHEAINPP. Hak Cipta Terpelihara.</p>
            <p className="text-[10px] mt-2 opacity-50 uppercase tracking-tighter">Sistem Maklumat Masjid SPT v3.1 (Powered by Gemini)</p>
          </div>
        </div>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onSuccess={(user) => { setCurrentUser(user); setViewMode('ADMIN'); setIsLoginOpen(false); }} />}
    </div>
  );
};

export default App;
