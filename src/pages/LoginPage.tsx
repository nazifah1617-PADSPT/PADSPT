import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn, Loader2, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      const timer = setTimeout(() => {
        navigate('/admin');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, authLoading, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // After successful login, we wait for useAuth to update isAdmin
      // We'll set a timeout to stop the local loading if redirection doesn't happen
      setTimeout(() => setLoading(false), 2000);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Log masuk dibatalkan. Sila cuba lagi.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError("Permintaan log masuk dibatalkan.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup disekat oleh pelayar anda. Sila benarkan popup.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setError("Domain ini tidak dibenarkan untuk log masuk. Sila tambah domain ini ke Authorized Domains di Firebase Console.");
      } else {
        setError(`Ralat: ${error.message || "Gagal log masuk."}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gov-gradient flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 text-center border-b border-slate-100">
          <div className="bg-gov-blue/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <img src="https://i.postimg.cc/T3NqjCYM/logo-penangpng.png" alt="Jata Pulau Pinang" className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Log Masuk Pegawai</h1>
          <p className="text-slate-500 text-sm mt-2">Sila gunakan akaun rasmi jabatan untuk mengakses sistem e-Kariah.</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}
          
          {isAdmin ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-center font-medium">
                Anda telah log masuk sebagai Admin.
              </div>
              <button 
                onClick={() => navigate('/admin')}
                className="w-full bg-gov-blue text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-gov-blue/20 hover:bg-gov-blue/90"
              >
                <LayoutDashboard size={20} />
                KE DASHBOARD ADMIN
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              )}
              LOG MASUK DENGAN GOOGLE
            </button>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Menghadapi masalah log masuk? 
              <br />
              Sila cuba <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-gov-blue hover:underline font-bold">buka sistem di tab baru</a>.
            </p>
          </div>
          
          <div className="mt-8 flex items-center gap-2 justify-center text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            <ShieldCheck size={14} />
            Sistem Keselamatan Tahap Kerajaan
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center">
          <p className="text-[10px] text-slate-400">
            Akses tanpa kebenaran adalah dilarang di bawah Akta Jenayah Komputer 1997.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
