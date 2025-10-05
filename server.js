import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User model
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

// Получение/создание пользователя
app.get('/api/user/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = await User.create({ telegramId });
  }
  res.json({ balance: user.balance });
});

// Списание баланса при спине
app.post('/api/user/spin', async (req, res) => {
  const { telegramId, cost } = req.body;
  if (!telegramId || !cost) return res.status(400).json({ error: "Missing telegramId or cost" });

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.balance < cost) return res.json({ error: "Not enough stars" });

  user.balance -= cost;
  await user.save();
  res.json({ balance: user.balance });
});

// API для проверки работы базы (опционально)
app.get('/api/channels', async (req, res) => {
  try {
    const Channel = mongoose.model('Channel', new mongoose.Schema({
      name: String,
      link: String,
      stars: Number
    }));
    const channels = await Channel.find();
    res.json(channels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отправка index.html на любой маршрут
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
