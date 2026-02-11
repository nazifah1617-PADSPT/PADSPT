
import React, { useState } from 'react';
import { analyzeData } from '../services/gemini';
import { CommitteeMember } from '../types';

interface Props {
  members: CommitteeMember[];
}

const AiAssistant: React.FC<Props> = ({ members }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsThinking(true);
    const result = await analyzeData(members, query);
    setResponse(result);
    setIsThinking(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="bg-white w-80 md:w-96 max-h-[500px] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black uppercase tracking-widest">SPT AI Assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50 min-h-[150px]">
            {!response && !isThinking && (
              <p className="text-slate-400 italic text-center py-8">Bagaimana saya boleh membantu anda menganalisis data masjid hari ini?</p>
            )}
            
            {response && (
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                <p className="leading-relaxed">{response}</p>
              </div>
            )}

            {isThinking && (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest ml-2">Menganalisis...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="p-3 border-t border-slate-100 bg-white">
            <div className="relative">
              <input 
                type="text"
                placeholder="Tanya tentang statistik data..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-slate-100 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button 
                type="submit"
                disabled={isThinking}
                className="absolute right-2 top-1.5 p-1 text-blue-600 disabled:opacity-30"
              >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white shadow-blue-200'}`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
};

export default AiAssistant;
