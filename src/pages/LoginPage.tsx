import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/admin');
    } catch (error) {
      console.error("Login error:", error);
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
