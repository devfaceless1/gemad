const pendingSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  channel: { type: String, required: true },
  reward: { type: Number, required: true },
  status: { type: String, default: "waiting" }, 
  checkAfter: { type: Date, required: true },
  error: { type: String, default: null },       
  processedAt: { type: Date, default: null }    
}, { timestamps: true });
