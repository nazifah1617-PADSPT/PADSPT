
import React, { useState } from 'react';
import { User } from '../types';
import { getAllUsers } from '../services/firebase';

interface Props {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const LoginModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const users = await getAllUsers();
      // Cari pengguna berdasarkan e-mel (case insensitive)
      const foundUser = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (foundUser) {
        onSuccess({ 
          id: foundUser.id, 
          email: foundUser.email, 
          role: foundUser.role 
        });
      } else {
        setError('E-mel atau Kata Laluan tidak sah.');
      }
    } catch (err) {
      setError('Ralat sambungan pangkalan data.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-8 text-center text-white">
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Jata" className="h-16 mx-auto mb-4 filter drop-shadow-md" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Akses Pentadbir</h2>
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest opacity-80">Sila Log Masuk dengan E-mel Rasmi</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold border border-red-100 rounded-lg text-center uppercase animate-pulse">{error}</div>}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alamat E-mel</label>
            <input type="email" autoFocus required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" disabled={isLoggingIn} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kata Laluan</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoggingIn} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50" />
          </div>
          <button type="submit" disabled={isLoggingIn} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-sm mt-4 disabled:opacity-50">
            {isLoggingIn ? 'Memproses...' : 'Log Masuk'}
          </button>
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 font-medium italic">Sistem Cloud Production Aktif</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
