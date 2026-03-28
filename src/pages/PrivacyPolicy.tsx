import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="gov-gradient text-white py-12 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield size={32} className="text-gov-gold" />
            <h1 className="text-3xl font-bold">Dasar Privasi</h1>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">1. Pendahuluan</h2>
            <p>
              Sistem e-Kariah ("Sistem") komited untuk melindungi dan menghormati privasi anda selaras dengan 
              <strong> Akta Perlindungan Data Peribadi 2010 (Akta 709)</strong> Malaysia. Dasar Privasi ini menjelaskan 
              bagaimana kami mengumpul, menggunakan, dan melindungi maklumat peribadi anda apabila anda menggunakan portal ini.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">2. Maklumat Yang Kami Kumpul</h2>
            <p className="mb-4">Kami mengumpul maklumat peribadi yang diperlukan untuk tujuan pengurusan kariah, termasuk tetapi tidak terhad kepada:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nama Penuh</li>
              <li>Nombor Kad Pengenalan (IC)</li>
              <li>Alamat Kediaman</li>
              <li>Nombor Telefon</li>
              <li>Maklumat Jawatan dalam Kariah/Masjid/Surau</li>
              <li>Alamat Emel (untuk pentadbir sistem)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">3. Tujuan Pemprosesan Data</h2>
            <p className="mb-4">Data peribadi anda diproses bagi tujuan berikut:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Membolehkan semakan awam terhadap jawatankuasa kariah yang sah.</li>
              <li>Tujuan pentadbiran dan pengurusan rekod oleh Jabatan Hal Ehwal Agama Islam Pulau Pinang (JHEAIPP).</li>
              <li>Memastikan ketelusan dalam pelantikan ahli jawatankuasa.</li>
              <li>Menghubungi ahli jawatankuasa bagi urusan rasmi jabatan.</li>
              <li>Memenuhi keperluan undang-undang dan peraturan yang berkaitan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">4. Pendedahan Data Peribadi</h2>
            <p>
              Maklumat peribadi anda tidak akan didedahkan kepada mana-mana pihak ketiga tanpa kebenaran anda, 
              kecuali jika dikehendaki oleh undang-undang atau untuk tujuan rasmi kerajaan yang berkaitan dengan 
              fungsi JHEAIPP. Di portal awam, maklumat sensitif seperti Nombor Kad Pengenalan akan dipaparkan secara terlindung (masked).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">5. Keselamatan Data</h2>
            <p>
              Kami melaksanakan langkah-langkah keselamatan teknikal dan organisasi yang sewajarnya untuk melindungi 
              data peribadi anda daripada akses yang tidak dibenarkan, kehilangan, atau penyalahgunaan. Ini termasuk 
              penggunaan enkripsi data dan kawalan akses yang ketat.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">6. Hak Anda</h2>
            <p>
              Di bawah Akta 709, anda mempunyai hak untuk mengakses dan meminta pembetulan data peribadi anda yang 
              disimpan oleh kami. Sebarang permohonan atau pertanyaan mengenai data peribadi boleh dikemukakan kepada 
              Pejabat Agama Islam Daerah Seberang Perai Tengah.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b pb-2">7. Pindaan Dasar</h2>
            <p>
              Kami berhak untuk meminda Dasar Privasi ini dari semasa ke semasa bagi mematuhi perubahan dalam 
              perundangan atau penambahbaikan sistem. Sebarang perubahan akan dikemaskini di halaman ini.
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
