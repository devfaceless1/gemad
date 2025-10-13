import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Ad } from "./adModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Читаем ads.json
const adsFile = path.join(process.cwd(), "ads.json");
const rawData = fs.readFileSync(adsFile, "utf-8");
const ads = JSON.parse(rawData);

async function importAds() {
  try {
    for (const ad of ads) {
      const exists = await Ad.findOne({ title: ad.title });
      if (!exists) {
        await Ad.create({
          title: ad.title,
          username: ad.username || "",
          desc: ad.desc,
          image: ad.image || null,
          video: ad.video || null,
          link: ad.link,
          tags: ad.tags || [],
          reward: ad.reward
        });
        console.log(`✅ Added: ${ad.title}`);
      } else {
        console.log(`⚠️ Already exists: ${ad.title}`);
      }
    }
    console.log("🎉 All ads imported!");
  } catch (err) {
    console.error("❌ Import error:", err);
  } finally {
    mongoose.disconnect();
  }
}

importAds();
