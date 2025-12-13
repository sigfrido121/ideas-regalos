
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateGiftDescription = async (imageBase64: string): Promise<{ title: string, description: string }> => {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found, using fallback");
        return { title: "Regalo Sorpresa", description: "Un regalo misterioso esperando ser abierto." };
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
        },
    };

    const MODES = [
        { name: "gemini-1.5-flash", json: true },
        { name: "gemini-1.5-pro", json: true },
        { name: "gemini-1.5-flash-001", json: true },
        { name: "gemini-1.5-flash-002", json: true },
        { name: "gemini-pro-vision", json: false } // Legacy model, no JSON mode
    ];

    for (const mode of MODES) {
        try {
            console.log(`Attempting AI analysis with model: ${mode.name}`);

            const modelConfig: any = { model: mode.name };
            if (mode.json) {
                modelConfig.generationConfig = { responseMimeType: "application/json" };
            }

            const model = genAI.getGenerativeModel(modelConfig);

            let prompt = "";
            if (mode.json) {
                prompt = `
                Analiza esta imagen y responde con un objeto JSON (sin markdown) con estas claves:
                {
                    "title": "Título corto y divertido (máx 5 palabras)",
                    "description": "Descripción entusiasta y navideña (máx 20 palabras)"
                }
                Ignora precios. Idioma: Español.
                `;
            } else {
                prompt = `
                Analiza esta imagen de regalo. 
                Genera un título corto y una descripción divertida en Español.
                Formato de respuesta: JSON string.
                `;
            }

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            let cleanJson = text;
            if (!mode.json) {
                cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            const data = JSON.parse(cleanJson);
            return {
                title: data.title || "Regalo Navideño",
                description: data.description || "Un detalle especial para estas fiestas."
            };

        } catch (error: any) {
            console.warn(`Model ${mode.name} failed:`, error.message || error);
            // Continue to next model
        }
    }

    // If all fail
    return { title: "Regalo Genial", description: "¡Se ve increíble!" };
};
