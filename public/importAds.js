import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Ad } from "./adModel.js";

dotenv.config();

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const adsFile = path.join(__dirname, "ads.json");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

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
          image: ad.image ? `/${ad.image}` : null, // <- путь относительно public
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
