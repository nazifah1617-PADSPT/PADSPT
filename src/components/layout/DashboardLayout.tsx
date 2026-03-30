import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, ShieldCheck, LogOut, Search, Menu, X, Building2, UserCheck, FileBarChart, Settings, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, show: true },
    { name: 'JK Kariah', path: '/admin/jk', icon: Users, show: isAdmin },
    { name: 'JK Surau', path: '/admin/jk-surau', icon: UserCheck, show: isAdmin },
    { name: 'Masjid', path: '/admin/masjid', icon: Building2, show: isAdmin },
    { name: 'Surau', path: '/admin/surau', icon: Building2, show: isAdmin },
    { name: 'Pegawai Masjid', path: '/admin/pegawai', icon: UserCheck, show: isAdmin },
    { name: 'Pembaikan', path: '/admin/pembaikan', icon: Wrench, show: isAdmin },
    { name: 'Upload Data', path: '/admin/upload', icon: Upload, show: isAdmin },
    { name: 'Laporan AI', path: '/admin/reports', icon: FileBarChart, show: isAdmin },
    { name: 'Audit Log', path: '/admin/audit', icon: ShieldCheck, show: isAdmin },
    { name: 'Pengurusan Admin', path: '/admin/users', icon: Settings, show: isSuperAdmin },
    { name: 'Carian Awam', path: '/', icon: Search, show: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="gov-gradient text-white h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-sm">
            <img src="https://i.postimg.cc/T3NqjCYM/logo-penangpng.png" alt="Jata Pulau Pinang" className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">e-KARIAH</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">Sistem Pengurusan Jawatankuasa Kariah</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold">{profile?.name || 'Pengguna'}</p>
            <p className="text-[10px] opacity-70">{profile?.role || 'AWAM'}</p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Log Keluar"
          >
            <LogOut size={20} />
          </button>
        </div>

        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col py-6">
          <nav className="flex-1 px-4 space-y-1">
            {navItems.filter(i => i.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  location.pathname === item.path 
                    ? "bg-gov-blue text-white shadow-md" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="px-6 py-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status Sistem</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs font-medium text-slate-600">Stabil & Selamat</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col"
          >
            <div className="gov-gradient p-4 flex justify-between items-center text-white">
              <span className="font-bold">MENU e-KARIAH</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
            </div>
            <div className="flex-1 p-4 space-y-2">
              {navItems.filter(i => i.show).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl text-lg font-semibold",
                    location.pathname === item.path ? "bg-gov-blue text-white" : "bg-slate-50"
                  )}
                >
                  <item.icon size={24} />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t">
              <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                <LogOut /> Log Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
