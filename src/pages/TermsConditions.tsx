import React from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gov-gradient text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText size={32} className="text-gov-gold" />
            <h1 className="text-3xl font-bold">Terma & Syarat</h1>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold hover:text-gov-gold transition-colors">
            <ArrowLeft size={20} /> KEMBALI
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-8 text-slate-700 leading-relaxed"
        >
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">1. Penerimaan Terma</h2>
            <p>
              Dengan mengakses dan menggunakan portal Sistem e-Kariah ("Sistem"), anda bersetuju untuk terikat 
              dengan Terma dan Syarat ini. Jika anda tidak bersetuju dengan mana-mana bahagian terma ini, 
              anda tidak dibenarkan menggunakan portal ini.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">2. Penggunaan Portal</h2>
            <p className="mb-4">Portal ini disediakan bertujuan untuk memudahkan semakan awam terhadap pelantikan ahli jawatankuasa kariah, surau, dan pegawai masjid di Daerah Seberang Perai Tengah. Pengguna dilarang:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Menggunakan maklumat dalam portal ini untuk tujuan komersial atau pemasaran tanpa kebenaran bertulis.</li>
              <li>Melakukan sebarang tindakan yang boleh menjejaskan prestasi atau keselamatan sistem.</li>
              <li>Menyalahgunakan maklumat peribadi yang dipaparkan untuk tujuan yang tidak sah atau mengganggu privasi individu.</li>
              <li>Menyebarkan maklumat palsu atau mengelirukan berdasarkan data dari portal ini.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">3. Ketepatan Maklumat</h2>
            <p>
              Walaupun kami berusaha memastikan maklumat yang dipaparkan adalah tepat dan terkini, 
              Jabatan Hal Ehwal Agama Islam Pulau Pinang (JHEAIPP) tidak menjamin ketepatan mutlak data tersebut. 
              Sebarang percanggahan maklumat hendaklah dirujuk terus kepada Pejabat Agama Islam Daerah Seberang Perai Tengah.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">4. Hak Harta Intelek</h2>
            <p>
              Semua kandungan dalam portal ini, termasuk teks, grafik, logo, dan perisian, adalah hak milik 
              Kerajaan Negeri Pulau Pinang atau pemberi lesennya dan dilindungi oleh undang-undang hak cipta Malaysia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">5. Had Liabiliti</h2>
            <p>
              JHEAIPP tidak akan bertanggungjawab ke atas sebarang kerugian atau kerosakan (termasuk kerugian tidak langsung) 
              yang timbul daripada penggunaan portal ini atau pergantungan kepada maklumat yang terkandung di dalamnya.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">6. Penamatan Akses</h2>
            <p>
              Kami berhak untuk menamatkan atau menyekat akses anda ke portal ini pada bila-bila masa tanpa notis 
              jika anda melanggar mana-mana Terma dan Syarat yang ditetapkan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">7. Undang-undang Berkuatkuasa</h2>
            <p>
              Terma dan Syarat ini dikawal oleh dan ditafsirkan mengikut undang-undang Malaysia. 
              Sebarang pertikaian yang timbul akan tertakluk kepada bidang kuasa eksklusif mahkamah di Malaysia.
            </p>
          </section>

          <div className="pt-8 border-t text-sm text-slate-500 italic">
            Dikemaskini pada: 28 Mac 2026
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center">
        <p className="text-sm text-slate-500">
          Hakcipta Terpelihara © 2026 Jabatan Hal Ehwal Agama Islam Pulau Pinang
        </p>
      </footer>
    </div>
  );
}
