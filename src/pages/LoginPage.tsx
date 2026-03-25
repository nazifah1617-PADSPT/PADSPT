import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn, Loader2, LayoutDashboard, LogOut, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';

export default function LoginPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Auto-redirect if admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      console.log("Admin detected, redirecting to /admin...");
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, user, authLoading, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    setDebugInfo(null);
    
    // Safety timeout for loading state
    const timeoutId = setTimeout(() => {
      setIsLoggingIn(false);
    }, 15000);

    try {
      console.log("Starting Google login...");
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid automatic login with wrong account
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user.email);
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "Gagal log masuk. Sila cuba lagi.";
      
      if (err.code === 'auth/popup-blocked') {
        message = "Popup disekat oleh pelayar. Sila benarkan popup untuk laman web ini.";
      } else if (err.code === 'auth/unauthorized-domain') {
        message = "Domain ini tidak dibenarkan untuk log masuk Firebase.";
        setDebugInfo(`Domain: ${window.location.hostname}\nSila tambah domain ini di Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = "Log masuk dibatalkan oleh pengguna.";
      } else {
        message = `Ralat: ${err.message || "Ralat tidak diketahui"}`;
      }
      
      setError(message);
    } finally {
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const isLoading = isLoggingIn || authLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gov-blue p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white">PADS PT</h1>
            <p className="text-blue-100 mt-2 text-sm">Sistem Pengurusan Data & Analitik</p>
          </div>

          <div className="p-8">
            {user ? (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl text-center font-medium ${isAdmin ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-blue-50 border border-blue-100 text-blue-700'}`}>
                  <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Log masuk sebagai:</p>
                  <p className="font-bold break-all">{user.email}</p>
                  <p className="text-[10px] mt-2 inline-block px-2 py-0.5 rounded bg-white/50 border border-current/10 font-bold">
                    PERANAN: {isAdmin ? 'ADMIN' : 'PENGGUNA'}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm">
                    <p className="font-semibold mb-1 flex items-center gap-2 text-amber-900">
                      <AlertCircle size={16} /> Akses Terhad
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed">Akaun anda didaftarkan sebagai Pengguna Biasa. Sila hubungi Super Admin untuk menaik taraf peranan anda jika anda perlu mengurus data.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full bg-gov-blue text-white py-3.5 px-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                    >
                      MASUK KE DASHBOARD <ArrowRight size={18} />
                    </button>
                  )}
                  
                  <Link
                    to="/"
                    className="w-full bg-slate-100 text-slate-700 py-3.5 px-4 rounded-xl font-bold hover:bg-slate-200 transition-all text-center active:scale-[0.98]"
                  >
                    KEMBALI KE LAMAN UTAMA
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full border border-slate-200 text-slate-500 py-3 px-4 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <LogOut size={18} /> LOG KELUAR
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Log Masuk Pentadbir</h2>
                  <p className="text-slate-500 text-sm">Sila gunakan akaun Google anda untuk mengakses sistem.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 text-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                    {debugInfo && (
                      <div className="mt-2 p-3 bg-red-100/50 rounded-lg text-[10px] font-mono text-red-800 border border-red-200/50">
                        <p className="font-bold mb-1 uppercase opacity-50">Maklumat Diagnostik:</p>
                        <pre className="whitespace-pre-wrap break-all">{debugInfo}</pre>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 px-4 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-gov-blue" size={20} />
                  ) : (
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  {isLoading ? 'SILA TUNGGU...' : 'LOG MASUK DENGAN GOOGLE'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-400 font-medium">Atau</span>
                  </div>
                </div>

                <Link
                  to="/"
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-gov-blue transition-colors text-sm font-bold group"
                >
                  <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Kembali ke Carian Awam
                </Link>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={12} /> Akses Terkawal & Selamat
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          &copy; 2024 Pejabat Daerah Tanah. Hak Cipta Terpelihara.
        </p>
      </motion.div>
    </div>
  );
}
