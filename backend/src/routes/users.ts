import express from 'express';
import User from '../models/User';

const router = express.Router();

const INITIAL_USERS = [
    { name: 'Alex', avatar: '🎅', color: 'bg-red-600' },
    { name: 'Paola', avatar: '🤶', color: 'bg-red-500' },
    { name: 'Yerko', avatar: '⛄', color: 'bg-green-600' },
    { name: 'Vero', avatar: '🦌', color: 'bg-green-500' },
    { name: 'Raúl', avatar: '🍪', color: 'bg-amber-600' },
    { name: 'Andrea', avatar: '🧣', color: 'bg-amber-500' },
    { name: 'Angelica', avatar: '🍪', color: 'bg-amber-600' },
    { name: 'Elvirita', avatar: '👵', color: 'bg-purple-600' },
    { name: 'sobri1', avatar: '👶', color: 'bg-blue-400' },
    { name: 'sobri2', avatar: '🧒', color: 'bg-blue-500' },
    { name: 'sobri3', avatar: '👧', color: 'bg-pink-400' },
    { name: 'mascota1', avatar: '🐶', color: 'bg-orange-500' },
    { name: 'mascota2', avatar: '🐱', color: 'bg-gray-500' },
];

// GET all users (seed if empty)
router.get('/', async (req, res) => {
    try {
        let users = await User.find();
        if (users.length === 0) {
            await User.insertMany(INITIAL_USERS);
            users = await User.find();
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

// UPDATE user
router.patch('/:id', async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, avatar },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
});

// CREATE User
router.post('/', async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newUser = new User({
            name,
            avatar: avatar || '🙂',
            color: randomColor
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error });
    }
});

export default router;
