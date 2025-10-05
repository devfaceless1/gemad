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

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Простейший API для проверки работы базы (например, получаем список каналов)
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

// Отправка index.html на любой другой маршрут
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});