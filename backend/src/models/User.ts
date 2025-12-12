import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    avatar: string;
    color: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    color: { type: String, required: true }
});

// Transform _id to id when converting to JSON
UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

export default mongoose.model<IUser>('User', UserSchema);
