import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Define Gift schema inline to avoid import issues
const giftSchema = new mongoose.Schema({
    userId: String,
    title: String,
    description: String,
    imageData: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    comments: [{
        userId: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Gift = mongoose.model('Gift', giftSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function fixGifts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB');

        // Find gifts with error titles
        const gifts = await Gift.find({
            $or: [
                { title: "Error Conexión IA" },
                { title: "Error Parseo IA" },
                { title: "Regalo Sorpresa" },
                { title: "Regalo misterioso" }
            ]
        });

        console.log(`Found ${gifts.length} gifts to fix`);

        for (const gift of gifts) {
            console.log(`\nProcessing gift ${gift._id}...`);

            if (!gift.imageData) {
                console.log('  No image data, skipping');
                continue;
            }

            try {
                // Call Gemini
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

                const base64Data = gift.imageData.replace(/^data:image\/\w+;base64,/, "");

                const prompt = `
                    Analiza esta imagen de un regalo navideño y actúa como un asistente navideño divertido y entusiasta.
                    Tu tarea es generar un Título corto y una Descripción atractiva.
                    
                    REGLAS CRÍTICAS:
                    1. PRECIOS: Si ves algún precio o etiqueta de precio en la imagen, IGNÓRALO ABSOLUTAMENTE en el texto. NO menciones números de dinero.
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

                console.log('  Raw response:', text.substring(0, 200));

                // Clean markdown code blocks if present
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

                const data = JSON.parse(cleanJson);

                // Update gift
                gift.title = data.title || "Regalo Navideño";
                gift.description = data.description || "Un detalle especial para estas fiestas.";
                await gift.save();

                console.log(`  ✓ Updated: ${gift.title}`);

            } catch (error) {
                console.error(`  ✗ Error processing gift:`, error);
            }
        }

        console.log('\n✅ Done!');
        await mongoose.disconnect();

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

fixGifts();
