import mongoose from 'mongoose';

const pendingSchema = new mongoose.Schema({
    telegramId: { type: String, required: true },
    channel: { type: String, required: true },
    reward: { type: Number, required: true },
    status: { type: String, default: "waiting" },
    checkAfter: { type: Date, required: true }
}, { timestamps: true });

export const Pending = mongoose.model('Pending', pendingSchema);
