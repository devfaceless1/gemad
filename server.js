import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './userModel.js';
import cloudinary from 'cloudinary';
import crypto from "crypto";

function verifyTelegramInitData(initData, botToken) {
  try {
    const secret = crypto.createHash("sha256").update(botToken).digest();
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get("hash");
    parsed.delete("hash");

    const dataCheckString = [...parsed.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join("\n");

    const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
    return hmac === hash;
  } catch (e) {
    console.error("Telegram data verify error:", e);
    return false;
  }
}


cloudinary.v2.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret: process.env.CLOUD_API_SECRET 
});

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));



app.post('/api/user/init', async (req, res) => {
    const { telegramId, firstName, username, avatarUrl } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    let user = await User.findOne({ telegramId });
    if (!user) {
        user = new User({
            telegramId,
            firstName,
            username,
            avatarUrl,
            balance: 0,
            totalEarned: 0, 
            subscribedChannels: []
        });
        await user.save();
    }


    res.json({
        balance: user.balance,
        totalEarned: user.totalEarned || 0,
        subscribedChannels: user.subscribedChannels
    });
});


app.post('/api/user/update', async (req, res) => {
    const { telegramId, delta, channel } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });


    user.balance += delta;


    if (delta > 0) {
        user.totalEarned = (user.totalEarned || 0) + delta;
    }

    if (user.balance < 0) user.balance = 0;


    if (channel && !user.subscribedChannels.includes(channel)) {
        user.subscribedChannels.push(channel);
    }

    await user.save();

    res.json({
        balance: user.balance,
        totalEarned: user.totalEarned,
        subscribedChannels: user.subscribedChannels
    });
});


app.post('/api/user/spin', async (req, res) => {
    const { telegramId, cost } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'No telegramId' });

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < cost) return res.status(400).json({ error: 'Not enough stars' });

    user.balance -= cost;
    await user.save();

    res.json({
        balance: user.balance,
        totalEarned: user.totalEarned || 0
    });
});


app.post('/api/admin/reset-balances', async (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.body.secret;
    if (!secret || secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });

    const result = await User.updateMany({}, { $set: { balance: 0, subscribedChannels: [] } });
    res.json({ ok: true, modifiedCount: result.modifiedCount ?? result.nModified ?? result });
});

// ===============================
// 🟢 block admin + ad
// ===============================
import fs from 'fs';
import multer from 'multer';
import { Ad } from './adModel.js'; 

const upload = multer({ dest: 'tmp/' });

app.post('/api/admin/uploadAd', upload.single('image'), async (req, res) => {
    try {
        const { telegramId, title, desc, tags, link, reward, username } = req.body;
        if (!telegramId || telegramId !== process.env.ADMIN_TELEGRAM_ID)
            return res.status(403).json({ error: 'Access denied' });

        if (!title || !desc || !link || !reward)
            return res.status(400).json({ error: 'Missing fields' });

        let imageUrl = null;

        if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'ads_images' 
        });
        imageUrl = result.secure_url; 
        fs.unlinkSync(req.file.path);
        }


        const ad = new Ad({
            title,
            username: username || "",
            desc,
            image: imageUrl,
            link,
            tags: tags ? tags.split(" ").map(t => t.trim()) : [],
            reward
        });

        await ad.save();

        res.json({ success: true, ad });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load ads' });
    }
});
// ===============================
// 🟢 admin block
// ===============================

app.delete("/api/admin/ad", async (req, res) => {
  const { username, initData } = req.body;

  if (!initData || !verifyTelegramInitData(initData)) {
    return res.status(403).json({ error: "Invalid or missing Telegram data" });
  }

  const tgData = new URLSearchParams(initData);
  const telegramId = tgData.get("user[id]");

  if (telegramId !== process.env.ADMIN_TELEGRAM_ID) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

  try {
    const result = await Ad.deleteMany({ username });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});