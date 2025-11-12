// scripts/test-mongodb-connection.js
// สคริปต์สำหรับทดสอบการเชื่อมต่อ MongoDB

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔍 กำลังทดสอบการเชื่อมต่อ MongoDB...\n');

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'management_app';

  if (!uri) {
    console.error('❌ ไม่พบ MONGODB_URI ในไฟล์ .env.local');
    console.log('\n📝 กรุณาทำตามขั้นตอนดังนี้:');
    console.log('1. คัดลอกไฟล์ .env.local.example เป็น .env.local');
    console.log('2. แก้ไข MONGODB_URI ในไฟล์ .env.local');
    console.log('3. รันสคริปต์นี้อีกครั้ง\n');
    process.exit(1);
  }

  console.log(`📦 Database: ${dbName}`);
  console.log(`🔗 กำลังเชื่อมต่อ...\n`);

  const client = new MongoClient(uri, {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    ssl: true,
  });

  try {
    // เชื่อมต่อ MongoDB
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!\n');

    // ทดสอบ ping
    const db = client.db(dbName);
    await db.admin().ping();
    console.log('✅ Ping MongoDB สำเร็จ!\n');

    // แสดงรายการ Collections ที่มีอยู่
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections ที่มีในฐานข้อมูล:');
    if (collections.length === 0) {
      console.log('   (ยังไม่มี Collections)');
    } else {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    }

    // ตรวจสอบและสร้าง collection installment_insurance ถ้ายังไม่มี
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n🔧 กำลังตรวจสอบ Collections ที่จำเป็น...');
    
    const requiredCollections = [
      'customers',
      'installment_insurance'
    ];

    for (const collName of requiredCollections) {
      if (!collectionNames.includes(collName)) {
        console.log(`   📝 สร้าง Collection: ${collName}`);
        await db.createCollection(collName);
        
        // สร้าง indexes สำหรับ performance
        if (collName === 'installment_insurance') {
          await db.collection(collName).createIndex({ sequenceNumber: 1 }, { unique: true });
          await db.collection(collName).createIndex({ licensePlate: 1 });
          await db.collection(collName).createIndex({ customerName: 1 });
          console.log(`   ✅ สร้าง indexes สำหรับ ${collName} เรียบร้อย`);
        } else if (collName === 'customers') {
          await db.collection(collName).createIndex({ sequenceNumber: 1 }, { unique: true });
          await db.collection(collName).createIndex({ licensePlate: 1 });
          console.log(`   ✅ สร้าง indexes สำหรับ ${collName} เรียบร้อย`);
        }
      } else {
        console.log(`   ✅ Collection ${collName} มีอยู่แล้ว`);
      }
    }

    // นับจำนวนเอกสารในแต่ละ collection
    console.log('\n📊 จำนวนข้อมูลในแต่ละ Collection:');
    for (const collName of requiredCollections) {
      const count = await db.collection(collName).countDocuments();
      console.log(`   ${collName}: ${count} รายการ`);
    }

    console.log('\n🎉 การตั้งค่าฐานข้อมูลเสร็จสมบูรณ์!');
    console.log('✨ คุณสามารถเริ่มใช้งานระบบได้แล้ว\n');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.log('\n💡 แนวทางแก้ไข:');
    console.log('1. ตรวจสอบว่า MONGODB_URI ถูกต้อง');
    console.log('2. ตรวจสอบ username และ password');
    console.log('3. ตรวจสอบ Network Access ใน MongoDB Atlas');
    console.log('4. ตรวจสอบว่าอินเทอร์เน็ตทำงานปกติ\n');
  } finally {
    await client.close();
    console.log('🔌 ปิดการเชื่อมต่อแล้ว');
  }
}

testConnection().catch(console.error);

