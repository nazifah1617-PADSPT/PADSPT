
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommitteeMember, MosqueInfo, Category } from '../types';
import { POSITION_RANK } from '../constants';

const calculateAgeAndGender = (ic: string) => {
  if (!ic || ic.length < 12) return { jantina: '-', umur: '-' };
  
  const last = parseInt(ic.slice(-1));
  const jantina = (last % 2 !== 0) ? 'LELAKI' : 'PEREMPUAN';
  
  const yearPrefix = parseInt(ic.substring(0, 2));
  const currentYear = new Date().getFullYear();
  const birthYear = (yearPrefix > (currentYear % 100)) ? (1900 + yearPrefix) : (2000 + yearPrefix);
  const age = currentYear - birthYear;
  
  return { jantina, umur: `${age}` };
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

const drawHeader = async (doc: jsPDF, title: string, subTitle?: string, isLandscape = false) => {
  const logoUrl = "https://i.postimg.cc/HsVZqzF5/JATAPenang.png";
  const pageWidth = doc.internal.pageSize.getWidth();
  
  try {
    const img = await loadImage(logoUrl);
    doc.addImage(img, 'PNG', (pageWidth / 2) - 12, 10, 24, 24);
  } catch (e) {
    console.error("Logo failed to load");
  }

  doc.setTextColor(30, 58, 138); // Deep Blue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("JABATAN HAL EHWAL AGAMA ISLAM PULAU PINANG", pageWidth / 2, 42, { align: 'center' });
  
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(20, 48, pageWidth - 20, 48);
  doc.setLineWidth(0.2);
  doc.line(20, 49.5, pageWidth - 20, 49.5);

  if (title) {
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageWidth / 2, 60, { align: 'center' });
  }

  if (subTitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(subTitle.toUpperCase(), pageWidth / 2, 66, { align: 'center' });
  }
};

export const generateSinglePdf = async (member: CommitteeMember) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  await drawHeader(doc, `PROFIL MAKLUMAT INDIVIDU`, member.jenis);

  autoTable(doc, {
    startY: 75,
    margin: { left: 20, right: 20 },
    body: [
      [{ content: 'MAKLUMAT PERIBADI', colSpan: 2, styles: { fillColor: [240, 244, 255], fontStyle: 'bold', textColor: [30, 58, 138] } }],
      ['NAMA PENUH', member.nama],
      ['NO. KAD PENGENALAN', member.nokp],
      ['JANTINA', member.jantina],
      ['UMUR', `${member.umur}`],
      ['PEKERJAAN', member.pekerjaan || '-'],
      ['ALAMAT KEDIAMAN', member.alamat || '-'],
      [{ content: 'MAKLUMAT PELANTIKAN', colSpan: 2, styles: { fillColor: [240, 244, 255], fontStyle: 'bold', textColor: [30, 58, 138] } }],
      ['JAWATAN', member.jawatan],
      ['TEMPAT BERTUGAS', member.tempat],
      ['NO. TELEFON', member.notel],
      ['TEMPOH LANTIKAN', `${member.tarikhLantikan || '-'} HINGGA ${member.tarikhTamat || '-'}`],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  const dateStr = new Date().toLocaleString('ms-MY');
  doc.text(`Dicetak secara automatik melalui Portal Maklumat Masjid SPT pada: ${dateStr}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  const pdfUrl = URL.createObjectURL(doc.output('blob'));
  window.open(pdfUrl, '_blank');
};

export const generateListPdf = async (members: CommitteeMember[], filters: any, selectedColumns: string[] = []) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // A4 Landscape: 297mm
  
  const mosqueName = filters.tempat || "SELURUH DAERAH SEBERANG PERAI TENGAH";
  await drawHeader(doc, "SENARAI JAWATANKUASA DAN PEGAWAI", mosqueName, true);

  const sortedMembers = [...members].sort((a, b) => {
    if (a.tempat !== b.tempat) return a.tempat.localeCompare(b.tempat);
    return (POSITION_RANK[a.jawatan] || 99) - (POSITION_RANK[b.jawatan] || 99);
  });

  let sesiText = "SESI: -";
  let parlimenText = filters.parlimen || "-";
  let dunText = filters.dun || "-";

  if (sortedMembers.length > 0) {
    const first = sortedMembers[0];
    if (first.tarikhLantikan) {
      const yearStart = first.tarikhLantikan.split('-')[0];
      const yearEnd = first.tarikhTamat ? first.tarikhTamat.split('-')[0] : (parseInt(yearStart) + 2).toString();
      sesiText = `SESI: ${yearStart} - ${yearEnd}`;
    }
    if (!filters.parlimen) parlimenText = first.parlimen || "-";
    if (!filters.dun) dunText = first.dun || "-";
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(sesiText, pageWidth / 2, 73, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`PARLIMEN: ${parlimenText}  |  DUN: ${dunText}`, pageWidth / 2, 78, { align: 'center' });

  // Definisi kolum yang tersedia
  const colDef: Record<string, { header: string, width: number, getData: (m: CommitteeMember, i: number) => any }> = {
    'bil': { header: 'BIL', width: 12, getData: (_, i) => i + 1 },
    'jawatan': { header: 'JAWATAN', width: 35, getData: (m) => m.jawatan },
    'nama': { header: 'NAMA PENUH', width: 50, getData: (m) => m.nama },
    'nokp': { header: 'NO. KP', width: 25, getData: (m) => m.nokp },
    'notel': { header: 'TEL', width: 25, getData: (m) => m.notel },
    'alamat': { header: 'ALAMAT KEDIAMAN', width: 55, getData: (m) => m.alamat || '-' },
    'pekerjaan': { header: 'PEKERJAAN', width: 30, getData: (m) => m.pekerjaan || '-' },
    'jantina': { header: 'JNTN', width: 25, getData: (m) => calculateAgeAndGender(m.nokp).jantina },
    'umur': { header: 'UMUR', width: 20, getData: (m) => calculateAgeAndGender(m.nokp).umur }
  };

  // Tentukan kolum yang akan dipaparkan (jika tiada yang dipilih, papar semua)
  const activeColKeys = selectedColumns.length > 0 ? selectedColumns : Object.keys(colDef);
  
  // Kira jumlah lebar jadual
  const totalTableWidth = activeColKeys.reduce((sum, key) => sum + colDef[key].width, 0);
  
  // Kira margin kiri supaya jadual berada di tengah
  // Margin minimum adalah 10mm kiri dan kanan
  const marginLeft = totalTableWidth < (pageWidth - 20) 
    ? (pageWidth - totalTableWidth) / 2 
    : 10;

  const headers = [activeColKeys.map(key => colDef[key].header)];
  const body = sortedMembers.map((m, i) => activeColKeys.map(key => colDef[key].getData(m, i)));
  
  const columnStyles: any = {};
  activeColKeys.forEach((key, index) => {
    columnStyles[index] = { 
      cellWidth: colDef[key].width,
      halign: 'center' 
    };
    if (key === 'jawatan' || key === 'nama') columnStyles[index].fontStyle = 'bold';
  });

  autoTable(doc, {
    startY: 83,
    margin: { left: marginLeft, right: marginLeft },
    head: headers,
    body: body,
    theme: 'striped',
    tableWidth: totalTableWidth, // Tetapkan lebar jadual mengikut jumlah lebar kolum
    headStyles: { 
      fillColor: [30, 58, 138], 
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 7.5, 
      cellPadding: 3,
      valign: 'middle',
      halign: 'center', 
      overflow: 'linebreak'
    },
    columnStyles: columnStyles,
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  const dateStr = new Date().toLocaleString('ms-MY');
  doc.text(`Mukasurat ${doc.getNumberOfPages()} | Dicetak pada: ${dateStr} | JHEAINPP`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

  const pdfUrl = URL.createObjectURL(doc.output('blob'));
  window.open(pdfUrl, '_blank');
};
