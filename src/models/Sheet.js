// src/models/Sheet.js
import mongoose from 'mongoose';

const SheetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
}, { timestamps: true });

// เช็คว่ามี Model นี้อยู่แล้วไหม (ป้องกัน error เวลา Hot Reload)
export default mongoose.models.Sheet || mongoose.model('Sheet', SheetSchema);