import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: String,
  username: String,
  avatarUrl: String,

  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },

  subscribedChannels: { type: [String], default: [] },

  inventory: [
    {
      uid: { type: String, required: true }, // уникальный ID предмета
      label: String,
      img: String,
      value: { type: Number, default: 0 }, // цена продажи
      receivedAt: { type: Date, default: Date.now }
    }
  ]
});

export const User = mongoose.model('User', userSchema);