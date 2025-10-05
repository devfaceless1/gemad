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

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Модели
const User = mongoose.model('User', new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    username: String,
    photoUrl: String,
    balance: { type: Number, default: 0 }
}));

const Channel = mongoose.model('Channel', new mongoose.Schema({
    name: String,
    link: String,
    stars: Number
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Получение списка каналов
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await Channel.find();
        res.json(channels);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// API: Спин / списание звезд
app.post('/api/user/spin', async (req, res) => {
    try {
        const { telegramId, cost } = req.body;
        if (!telegramId) return res.status(400).json({ error: "No telegramId" });

        let user = await User.findOne({ telegramId });
        if (!user) {
            user = new User({ telegramId, balance: 0 });
        }

        if (user.balance < cost) return res.json({ error: "Not enough stars" });

        user.balance -= cost;
        await user.save();

        res.json({ balance: user.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// API: Получение информации о пользователе (по желанию)
app.get('/api/user/:telegramId', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        res.json(user || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Любой другой маршрут возвращает index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
