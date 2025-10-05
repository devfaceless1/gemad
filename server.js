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

app.use(express.json()); // для POST запросов

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Модель пользователя
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// API: получить баланс пользователя
app.get('/api/user/:telegramId', async (req, res) => {
    const { telegramId } = req.params;
    try {
        let user = await User.findOne({ telegramId });
        if (!user) {
            user = new User({ telegramId });
            await user.save();
        }
        res.json({ balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// API: списать звёзды при спине
app.post('/api/user/spin', async (req, res) => {
    const { telegramId, cost } = req.body;
    try {
        let user = await User.findOne({ telegramId });
        if (!user) user = await new User({ telegramId }).save();

        if (user.balance < cost) return res.json({ error: 'Not enough stars', balance: user.balance });

        user.balance -= cost;
        await user.save();
        res.json({ balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Простейший API для проверки каналов
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
        res.status(500).json({ error: 'Server error' });
    }
});

// Отправка index.html на любой другой маршрут
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
