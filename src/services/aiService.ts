import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processKariahDocument(fileBase64: string, mimeType: string) {
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
