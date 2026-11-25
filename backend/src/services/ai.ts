
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// La clave vive solo en el servidor
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Modelos con visión, en orden de preferencia (los 1.5 ya no existen)
const MODELS = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
];

const PROMPT = `
Analiza la imagen de este regalo y responde SOLO con un objeto JSON válido (sin markdown, sin texto extra):
{
  "title": "Título corto y divertido (máx 5 palabras)",
  "description": "Descripción entusiasta y navideña (máx 20 palabras)"
}
Ignora precios, marcas de agua y texto promocional. Idioma: español.
`;

const buildPrompt = (hint?: string): string => {
    const clean = (hint || '').trim().slice(0, 300);
    if (!clean) return PROMPT;
    return `${PROMPT}
Dato extra que aporta la persona que sube la foto (usalo para precisar el título y la descripción; no lo contradigas ni lo repitas literal): "${clean}"`;
};

const detectMime = (b64: string): string => {
    if (b64.startsWith('/9j/')) return 'image/jpeg';
    if (b64.startsWith('iVBOR')) return 'image/png';
    if (b64.startsWith('R0lGOD')) return 'image/gif';
    if (b64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
};

export const generateGiftDescription = async (imageBase64: string, hint?: string): Promise<{ title: string, description: string, ai: boolean }> => {
    const fallback = { title: 'Regalo Sorpresa', description: 'Un regalo misterioso esperando ser abierto.', ai: false };

    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY no configurada: usando fallback');
        return fallback;
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imagePart = { inlineData: { data: base64Data, mimeType: detectMime(base64Data) } };

    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
            });
            const result = await model.generateContent([buildPrompt(hint), imagePart]);
            const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(text);
            if (!data.title) throw new Error('respuesta sin título');
            console.log(`IA OK con ${modelName}: ${data.title}`);
            return {
                title: String(data.title).slice(0, 60),
                description: String(data.description || 'Un detalle especial para estas fiestas.').slice(0, 160),
                ai: true,
            };
        } catch (error: any) {
            console.warn(`Modelo ${modelName} falló:`, error?.message || error);
        }
    }

    return { ...fallback, title: 'Regalo Genial' };
};
