import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    username: String,
    avatarUrl: String,
    balance: { type: Number, default: 0 },
    subscribedChannels: { type: [String], default: [] }, // новое поле
});

export const User = mongoose.model('User', userSchema);
