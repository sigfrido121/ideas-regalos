import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    type: string;
    ts: Date;
    sessionId: string;
    visitorId?: string;
    userId?: string;
    path?: string;
    meta?: Record<string, any>;
    device?: string;
    country?: string;
}

const EventSchema: Schema = new Schema({
    type: { type: String, required: true, index: true },
    ts: { type: Date, default: Date.now, index: true },
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, index: true },
    userId: { type: String, index: true },
    path: { type: String },
    // Datos libres pero acotados (hosts, contadores, segundos...). Sin datos personales.
    meta: { type: Schema.Types.Mixed },
    device: { type: String },
    country: { type: String },
}, { versionKey: false });

// Se consulta casi siempre por rango temporal y tipo
EventSchema.index({ ts: -1, type: 1 });

// Retención: los eventos se borran solos a los 400 días (GDPR)
EventSchema.index({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

export default mongoose.model<IEvent>('Event', EventSchema);
