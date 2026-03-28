import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Map as MapIcon,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import GisMap from '../components/GisMap';

export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalJK: 0,
    totalMasjid: 0,
    totalSurau: 0,
    expiringSoon: 0,
    vacancies: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [chartGrouping, setChartGrouping] = useState<'parlimen' | 'dun'>('parlimen');
  const [allJkDocs, setAllJkDocs] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jkSnap = await getDocs(collection(db, 'jk_records'));
        const surauSnap = await getDocs(collection(db, 'surau_records'));
        const masjidSnap = await getDocs(collection(db, 'masjid_records'));
        const pegawaiSnap = await getDocs(collection(db, 'pegawai_records'));
        
        const jkDocs = jkSnap.docs.map(d => d.data());
        setAllJkDocs(jkDocs);
        const activeJK = jkDocs.filter(d => d.statusLantikan === 'Aktif').length;
        
        const surauDocs = surauSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'surau' }));
        const masjidDocs = masjidSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'masjid' }));
        
        setAllLocations([...masjidDocs, ...surauDocs]);
        setLoadingMap(false);
        
        // Calculate expiring soon (within 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expiring = jkDocs.filter(d => {
          if (!d.tarikhTamat) return false;
          const expiry = d.tarikhTamat.toDate ? d.tarikhTamat.toDate() : new Date(d.tarikhTamat);
          return expiry > now && expiry <= thirtyDaysFromNow;
        }).length;

        setStats({
          totalJK: activeJK,
          totalMasjid: masjidSnap.size,
          totalSurau: surauSnap.size,
          expiringSoon: expiring,
          vacancies: pegawaiSnap.size
        });

        updateChartData(jkDocs, chartGrouping);
      } catch (error: any) {
        console.error("Stats fetch error:", error);
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'stats_collections');
        }
      }
    };

    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
        const snap = await getDocs(q);
        setRecentLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error: any) {
        console.error("Logs fetch error:", error);
        if (error.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'audit_logs');
        }
      }
    };

    fetchStats();
    fetchLogs();
  }, []);

  const updateChartData = (docs: any[], grouping: 'parlimen' | 'dun') => {
    const counts: {[key: string]: number} = {};
    docs.forEach(d => {
      const key = d[grouping];
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const newChartData = Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    setChartData(newChartData);
  };

  useEffect(() => {
    if (allJkDocs.length > 0) {
      updateChartData(allJkDocs, chartGrouping);
    }
  }, [chartGrouping, allJkDocs]);

  const COLORS = ['#003366', '#00843D', '#C5A059', '#64748b', '#0f172a', '#334155', '#475569', '#1e293b'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Analitik</h1>
        <p className="text-slate-500">Ringkasan data Jawatankuasa Kariah seluruh negeri.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: 'Jumlah JK Aktif', value: stats.totalJK, icon: Users, color: 'text-gov-blue', bg: 'bg-gov-blue/5' },
          { label: 'Jumlah Masjid', value: stats.totalMasjid, icon: Building2, color: 'text-islamic-green', bg: 'bg-islamic-green/5' },
          { label: 'Jumlah Surau', value: stats.totalSurau, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tamat Tempoh (30 Hari)', value: stats.expiringSoon, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Kekosongan Jawatan', value: stats.vacancies, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Super Admin Quick Actions */}
      <AnimatePresence>
        {isSuperAdmin && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gov-blue/5 border border-gov-blue/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gov-blue text-white p-3 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Pengurusan Akses Pengguna</h4>
                <p className="text-sm text-slate-500">Terdapat pengguna baru yang mendaftar secara automatik? Klik butang di sebelah untuk menaik taraf peranan mereka.</p>
              </div>
            </div>
            <Link 
              to="/admin/users"
              className="bg-gov-blue hover:bg-gov-blue/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-gov-blue/20"
            >
              URUS PENGGUNA <ChevronRight size={18} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-gov-blue" />
              Taburan JK Mengikut {chartGrouping === 'parlimen' ? 'Parlimen' : 'DUN'}
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setChartGrouping('parlimen')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                  chartGrouping === 'parlimen' ? "bg-white text-gov-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                PARLIMEN
              </button>
              <button 
                onClick={() => setChartGrouping('dun')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                  chartGrouping === 'dun' ? "bg-white text-gov-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                DUN
              </button>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-gov-blue" />
            Aktiviti Terkini
          </h3>
          <div className="space-y-6">
            {recentLogs.length > 0 ? recentLogs.map((log, i) => (
              <div key={log.id} className="flex gap-4 relative">
                {i !== recentLogs.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-slate-100" />
                )}
                <div className={cn(
                  "w-6 h-6 rounded-full border-4 border-white shadow-sm shrink-0 z-10",
                  log.action === 'UPLOAD' ? "bg-gov-blue" : "bg-emerald-500"
                )} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    {log.timestamp?.toDate().toLocaleString('ms-MY')}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-8 italic">Tiada aktiviti direkodkan</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 text-gov-blue text-xs font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
            LIHAT SEMUA LOG <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MapIcon size={20} className="text-gov-blue" />
            Peta Interaktif Lokasi Masjid & Surau
          </h3>
          <Link 
            to="/admin/surau"
            className="text-xs font-bold text-gov-blue hover:underline flex items-center gap-1"
          >
            PENGURUSAN REKOD <ChevronRight size={14} />
          </Link>
        </div>
        <div className="bg-slate-50 rounded-2xl h-[500px] relative overflow-hidden">
          {loadingMap ? (
            <div className="h-full w-full flex items-center justify-center border border-slate-200 border-dashed rounded-2xl">
              <div className="text-center">
                <Loader2 className="animate-spin text-gov-blue mx-auto mb-4" size={32} />
                <p className="text-slate-400 font-medium">Memuatkan Peta GIS...</p>
              </div>
            </div>
          ) : allLocations.length > 0 ? (
            <GisMap locations={allLocations} />
          ) : (
            <div className="h-full w-full flex items-center justify-center border border-slate-200 border-dashed rounded-2xl">
              <div className="text-center">
                <MapIcon size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Tiada data lokasi untuk dipaparkan.</p>
                <Link to="/admin/surau" className="text-gov-blue text-xs font-bold hover:underline mt-2 inline-block">
                  TAMBAH REKOD BARU
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
