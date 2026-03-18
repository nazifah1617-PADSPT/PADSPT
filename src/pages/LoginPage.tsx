import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/admin');
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
    } finally {
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
