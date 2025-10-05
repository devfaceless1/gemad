import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './userModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// Инициализация пользователя
// ================================
app.post('/api/user/init', async (req, res) => {
    const { telegramId, firstName, username, avatarUrl } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    let user = await User.findOne({ telegramId });
    if (!user) {
        user = new User({ telegramId, firstName, username, avatarUrl, balance: 0 });
        await user.save();
    }

    // Возвращаем баланс и подписанные каналы
    res.json({ balance: user.balance, subscribedChannels: user.subscribedChannels });
});

// ================================
// Обновление баланса и подписок
// ================================
app.post('/api/user/update', async (req, res) => {
    const { telegramId, delta, channel } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.balance += delta;
    if (user.balance < 0) user.balance = 0;

    // Добавляем канал, если он указан и еще не был подписан
    if (channel && !user.subscribedChannels.includes(channel)) {
        user.subscribedChannels.push(channel);
    }

    await user.save();

    res.json({ balance: user.balance, subscribedChannels: user.subscribedChannels });
});

// ================================
// Маршрут для кейса / спина
// ================================
app.post('/api/user/spin', async (req, res) => {
    const { telegramId, cost } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < cost) return res.status(400).json({ error: 'Not enough stars' });

    user.balance -= cost;
    await user.save();

    res.json({ balance: user.balance });
});

// ================================
// Любой другой маршрут возвращает index.html
// ================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================================
// Запуск сервера
// ================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});