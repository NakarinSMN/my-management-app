// scripts/create-admin-user.js
// Script สำหรับสร้าง Admin User

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'management_app';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI ไม่พบในไฟล์ .env.local');
  process.exit(1);
}

async function createAdminUser() {
  let client;

  try {
    console.log('🔄 กำลังเชื่อมต่อ MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    const db = client.db(MONGODB_DATABASE);
    const users = db.collection('users');

    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existingAdmin = await users.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  มี Admin User อยู่แล้ว');
      console.log('   Username: admin');
      console.log('   ต้องการสร้างใหม่หรือไม่? ลบ user เดิมก่อน');
      return;
    }

    // อ่านข้อมูลจาก command line arguments หรือใช้ค่า default
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    const email = process.argv[4] || 'admin@example.com';
    const name = process.argv[5] || 'Admin';

    console.log(`\n📝 กำลังสร้าง Admin User...`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง Admin User
    const adminUser = {
      username,
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    const result = await users.insertOne(adminUser);

    console.log('\n✅ สร้าง Admin User สำเร็จ!');
    console.log(`   User ID: ${result.insertedId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  จำรหัสผ่านให้ดี! ควรเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบ');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 ปิดการเชื่อมต่อ MongoDB');
    }
  }
}

// รัน function
createAdminUser();

