
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gift from './models/Gift';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/christmas-wishlist';

const MAPPING: Record<string, string> = {
    'u1': '693aef5eb5de3327099c6176', // Alex
    'u2': '693aef5eb5de3327099c6177', // Paola
    'u3': '693aef5eb5de3327099c6178', // Yerko
    'u4': '693aef5eb5de3327099c6179', // Vero
    'u5': '693aef5eb5de3327099c617a', // Raúl
    'u6': '693aef5eb5de3327099c617b', // Andrea
    'u7': '693aef5eb5de3327099c617c', // Angelica
};

const migrate = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const [oldId, newId] of Object.entries(MAPPING)) {
            const result = await Gift.updateMany(
                { userId: oldId },
                { $set: { userId: newId } }
            );
            console.log(`Migrated ${result.modifiedCount} gifts from ${oldId} to ${newId}`);
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
