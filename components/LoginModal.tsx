
import React, { useState } from 'react';
import { User } from '../types';
import { getAllUsers } from '../services/firebase';

interface Props {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const LoginModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getAllUsers();
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (foundUser) {
      onSuccess({ 
        id: foundUser.id, 
        username: foundUser.username, 
        role: foundUser.role 
      });
    } else {
      setError('ID Pengguna atau Kata Laluan salah.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-8 text-center text-white">
          <img src="https://i.postimg.cc/HsVZqzF5/JATAPenang.png" alt="Jata" className="h-16 mx-auto mb-4 filter drop-shadow-md" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Akses Pentadbir</h2>
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest opacity-80">Sila Log Masuk untuk Mengurus Data</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold border border-red-100 rounded-lg text-center uppercase animate-pulse">{error}</div>}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ID Pengguna</label>
            <input autoFocus required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kata Laluan</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-600" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest text-sm mt-4">Log Masuk</button>
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 font-medium">Pengguna Lalai: admin / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
