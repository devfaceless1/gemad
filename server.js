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

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


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


// === 📢 ADMIN: Upload Ads ===
import multer from "multer";
import fs from "fs";

const ADS_FILE = path.join(__dirname, "public", "ads.json");
const upload = multer({ dest: path.join(__dirname, "public", "uploads/") });


if (!fs.existsSync(ADS_FILE)) {
  fs.writeFileSync(ADS_FILE, "[]", "utf8");
}

app.post("/api/admin/uploadAd", upload.single("image"), async (req, res) => {
  try {
    const { telegramId, title, desc, tags, link } = req.body;
    const image = req.file;

    const ADMIN_ID = "123456789";

    if (telegramId !== ADMIN_ID) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!image) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const ads = JSON.parse(fs.readFileSync(ADS_FILE, "utf8"));

    const newAd = {
      title,
      desc,
      link,
      image: `/uploads/${image.filename}`,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      date: new Date().toISOString()
    };

    ads.push(newAd);
    fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2));

    res.json({ success: true, ad: newAd });
  } catch (err) {
    console.error("Error uploading ad:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/ads", (req, res) => {
  try {
    const ads = JSON.parse(fs.readFileSync(ADS_FILE, "utf8"));
    res.json(ads);
  } catch (err) {
    console.error("Error reading ads.json:", err);
    res.status(500).json({ error: "Cannot read ads" });
  }
});



app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});