import React from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  onConfirm: () => void;
  title: string;
  groupType: 'masjid' | 'parlimen' | 'dun';
  metadata?: any[];
  typeLabel?: string;
}

const ROLE_PRIORITY: { [key: string]: number } = {
  'pengerusi': 1,
  'tim. pengerusi': 2,
  'timb. pengerusi': 2,
  'tim pengerusi': 2,
  'timb pengerusi': 2,
  'timbalan pengerusi': 2,
  'naib pengerusi': 2,
  'setiausaha': 3,
  'bendahari': 4,
  'ajk': 5,
  'ajk wanita': 6,
  'pemeriksa kira-kira': 7,
  'pemeriksa kira kira': 7,
  'pemeriksa kira': 7
};

const getPriority = (jawatan: string) => {
  if (!jawatan) return 99;
  const normalized = jawatan.toLowerCase().trim();
  return ROLE_PRIORITY[normalized] || 99;
};

export const PrintPreviewModal = ({ isOpen, onClose, data, onConfirm, title, groupType, metadata, typeLabel = 'KARIAH' }: PrintPreviewModalProps) => {
  if (!isOpen) return null;

  const getMetadata = (name: string) => {
    if (!metadata) return null;
    return metadata.find((m: any) => m.nama?.toUpperCase() === name.toUpperCase());
  };

  const groupedData = () => {
    const groups: { [key: string]: any[] } = {};
    data.forEach(item => {
      let key = '';
      if (groupType === 'masjid') key = item.masjidName || 'TIADA NAMA MASJID/SURAU';
      else if (groupType === 'parlimen') key = item.parlimen || 'TIADA PARLIMEN';
      else if (groupType === 'dun') key = item.dun || 'TIADA DUN';
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // Sort individuals within groups by priority
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (groupType !== 'masjid') {
          const masjidA = a.masjidName || '';
          const masjidB = b.masjidName || '';
          if (masjidA !== masjidB) return masjidA.localeCompare(masjidB);
        }
        const pA = getPriority(a.jawatan);
        const pB = getPriority(b.jawatan);
        if (pA !== pB) return pA - pB;
        return (a.namaPenuh || '').localeCompare(b.namaPenuh || '');
      });
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Pratonton Cetak Laporan</h2>
              <p className="text-xs text-slate-400 font-medium">Sila semak maklumat sebelum menjana PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
              <h1 className="text-2xl font-black text-slate-900 uppercase">
                {groupType === 'masjid' ? `SENARAI JAWATANKUASA ${typeLabel}` : title}
              </h1>
              <p className="text-sm font-bold text-slate-500 uppercase">Tarikh Laporan: {new Date().toLocaleDateString('ms-MY')}</p>
            </div>

            {groupedData().map(([group, members]) => {
              const meta = getMetadata(group);
              return (
                <div key={group} className="space-y-4">
                  <div className="bg-gov-blue/10 p-6 rounded-xl border border-gov-blue/10 text-center">
                    <h3 className="text-xl font-black text-gov-blue uppercase">
                      {groupType === 'masjid' ? `SENARAI JAWATANKUASA ${typeLabel}` : `LAPORAN MENGIKUT ${groupType.toUpperCase()}`}
                    </h3>
                    <h4 className="text-lg font-black text-gov-blue uppercase mt-1">
                      {group.toUpperCase()}
                    </h4>
                    <div className="flex flex-col items-center mt-4 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        PARLIMEN: {members[0].parlimen?.toUpperCase() || '-'} | DUN: {members[0].dun?.toUpperCase() || '-'}
                      </p>
                      {meta && (
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                          {meta.kod && `NO. PENDAFTARAN: ${meta.kod}`}
                          {meta.kod && (meta.noFail || meta.noFailSurau) && ' | '}
                          {(meta.noFail || meta.noFailSurau) && `NO. FAIL: ${meta.noFail || meta.noFailSurau}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase w-12 text-center">Bil</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase">Nama Penuh</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase">Jawatan</th>
                        {(typeLabel === 'KARIAH' || typeLabel === 'SURAU') && (
                          <th className="px-4 py-3 text-[10px] font-bold uppercase">Nama {typeLabel === 'SURAU' ? 'Surau' : 'Masjid'}</th>
                        )}
                        <th className="px-4 py-3 text-[10px] font-bold uppercase">No. Telefon</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        let currentMasjid = '';
                        return members.map((m, idx) => {
                          const mName = m.masjidName || '-';
                          const isNewMasjid = groupType !== 'masjid' && mName !== currentMasjid;
                          if (isNewMasjid) {
                            currentMasjid = mName;
                          }

                          return (
                            <React.Fragment key={m.id}>
                              {isNewMasjid && (
                                <tr className="bg-slate-100/80">
                                  <td colSpan={6} className="px-4 py-2 text-xs font-bold text-slate-800 uppercase border-y border-slate-200">
                                    {mName}
                                  </td>
                                </tr>
                              )}
                              <tr className="hover:bg-slate-50 transition-colors bg-white">
                                <td className="px-4 py-3 text-xs font-bold text-slate-500 text-center">{idx + 1}</td>
                                <td className="px-4 py-3 text-xs font-black text-slate-900 uppercase">{m.namaPenuh}</td>
                                <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">{m.jawatan}</td>
                                {(typeLabel === 'KARIAH' || typeLabel === 'SURAU') && (
                                  <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">{m.masjidName || '-'}</td>
                                )}
                                <td className="px-4 py-3 text-xs font-mono text-slate-500">{m.noTel || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    m.statusLantikan === 'AKTIF' || m.statusLantikan === 'Aktif' 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {m.statusLantikan}
                                  </span>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onClose}
            className="px-8 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider"
          >
            Batal
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-gov-blue text-white px-10 py-3 rounded-xl font-black flex items-center gap-3 shadow-xl shadow-gov-blue/20 hover:bg-gov-blue/90 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
          >
            <Printer size={20} />
            Sahkan & Jana PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
};
