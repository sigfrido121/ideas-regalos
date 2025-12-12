
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gift from './models/Gift';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/christmas-wishlist';

const resetLikes = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Force update all gifts to have numeric likes/dislikes starting at 0
        const result = await Gift.updateMany(
            {},
            { $set: { likes: 0, dislikes: 0 } }
        );

        console.log(`Reset likes/dislikes for ${result.modifiedCount} gifts.`);
        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
};

resetLikes();
