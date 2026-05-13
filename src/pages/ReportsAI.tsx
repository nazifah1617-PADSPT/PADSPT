import React, { useState } from 'react';
import { FileBarChart, Download, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const getAi = () => {
  // 1. Cuba dapatkan kunci daripada pelbagai sumber (Vite standard & Fallbacks)
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const windowKey = (window as any).process?.env?.GEMINI_API_KEY || (window as any).VITE_GEMINI_API_KEY;

  const finalKey = apiKey || windowKey;

  if (finalKey && finalKey !== "AI Studio Free Tier" && finalKey !== "" && finalKey !== "undefined") {
    return new GoogleGenAI({ apiKey: finalKey });
  }

  // Mesej ralat mengikut persekitaran
  const isVercel = window.location.hostname.includes('vercel.app');
  if (isVercel) {
    throw new Error("Kunci API tidak dikesan di Vercel. Sila tambah VITE_GEMINI_API_KEY di Vercel Project Settings > Environment Variables dan lakukan 'Redeploy'.");
  }

  throw new Error("Kunci API tidak dikesan. Sila pastikan anda telah menambah VITE_GEMINI_API_KEY dalam tetapan Secrets dan klik 'Apply changes'.");
};

export default function ReportsAI() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('jk_aktif');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [currentReportData, setCurrentReportData] = useState<any>(null);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const ai = getAi();
      
      // Fetch real data
      const jkSnapshot = await getDocs(collection(db, 'jk_records'));
      const jkSurauSnapshot = await getDocs(collection(db, 'jk_surau_records'));
      const pegawaiSnapshot = await getDocs(collection(db, 'pegawai_records'));
      const masjidSnapshot = await getDocs(collection(db, 'masjid_records'));
      const surauSnapshot = await getDocs(collection(db, 'surau_records'));

      const allJkDocs = [
        ...jkSnapshot.docs.map(d => ({ ...d.data(), id: d.id, type: 'jk_masjid' })),
        ...jkSurauSnapshot.docs.map(d => ({ ...d.data(), id: d.id, type: 'jk_surau' })),
      ];

      const activeJkCount = allJkDocs.filter((d: any) => d.statusLantikan === 'AKTIF' || d.statusLantikan === 'Aktif').length;
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expiringSoonCount = allJkDocs.filter((d: any) => {
        if (!d.tarikhTamatSesi) return false;
        const expiry = new Date(d.tarikhTamatSesi);
        return expiry > now && expiry <= thirtyDaysFromNow;
      }).length;

      const districtsData: {[key: string]: number} = {};
      allJkDocs.forEach((d: any) => {
        if (d.daerah) {
          districtsData[d.daerah] = (districtsData[d.daerah] || 0) + 1;
        }
      });
      
      const districtsArray = Object.keys(districtsData).map(d => ({ name: d, count: districtsData[d] })).sort((a, b) => b.count - a.count);

      const reportData = {
        jumlah_jk: allJkDocs.length,
        jumlah_jk_aktif: activeJkCount,
        jumlah_pegawai_masjid: pegawaiSnapshot.size,
        jumlah_masjid: masjidSnapshot.size,
        jumlah_surau: surauSnapshot.size,
        jk_tamat_sesi_hampir: expiringSoonCount,
        pecahan_daerah_jk: districtsArray,
      };

      setCurrentReportData(reportData);

      const prompt = `Sebagai sistem AI rasmi Jabatan Hal Ehwal Agama Islam Pulau Pinang, berikan analisis ringkas dan profesional (dalam Bahasa Melayu formal) untuk laporan berikut: ${reportType}.
      
Anda MESTI HANYA menggunakan maklumat data di bawah untuk menjana laporan ini. DILARANG SAMA SEKALI menggunakan sebarang maklumat luaran, membuat andaian, atau mencipta data palsu. Jika data tidak mencukupi, nyatakan dengan jelas.

Data ringkasan sistem e-Kariah: ${JSON.stringify(reportData, null, 2)}. 

Berdasarkan data ini SAHAJA, berikan huraian, dan 3 cadangan penambahbaikan untuk pengurusan kariah yang relevan dengan data.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiAnalysis(response.text || 'Gagal menjana analisis.');
    } catch (error: any) {
      console.error("AI Error:", error);
      setAiAnalysis(`Maaf, ralat berlaku: ${error.message || "Gagal menjana analisis AI."}`);
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    const logoUrl = 'https://i.postimg.cc/T3NqjCYM/logo-penangpng.png';
    
    // Header
    doc.addImage(logoUrl, 'PNG', 10, 10, 20, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JABATAN HAL EHWAL AGAMA ISLAM PULAU PINANG', 35, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistem e-Kariah Pulau Pinang - Laporan Rasmi Kerajaan', 35, 24);
    doc.line(10, 35, 200, 35);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`LAPORAN: ${reportType.toUpperCase().replace('_', ' ')}`, 10, 45);
    
    // Content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(aiAnalysis, 180);
    doc.text(splitText, 10, 55);

    // Table (Only if data exists and type is daerah or overall stats)
    let finalY = 120 + (splitText.length * 6);
    if (finalY < 120) finalY = 120;
    
    if (currentReportData && currentReportData.pecahan_daerah_jk && reportType === 'daerah') {
      const tableBody = currentReportData.pecahan_daerah_jk.map((d: any) => [d.name, d.count.toString()]);
      autoTable(doc, {
        startY: finalY,
        head: [['Daerah', 'Jumlah JK']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: '#003366' }
      });
    }

    // Footer
    const date = new Date().toLocaleString('ms-MY');
    doc.setFontSize(8);
    doc.text(`Dijana secara automatik oleh AI e-Kariah pada: ${date}`, 10, 285);
    doc.text(`No. Rujukan: EK/RP/${Math.floor(Math.random() * 100000)}`, 150, 285);

    doc.save(`Laporan_eKariah_${reportType}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Laporan AI Automatik</h1>
        <p className="text-slate-500">Jana laporan rasmi kerajaan dengan analisis pintar AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold mb-4">Jenis Laporan</h3>
            <div className="space-y-2">
              {[
                { id: 'jk_aktif', label: 'JK Kariah Aktif' },
                { id: 'kekosongan', label: 'Kekosongan Jawatan' },
                { id: 'tamat_tempoh', label: 'Tamat Tempoh Lantikan' },
                { id: 'daerah', label: 'Analisis Daerah' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    reportType === type.id ? "bg-gov-blue text-white shadow-md" : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full mt-6 py-4 bg-gov-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gov-blue/90 transition-all shadow-lg shadow-gov-blue/20 disabled:opacity-50"
            >
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              JANA LAPORAN AI
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          {aiAnalysis ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  </div>
                  <h3 className="font-bold text-lg">Analisis AI Sedia</h3>
                </div>
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 text-gov-blue font-bold text-sm hover:underline"
                >
                  <Download size={18} /> EKSPORT PDF
                </button>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {aiAnalysis}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Standard Tender Kerajaan v2.0</span>
                <span>Jabatan Hal Ehwal Agama Islam Pulau Pinang</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-96 flex flex-col items-center justify-center text-slate-400">
              <FileBarChart size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Sila pilih jenis laporan dan klik "Jana Laporan AI"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
