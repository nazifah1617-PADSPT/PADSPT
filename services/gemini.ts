
import { GoogleGenAI, Type } from "@google/genai";
import { CommitteeMember, Category } from "../types";

export const analyzeData = async (data: CommitteeMember[], query: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = data.slice(0, 30).map(m => `${m.nama} (${m.jawatan} di ${m.tempat})`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sistem: Pejabat Agama Daerah Seberang Perai Tengah. Konteks Data:\n${context}\n\nSoalan: ${query}`,
    });
    return response.text || "Maaf, tiada jawapan.";
  } catch (error) {
    return "Ralat teknikal AI.";
  }
};

export const parseImportedData = async (rawText: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ekstrak maklumat ahli jawatankuasa masjid daripada teks berikut ke dalam format JSON bagi Pejabat Agama Daerah Seberang Perai Tengah. 

PENTING: Pastikan anda mengekstrak maklumat ALAMAT KEDIAMAN dan PEKERJAAN jika ada dalam teks tersebut.

Format JSON mestilah array objek dengan property:
- nama (String, huruf besar)
- nokp (String, 12 digit tanpa sempang)
- tempat (String, nama masjid/surau)
- jawatan (String)
- jenis (Pilih: MASJID, SURAU, atau PEGAWAI)
- parlimen (String, ejaan penuh e.g P45 BUKIT MERTAJAM)
- dun (String, ejaan penuh e.g N13 BERAPIT)
- notel (String, format 01xxxxxxx)
- alamat (String, alamat penuh kediaman)
- pekerjaan (String, jawatan hakiki/pekerjaan)

Pastikan output HANYA JSON array yang valid tanpa sebarang teks penjelasan tambahan.
Teks Dokumen:
${rawText}`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Parse Error:", error);
    throw new Error("Gagal memproses data dengan AI.");
  }
};
