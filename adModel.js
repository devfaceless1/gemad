import mongoose from "mongoose";

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  username: { type: String },
  desc: { type: String, required: true },
  image: { type: String },
  link: { type: String, required: true },
  tags: [{ type: String }],
  reward: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Ad = mongoose.model("Ad", adSchema);
