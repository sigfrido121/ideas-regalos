import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    avatar: string;
    color: string;
    hidden?: boolean;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    color: { type: String, required: true },
    // Oculto = no aparece en la app, pero no se borra nada
    hidden: { type: Boolean, default: false, index: true }
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
