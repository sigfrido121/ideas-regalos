
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateGiftDescription = async (imageBase64: string): Promise<{ title: string, description: string }> => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not found, using fallback");
            return { title: "Regalo Sorpresa", description: "Un regalo misterioso esperando ser abierto." };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Clean base64 string if needed (remove data:image/jpeg;base64, prefix)
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `
      Analiza esta imagen de un regalo navideño y actúa como un asistente navideño divertido y entusiasta.
      Tu tarea es generar un Título corto y una Descripción atractiva.
      
      REGLAS CRÍTICAS:
      1. PRECIOS: Si ves algún precio o etiqueta de precio en la imagen, IGNÓRALO ABSOLUTAMENTE en el texto. NO menciones números de dinero. Si es muy evidente, haz una broma tipo "Valor: Incalculable (o al menos eso dice la etiqueta borrosa)".
      2. ESTILO: Sé divertido, usa emojis navideños, sé breve pero descriptivo.
      3. IDIOMA: Español.

      DAME LA RESPUESTA EN FORMATO JSON EXACTO:
      {
        "title": "Título corto aquí",
        "description": "Descripción divertida aquí"
      }
    `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanJson);
            return {
                title: data.title || "Regalo Navideño",
                description: data.description || "Un detalle especial para estas fiestas."
            };
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", text);
            return { title: "Error Parseo IA", description: text.slice(0, 100) };
        }

    } catch (error) {
        console.error("Error asking Gemini (CRITICAL):", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
        return { title: "Error Conexión IA", description: "No se pudo conectar con el cerebro mágico." };
    }
};
