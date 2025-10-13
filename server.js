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




import multer from 'multer';
import fs from 'fs';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

app.post('/api/admin/uploadAd', upload.single('image'), (req, res) => {
  const ADMIN_TELEGRAM_ID = "7613674527"; // 👈 
  const userId = String(req.body.telegramId);

  if (userId !== ADMIN_TELEGRAM_ID) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const { title, desc, tags, link, reward, username } = req.body;
  if (!title || !desc || !link || !reward || !username || !req.file) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const ad = {
    title: title.trim(),
    username: username.trim(),
    desc: desc.trim(),
    tags: tags.split(',').map(t => t.trim()), 
    link: link.trim(),
    reward: reward.trim(),
    image: `images/${req.file.filename}`
  };

  const adsPath = path.join(__dirname, 'public/ads.json');

  let ads = [];
  if (fs.existsSync(adsPath)) {
    try {
      const data = fs.readFileSync(adsPath, 'utf8');
      ads = JSON.parse(data);
    } catch (err) {
      console.error('Error reading ads.json:', err);
      return res.status(500).json({ success: false, error: 'Failed to read ads.json' });
    }
  }

  ads.push(ad);

  try {
    fs.writeFileSync(adsPath, JSON.stringify(ads, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('Error writing ads.json:', err);
    res.status(500).json({ success: false, error: 'Failed to save ad' });
  }
});



app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});