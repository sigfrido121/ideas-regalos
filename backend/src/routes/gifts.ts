import express from 'express';
import Gift from '../models/Gift';

const router = express.Router();

// GET all gifts
router.get('/', async (req, res) => {
    try {
        const gifts = await Gift.find().sort({ createdAt: -1 });
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
})

export default router;
