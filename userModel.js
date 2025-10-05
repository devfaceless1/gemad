import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    username: String,
    avatarUrl: String,
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 }, // 💰 все звезды, когда-либо заработанные
    subscribedChannels: { type: [String], default: [] }
});

export const User = mongoose.model('User', userSchema);
