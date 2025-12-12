
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Gift from './models/Gift';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/christmas-wishlist';

const migrateLikes = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const gifts = await Gift.find({});
        console.log(`Found ${gifts.length} gifts to check/migrate`);

        for (const gift of gifts) {
            let needsSave = false;

            // Check if likes is an array (old schema)
            if (Array.isArray(gift.likes)) {
                console.log(`Migrating likes for gift ${gift._id}: Array -> Number (${gift.likes.length})`);
                gift.likes = gift.likes.length;
                needsSave = true;
            }

            // Check if dislikes is an array (old schema)
            if (Array.isArray(gift.dislikes)) {
                console.log(`Migrating dislikes for gift ${gift._id}: Array -> Number (${gift.dislikes.length})`);
                gift.dislikes = gift.dislikes.length;
                needsSave = true;
            }

            if (needsSave) {
                // We need to use updateOne because Mongoose Schema validation might fail 
                // if we try to save() and the in-memory object still has the array structure somehow
                // or if strict mode complains. But since we changed the schema in the code,
                // saving should cast it. However, direct update is safer for type changes.
                await Gift.updateOne(
                    { _id: gift._id },
                    {
                        $set: {
                            likes: gift.likes,
                            dislikes: gift.dislikes
                        }
                    }
                );
            }
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateLikes();
