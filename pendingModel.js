import mongoose from 'mongoose';

const pendingSchema = new mongoose.Schema({
    telegramId: { type: String, required: true },
    channel: { type: String, required: true },
    reward: { type: Number, required: true },
    status: { type: String, default: "waiting" }, // waiting, rewarded, failed, skipped
    checkAfter: { type: Date, required: true }
}, { timestamps: true });

export const PendingSub = mongoose.model('PendingSub', pendingSchema);
