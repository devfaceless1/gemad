import mongoose from 'mongoose';

const pendingSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  channel: { type: String, required: true },
  checkAfter: { type: Date, required: true },
  status: { type: String, default: 'waiting' }
});

export const PendingSub = mongoose.model('PendingSub', pendingSchema);
