import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// 1. ฟังก์ชันหลักสำหรับ Mongoose (ระบบใหม่: Sheets)
async function connectMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// 2. ฟังก์ชันเสริมสำหรับ Native Driver (กู้คืนระบบเก่า: Installment Insurance)
export async function getDatabase() {
    const conn = await connectMongoDB();
    // ส่งกลับ native db instance เพื่อให้โค้ดเก่าทำงานต่อได้
    return conn.connection.db; 
}

// Export default สำหรับระบบใหม่
export default connectMongoDB;