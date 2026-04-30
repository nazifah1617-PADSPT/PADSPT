import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, MapPin, Phone, User, Building2, ChevronRight, Loader2, LayoutDashboard, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PublicSearch() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name_partial');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ 
    masjid: 0, 
    surau: 0,
    jkMasjid: 0,
    jkSurau: 0,
    pegawai: 0
  });

  const [masjidList, setMasjidList] = useState<{id: string, nama: string}[]>([]);
  const [surauList, setSurauList] = useState<{id: string, nama: string}[]>([]);

  useEffect(() => {
    // If user is admin and lands on public search, redirect to dashboard
    // unless they specifically came here to search.
    // For now, let's auto-redirect to solve the user's issue.
    if (!authLoading && isAdmin && !searchTerm) {
      navigate('/admin');
    }
  }, [isAdmin, authLoading, navigate, searchTerm]);

  useEffect(() => {
    // Fetch real stats from Firestore
    const fetchStats = async () => {
      try {
        const [
          masjidCount,
          surauCount,
          jkMasjidCount,
          jkSurauCount,
          pegawaiCount,
          masjidsSnap,
          surausSnap
        ] = await Promise.all([
          getCountFromServer(collection(db, 'masjid_records')),
          getCountFromServer(collection(db, 'surau_records')),
          getCountFromServer(collection(db, 'jk_records')),
          getCountFromServer(collection(db, 'jk_surau_records')),
          getCountFromServer(collection(db, 'pegawai_records')),
          getDocs(query(collection(db, 'masjid_records'), orderBy('nama', 'asc'))),
          getDocs(query(collection(db, 'surau_records'), orderBy('nama', 'asc')))
        ]);

        setStats({
          masjid: masjidCount.data().count,
          surau: surauCount.data().count,
          jkMasjid: jkMasjidCount.data().count,
          jkSurau: jkSurauCount.data().count,
          pegawai: pegawaiCount.data().count
        });

        setMasjidList(masjidsSnap.docs.map(doc => ({ id: doc.id, nama: doc.data().nama })));
        setSurauList(surausSnap.docs.map(doc => ({ id: doc.id, nama: doc.data().nama })));
      } catch (error) {
        console.error("Error fetching stats or lists:", error);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const term = searchTerm.toUpperCase().trim();
      const icTerm = term.replace(/-/g, ''); // Remove dashes for IC search
      
      // We'll perform multiple queries and merge results
      const collections = ['jk_records', 'jk_surau_records', 'pegawai_records'];
      const allResults: any[] = [];

      for (const coll of collections) {
        const nameField = coll === 'pegawai_records' ? 'nama' : 'namaPenuh';
        let q;

        if (searchType === 'name_partial') {
          q = query(
            collection(db, coll),
            where(nameField, '>=', term),
            where(nameField, '<=', term + '\uf8ff'),
            limit(50)
          );
        } else if (searchType === 'name_exact') {
          q = query(
            collection(db, coll),
            where(nameField, '==', term),
            limit(50)
          );
        } else if (searchType === 'ic_partial') {
          q = query(
            collection(db, coll),
            where('noKP', '>=', icTerm),
            where('noKP', '<=', icTerm + '\uf8ff'),
            limit(50)
          );
        } else if (searchType === 'ic_exact') {
          q = query(
            collection(db, coll),
            where('noKP', '==', icTerm),
            limit(50)
          );
        } else if (searchType === 'phone') {
          q = query(
            collection(db, coll),
            where('noTel', '>=', term),
            where('noTel', '<=', term + '\uf8ff'),
            limit(50)
          );
        } else if (searchType === 'masjid_partial' && (coll === 'jk_records' || coll === 'pegawai_records')) {
          q = query(
            collection(db, coll),
            where('masjidName', '>=', term),
            where('masjidName', '<=', term + '\uf8ff'),
            limit(50)
          );
        } else if (searchType === 'masjid_exact' && (coll === 'jk_records' || coll === 'pegawai_records')) {
          q = query(
            collection(db, coll),
            where('masjidName', '==', searchTerm.trim()),
            limit(50)
          );
        } else if (searchType === 'surau_partial' && coll === 'jk_surau_records') {
          q = query(
            collection(db, coll),
            where('masjidName', '>=', term),
            where('masjidName', '<=', term + '\uf8ff'),
            limit(50)
          );
        } else if (searchType === 'surau_exact' && coll === 'jk_surau_records') {
          q = query(
            collection(db, coll),
            where('masjidName', '==', searchTerm.trim()),
            limit(50)
          );
        }

        if (q) {
          const snap = await getDocs(q);
          snap.docs.forEach(doc => {
            const data = doc.data() as any;
            allResults.push({ 
              id: doc.id, 
              ...data, 
              source: coll, 
              displayTitle: (data[nameField] || '').toUpperCase() 
            });
          });
        }
      }

      // De-duplicate results by ID
      const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
      
      // Sort by name
      uniqueResults.sort((a, b) => (a.displayTitle || '').localeCompare(b.displayTitle || ''));
      
      setResults(uniqueResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Redirection Notice */}
      <AnimatePresence>
        {!authLoading && isAdmin && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gov-blue text-white p-4 text-center font-bold shadow-lg flex items-center justify-center gap-3"
          >
            <Loader2 className="animate-spin" size={20} />
            Akses Pentadbir Dikesan. Mengalihkan anda ke Dashboard...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="gov-gradient text-white pt-20 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gov-gold/10 rounded-full -ml-32 -mb-32 blur-2xl" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-between items-center mb-12">
            <div className="w-32 hidden md:block" /> {/* Spacer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white p-3 rounded-2xl shadow-xl inline-block">
                <img src="https://i.postimg.cc/T3NqjCYM/logo-penangpng.png" alt="Jata Pulau Pinang" className="h-16 w-16" />
              </div>
            </motion.div>
            <div className="w-32 flex justify-end">
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="bg-white text-gov-blue hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                >
                  <LayoutDashboard size={16} /> DASHBOARD
                </Link>
              )}
            </div>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Sistem e-Kariah
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl opacity-90 mb-12 font-medium"
          >
            Portal Semakan Jawatankuasa Kariah, Surau & Pegawai Masjid Daerah Seberang Perai Tengah
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto"
          >
            <div className="md:w-1/3">
              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setSearchTerm('');
                }}
                className="w-full h-full min-h-[56px] px-4 py-4 rounded-xl bg-slate-50 text-slate-900 border-none focus:ring-2 focus:ring-gov-blue/20 font-medium select-none cursor-pointer"
              >
                <option value="name_partial">Nama (Carian Separa)</option>
                <option value="name_exact">Nama (Carian Tepat)</option>
                <option value="ic_partial">No. Kad Pengenalan (Separa)</option>
                <option value="ic_exact">No. Kad Pengenalan (Tepat)</option>
                <option value="phone">No. Telefon</option>
                <option value="masjid_partial">Nama Masjid (Carian Separa)</option>
                <option value="masjid_exact">Nama Masjid (Carian Tepat)</option>
                <option value="surau_partial">Nama Surau (Carian Separa)</option>
                <option value="surau_exact">Nama Surau (Carian Tepat)</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
              {searchType === 'masjid_exact' ? (
                <select
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 transition-all font-medium bg-slate-50 md:bg-white appearance-none h-full min-h-[56px] cursor-pointer"
                >
                  <option value="">-- Pilih Masjid --</option>
                  {masjidList.map(m => (
                    <option key={m.id} value={m.nama}>{m.nama}</option>
                  ))}
                </select>
              ) : searchType === 'surau_exact' ? (
                <select
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 transition-all font-medium bg-slate-50 md:bg-white appearance-none h-full min-h-[56px] cursor-pointer"
                >
                  <option value="">-- Pilih Surau --</option>
                  {surauList.map(s => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text"
                  placeholder="Kata kunci Carian..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 transition-all font-medium bg-slate-50 md:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              )}
            </div>
            <button 
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-gov-blue hover:bg-gov-blue/90 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
              CARI SEKARANG
            </button>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 text-xs mt-4 font-medium"
          >
            Tip: Masukkan nama penuh atau permulaan nama (Contoh: MOHD...) untuk hasil yang lebih tepat.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-16 max-w-5xl mx-auto opacity-80">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.masjid}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">Masjid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.surau}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">Surau</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.jkMasjid}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">JK Masjid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.jkSurau}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">JK Surau</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.pegawai}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">Pegawai Masjid</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-5xl mx-auto -mt-16 px-4 pb-20 relative z-20">
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4"
            >
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-500">Menunjukkan {results.length} keputusan carian</p>
                <button onClick={() => setResults([])} className="text-xs text-gov-blue font-bold hover:underline">Kosongkan</button>
              </div>
              {results.map((jk) => (
                <motion.div 
                  key={jk.id}
                  layout
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-gov-blue/30 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-gov-blue shrink-0">
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-gov-blue transition-colors">{jk.displayTitle}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-gov-blue/10 text-gov-blue text-[10px] font-bold rounded-full uppercase">
                            {jk.jawatan}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                            jk.source === 'jk_records' ? "bg-gov-blue text-white" : 
                            jk.source === 'jk_surau_records' ? "bg-amber-100 text-amber-700" :
                            "bg-purple-100 text-purple-700"
                          )}>
                            {jk.source === 'jk_records' ? 'MASJID' : 
                             jk.source === 'jk_surau_records' ? 'SURAU' : 'PEGAWAI'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                            jk.statusLantikan === 'Aktif' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {jk.statusLantikan}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={16} className="text-slate-400" />
                        <span className="font-medium">IC: {jk.noKP ? `${jk.noKP.substring(0, 6)}-${jk.noKP.substring(6, 8)}-XXXX` : 'Tiada Maklumat'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="font-medium">{jk.masjidName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="font-medium">{jk.daerah}, {jk.parlimen}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={16} className="text-slate-400" />
                        <span className="font-medium">{jk.noTel || 'Tiada Maklumat'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <ChevronRight size={16} className="text-slate-400" />
                        <span className="font-medium">DUN: {jk.dun}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : searchTerm && !loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-12 rounded-3xl shadow-xl text-center border border-slate-200"
            >
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Tiada Rekod Dijumpai</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Maaf, tiada rekod jawatankuasa kariah, surau atau pegawai masjid yang sepadan dengan carian "{searchTerm}". Sila pastikan ejaan adalah betul.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <img src="https://i.postimg.cc/T3NqjCYM/logo-penangpng.png" alt="Jata Pulau Pinang" className="h-12 w-12" />
            <div>
              <p className="font-bold text-slate-900">Jabatan Hal Ehwal Agama Islam Pulau Pinang</p>
              <p className="text-xs text-slate-500">Hakcipta Terpelihara © 2026 Kerajaan Negeri Pulau Pinang</p>
            </div>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-600">
            <Link to="/login" className="hover:text-gov-blue transition-colors">
              {isAdmin ? 'Dashboard Admin' : 'Log Masuk Pegawai'}
            </Link>
            <Link to="/privacy" className="hover:text-gov-blue transition-colors">Dasar Privasi</Link>
            <Link to="/terms" className="hover:text-gov-blue transition-colors">Terma & Syarat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
