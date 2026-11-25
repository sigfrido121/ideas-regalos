// This service now delegates to the backend for security
// The backend handles the Gemini API call with the secure API key

export const analyzeGiftImage = async (base64Image: string, hint?: string): Promise<{ title: string; description: string }> => {
  try {
    // Call the backend endpoint instead of calling Gemini directly from the frontend
    const response = await fetch('/api/gifts/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageData: base64Image, hint })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    return {
      title: data.title || "Regalo Genial",
      description: data.description || "¡Se ve increíble!"
    };

  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      title: "Nuevo Regalo",
      description: "¡Agregado a la lista de deseos!"
    };
  }
};
