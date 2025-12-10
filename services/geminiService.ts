import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing. Ensure process.env.API_KEY is set.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeGiftImage = async (base64Image: string): Promise<{ title: string; description: string }> => {
  const ai = getAiClient();
  if (!ai) {
    return { title: "Regalo Sorpresa", description: "Descripción no disponible (Falta API Key)" };
  }

  try {
    // Strip the data:image/jpeg;base64, prefix if present for the API call
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analiza esta imagen de un posible regalo de navidad. 
            Responde ÚNICAMENTE con un objeto JSON (sin markdown) con dos propiedades:
            1. "title": Un título corto y divertido (max 5 palabras).
            2. "description": Una descripción entusiasta de por qué es un buen regalo (max 20 palabras).
            Idioma: Español.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return {
      title: json.title || "Regalo Genial",
      description: json.description || "¡Se ve increíble!"
    };

  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      title: "Nuevo Regalo",
      description: "¡Agregado a la lista de deseos!"
    };
  }
};