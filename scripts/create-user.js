// scripts/create-user.js
// Script สำหรับสร้าง User (รองรับ role ต่างๆ: admin, superadmin, dev, user)

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'tax_management';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI ไม่พบในไฟล์ .env.local');
  process.exit(1);
}

async function createUser() {
  let client;

  try {
    console.log('🔄 กำลังเชื่อมต่อ MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    const db = client.db(MONGODB_DATABASE);
    const users = db.collection('users');

    // อ่านข้อมูลจาก command line arguments
    // Usage: node scripts/create-user.js <username> <password> <email> <name> <role>
    const username = process.argv[2];
    const password = process.argv[3];
    const email = process.argv[4] || `${username}@example.com`;
    const name = process.argv[5] || username;
    const role = process.argv[6] || 'user'; // default: user

    // Validation
    if (!username || !password) {
      console.error('\n❌ ต้องระบุ Username และ Password');
      console.log('\n📖 วิธีใช้:');
      console.log('   node scripts/create-user.js <username> <password> [email] [name] [role]');
      console.log('\n📝 ตัวอย่าง:');
      console.log('   node scripts/create-user.js dev dev123 dev@example.com Dev dev');
      console.log('   node scripts/create-user.js superadmin admin123 superadmin@example.com SuperAdmin superadmin');
      console.log('\n🔑 Roles ที่รองรับ: user, admin, superadmin, dev');
      process.exit(1);
    }

    // Validate role
    const validRoles = ['user', 'admin', 'superadmin', 'dev'];
    if (!validRoles.includes(role.toLowerCase())) {
      console.error(`\n❌ Role "${role}" ไม่ถูกต้อง`);
      console.log(`   Roles ที่รองรับ: ${validRoles.join(', ')}`);
      process.exit(1);
    }

    // ตรวจสอบว่ามี username หรือ email ซ้ำหรือไม่
    const existingUser = await users.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      console.log('\n⚠️  มี User นี้อยู่แล้ว:');
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log('\n   ต้องการสร้างใหม่หรือไม่? ลบ user เดิมก่อน');
      return;
    }

    console.log(`\n📝 กำลังสร้าง User...`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้าง User
    const newUser = {
      username,
      email,
      password: hashedPassword,
      name,
      role: role.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    const result = await users.insertOne(newUser);

    console.log('\n✅ สร้าง User สำเร็จ!');
    console.log(`   User ID: ${result.insertedId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}`);
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
createUser();

