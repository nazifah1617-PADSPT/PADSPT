import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, Loader2, ArrowRight, AlertCircle, RefreshCcw, User, ArrowLeft, LogOut, KeyRound, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'GOOGLE' | 'MANUAL'>('GOOGLE');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');

  // Auto-redirect if admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      console.log("Admin detected, redirecting to /admin...");
      const timer = setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail || !manualPassword) {
      setError("Sila masukkan emel dan kata laluan.");
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, manualEmail, manualPassword);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth error details:", err);
    let message = "Gagal log masuk. Sila cuba lagi.";
    
    if (err.code === 'auth/popup-blocked') {
      message = "Popup disekat oleh pelayar anda. Sila benarkan popup untuk laman web ini.";
    } else if (err.code === 'auth/unauthorized-domain') {
      message = `Domain ini (${window.location.hostname}) belum dibenarkan dalam Firebase Console.`;
      setDebugInfo(`Sila tambah domain ini di Firebase Console > Authentication > Settings > Authorized Domains.`);
    } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
      message = "Log masuk dibatalkan. Sila pastikan anda melengkapkan proses di tetingkap Google yang muncul.";
      setDebugInfo("Tetingkap log masuk ditutup sebelum selesai. Sila klik butang log masuk semula dan jangan tutup tetingkap tersebut sehingga selesai.");
    } else if (err.code === 'auth/network-request-failed') {
      message = "Masalah rangkaian. Sila periksa sambungan internet anda.";
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      message = "Emel atau kata laluan salah. Sila cuba lagi.";
    } else {
      message = `Ralat log masuk: ${err.message || "Sila cuba lagi."}`;
    }
    setError(message);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gov-gold/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="gov-gradient p-10 text-center text-white relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-4 rounded-3xl shadow-xl inline-block mb-6"
            >
              <img src="https://i.postimg.cc/T3NqjCYM/logo-penangpng.png" alt="Jata Pulau Pinang" className="h-20 w-20" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Sistem e-Kariah</h1>
            <p className="text-blue-100/80 text-sm font-medium uppercase tracking-widest">Portal Pentadbiran</p>
          </div>

          <div className="p-10 space-y-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div className="space-y-2">
                    <p className="font-bold">Ralat Log Masuk</p>
                    <p className="opacity-90 leading-relaxed">{error}</p>
                    {debugInfo && (
                      <div className="mt-2 p-3 bg-red-100/50 rounded-lg text-[10px] font-mono text-red-800 border border-red-200/50">
                        <p className="font-bold mb-1 uppercase opacity-50">Maklumat Diagnostik:</p>
                        <pre className="whitespace-pre-wrap break-all">{debugInfo}</pre>
                      </div>
                    )}
                    <button 
                      onClick={handleRefresh}
                      className="text-xs font-bold underline hover:no-underline flex items-center gap-1"
                    >
                      Segarkan Halaman <RefreshCcw size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 bg-gov-blue/10 rounded-2xl flex items-center justify-center text-gov-blue shrink-0">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log masuk sebagai</p>
                    <p className="font-bold text-slate-900 truncate">{user.email}</p>
                    <p className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-white/50 border border-current/10 font-bold uppercase">
                      PERANAN: {isAdmin ? 'ADMIN' : 'PENGGUNA'}
                    </p>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">Akses Dibenarkan</p>
                      <p className="text-sm font-medium">Anda mempunyai akses Pentadbir.</p>
                    </div>
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full bg-gov-blue text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                    >
                      MASUK KE DASHBOARD <ArrowRight size={18} />
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-slate-400 text-xs font-bold hover:text-red-500 transition-colors py-2"
                    >
                      LOG KELUAR AKAUN
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-center">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">Akses Terhad</p>
                      <p className="text-sm font-medium leading-relaxed">
                        Akaun anda didaftarkan sebagai <b>Pengguna Biasa</b>. Sila hubungi Super Admin untuk menaik taraf akses anda.
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => window.location.reload()}
                      className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 mb-3"
                    >
                      <RefreshCcw size={18} />
                      SEMAK SEMULA AKSES (SYNC)
                    </button>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        LOG KELUAR & TUKAR AKAUN
                      </button>
                      <Link 
                        to="/" 
                        className="w-full border-2 border-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        KEMBALI KE CARIAN AWAM
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                    onClick={() => setLoginMode('GOOGLE')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                      loginMode === 'GOOGLE' ? "bg-white text-gov-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    GOOGLE LOGIN
                  </button>
                  <button 
                    onClick={() => setLoginMode('MANUAL')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                      loginMode === 'MANUAL' ? "bg-white text-gov-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    MANUAL LOGIN
                  </button>
                </div>

                {loginMode === 'GOOGLE' ? (
                  <div className="space-y-6">
                    <p className="text-slate-500 text-center text-sm leading-relaxed">
                      Sila log masuk menggunakan akaun Google rasmi anda untuk mengakses dashboard pentadbiran.
                    </p>
                    
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn || authLoading}
                      className="w-full bg-white border-2 border-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoggingIn || authLoading ? (
                        <Loader2 className="animate-spin text-gov-blue" size={20} />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {isLoggingIn || authLoading ? 'SILA TUNGGU...' : 'LOG MASUK DENGAN GOOGLE'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleManualLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Emel Pentadbir</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="contoh@penang.gov.my"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-gov-blue focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Kata Laluan</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="password" 
                          value={manualPassword}
                          onChange={(e) => setManualPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-gov-blue focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoggingIn || authLoading}
                      className="w-full bg-gov-blue text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 disabled:opacity-50"
                    >
                      {isLoggingIn || authLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>LOG MASUK MANUAL <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                )}

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bantuan Log Masuk</p>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4">
                      <li>Gunakan pelayar <b>Google Chrome</b> untuk pengalaman terbaik.</li>
                      <li>Pastikan <b>Popup</b> dibenarkan (Allowed) dalam tetapan pelayar.</li>
                      <li>Jangan tutup tetingkap Google sehingga proses selesai.</li>
                    </ul>
                  </div>
                  
                  <Link 
                    to="/" 
                    className="text-gov-blue text-sm font-bold hover:underline flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} /> Kembali ke Carian Awam
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest opacity-50">
            Domain: {window.location.hostname}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
