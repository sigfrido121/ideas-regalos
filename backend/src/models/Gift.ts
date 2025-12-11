import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
    id: string;
    userId: string;
    text: string;
    createdAt: number;
}

export interface IGift extends Document {
    userId: string;
    title: string;
    description: string;
    imageData: string;
    comments: IComment[];
    createdAt: Date; // Mongoose handles dates, frontend expects number but Date is fine to serialize
}

const GiftSchema: Schema = new Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    imageData: { type: String }, // Base64 string
    comments: [{
        id: String,
        userId: String,
        text: String,
        createdAt: Number
    }],
    createdAt: { type: Date, default: Date.now },
});

// Transform _id to id when converting to JSON
GiftSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

export default mongoose.model<IGift>('Gift', GiftSchema);
