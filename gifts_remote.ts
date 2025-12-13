import express from 'express';
import Gift from '../models/Gift';
import { generateGiftDescription } from '../services/ai';
import { randomUUID } from 'crypto';

const router = express.Router();

// GET all gifts or filter by userId
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        let query = {};
        if (userId) {
            query = { userId: userId as string };
        }
        const gifts = await Gift.find(query).sort({ createdAt: -1 });
        res.json(gifts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching gifts', error });
    }
});

// POST new gift
router.post('/', async (req, res) => {
    try {
        const newGift = new Gift(req.body);
        const savedGift = await newGift.save();
        res.status(201).json(savedGift);
    } catch (error) {
        res.status(400).json({ message: 'Error creating gift', error });
    }
});

// DELETE gift
router.delete('/:id', async (req, res) => {
    try {
        const deletedGift = await Gift.findByIdAndDelete(req.params.id);
        if (!deletedGift) {
            return res.status(404).json({ message: 'Gift not found' });
        }
        res.json({ message: 'Gift deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting gift', error });
    }
});

// UPDATE gift (optional, basic implementation)
router.patch('/:id', async (req, res) => {
    try {
        const updatedGift = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedGift) {
            return res.status(404).json({ message: 'Gift not found' });
        }
        res.json(updatedGift);
    } catch (error) {
        res.status(400).json({ message: 'Error updating gift', error });
    }
});

// ADD Comment
router.post('/:id/comments', async (req, res) => {
    try {
        const { userId, text } = req.body;
        const newComment = {
            id: randomUUID(), // Unique ID generation using UUID
            userId,
            text,
            createdAt: Date.now()
        };

        const gift = await Gift.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: newComment } },
            { new: true }
        );

        if (!gift) {
            return res.status(404).json({ message: 'Gift not found' });
        }

        res.status(201).json(newComment);
    } catch (error) {
        res.status(400).json({ message: 'Error adding comment', error });
    }
});

// ANALYZE IMAGE with AI
router.post('/analyze-image', async (req, res) => {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ message: 'Image data is required' });
        }
        const result = await generateGiftDescription(imageData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error analyzing image', error });
    }
});

// INTERACT (Like/Dislike)
router.post('/:id/interact', async (req, res) => {
    try {
        const { action } = req.body; // action: 'like' | 'dislike'
        if (!['like', 'dislike'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const update = action === 'like'
            ? { $inc: { likes: 1 } }
            : { $inc: { dislikes: 1 } };

        const gift = await Gift.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!gift) {
            return res.status(404).json({ message: 'Gift not found' });
        }

        res.json(gift);
    } catch (error) {
        res.status(400).json({ message: 'Error updating interaction', error });
    }
});

export default router;
