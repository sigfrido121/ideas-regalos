import mongoose, { Schema, Document } from 'mongoose';

export interface IGift extends Document {
    name: string;
    description?: string;
    price?: number;
    url?: string;
    imageUrl?: string;
    priority?: 'low' | 'medium' | 'high';
    createdAt: Date;
}

const GiftSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    url: { type: String },
    imageUrl: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGift>('Gift', GiftSchema);
