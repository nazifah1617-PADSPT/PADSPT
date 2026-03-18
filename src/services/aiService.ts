import { GoogleGenAI, Type } from "@google/genai";

const getAi = () => {
  // 1. Cuba dapatkan kunci daripada pelbagai sumber
  const apiKey = process.env.GEMINI_API_KEY;
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const windowKey = (window as any).process?.env?.GEMINI_API_KEY || (window as any).VITE_GEMINI_API_KEY;

  // 2. Tentukan kunci mana yang hendak digunakan
  const allKeys = [apiKey, viteKey, windowKey];
  const userKey = allKeys.find(k => k && k.startsWith('AIza'));
  
  if (userKey) {
    return new GoogleGenAI({ apiKey: userKey });
  }

  // 3. Jika tiada kunci pengguna, cuba gunakan kunci lalai platform
  const platformKey = allKeys.find(k => k && k !== "" && k !== "undefined");
  if (platformKey) {
    return new GoogleGenAI({ apiKey: platformKey });
  }

  throw new Error("Kunci API tidak dikesan. Sila pastikan anda telah menambah VITE_GEMINI_API_KEY dalam Secrets dan klik 'Apply changes'. Kemudian muat semula (refresh) halaman ini.");
};

export async function processKariahDocument(fileBase64: string, mimeType: string) {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Extract all Jawatankuasa Kariah members from this document. For each member, extract: namaPenuh, noKP, noTel, alamat, pekerjaan, umur, jawatan. Also extract masjidName, parlimen, and dun if mentioned. Return as a JSON array of objects. Validate IC format (12 digits). If IC is invalid or missing, flag it. Suggest corrections for missing fields if possible.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          masjidInfo: {
            type: Type.OBJECT,
            properties: {
              masjidName: { type: Type.STRING },
              parlimen: { type: Type.STRING },
              dun: { type: Type.STRING },
              daerah: { type: Type.STRING }
            }
          },
          members: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                namaPenuh: { type: Type.STRING },
                noKP: { type: Type.STRING },
                noTel: { type: Type.STRING },
                alamat: { type: Type.STRING },
                pekerjaan: { type: Type.STRING },
                umur: { type: Type.INTEGER },
                jawatan: { type: Type.STRING },
                statusLantikan: { type: Type.STRING },
                validationErrors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
