// scripts/init-installment-insurance-db.js
// สคริปต์สำหรับสร้างข้อมูลตัวอย่างในฐานข้อมูลผ่อนประกัน

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function initDatabase() {
  console.log('🚀 เริ่มต้นฐานข้อมูลผ่อนประกัน...\n');

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'management_app';

  if (!uri) {
    console.error('❌ ไม่พบ MONGODB_URI ในไฟล์ .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!\n');

    const db = client.db(dbName);
    const collection = db.collection('installment_insurance');

    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const count = await collection.countDocuments();
    
    if (count > 0) {
      console.log(`⚠️  มีข้อมูลอยู่แล้ว ${count} รายการ`);
      console.log('ต้องการลบข้อมูลเดิมและเริ่มใหม่หรือไม่? (y/n)');
      // สำหรับการใช้งานจริง ให้เพิ่ม prompt สำหรับยืนยัน
      // ตอนนี้ข้ามไปเพื่อความปลอดภัย
      console.log('✋ ยกเลิกการสร้างข้อมูลตัวอย่างเพื่อป้องกันข้อมูลเดิมหาย\n');
      return;
    }

    // สร้าง indexes
    console.log('📝 กำลังสร้าง indexes...');
    await collection.createIndex({ sequenceNumber: 1 }, { unique: true });
    await collection.createIndex({ licensePlate: 1 });
    await collection.createIndex({ customerName: 1 });
    await collection.createIndex({ status: 1 });
    console.log('✅ สร้าง indexes เรียบร้อย\n');

    // ข้อมูลตัวอย่าง
    const today = new Date();
    const startDate1 = new Date(today.getFullYear(), today.getMonth() - 5, 5).toISOString().split('T')[0];
    const startDate2 = new Date(today.getFullYear() - 1, today.getMonth(), 10).toISOString().split('T')[0];
    const startDate3 = new Date(today.getFullYear(), today.getMonth() - 3, 15).toISOString().split('T')[0];

    const sampleData = [
      {
        sequenceNumber: 1,
        licensePlate: 'กก-1234',
        vehicleType: 'รย.1',
        brand: 'Toyota Yaris',
        customerName: 'สมชาย ใจดี',
        phone: '0812345678',
        insuranceCompany: 'บริษัท กรุงเทพประกันภัย',
        insurancePremium: 15000,
        installmentCount: 10,
        currentInstallment: 5,
        startDate: startDate1,
        paymentDay: 5,
        paidDates: {
          '1': new Date(today.getFullYear(), today.getMonth() - 5, 5).toISOString().split('T')[0],
          '2': new Date(today.getFullYear(), today.getMonth() - 4, 5).toISOString().split('T')[0],
          '3': new Date(today.getFullYear(), today.getMonth() - 3, 5).toISOString().split('T')[0],
          '4': new Date(today.getFullYear(), today.getMonth() - 2, 5).toISOString().split('T')[0],
          '5': new Date(today.getFullYear(), today.getMonth() - 1, 5).toISOString().split('T')[0],
        },
        tags: ['ประกันภัย', 'ภาษี'],
        status: 'กำลังผ่อน',
        note: 'ผ่อนงวดละ 1,500 บาท ทุกวันที่ 5 ของเดือน',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        sequenceNumber: 2,
        licensePlate: 'ขข-5678',
        vehicleType: 'รย.2',
        brand: 'Honda City',
        customerName: 'สมหญิง รักสุข',
        phone: '0823456789',
        insuranceCompany: 'บริษัท วิริยะประกันภัย',
        insurancePremium: 12000,
        installmentCount: 12,
        currentInstallment: 12,
        startDate: startDate2,
        paymentDay: 10,
        paidDates: {
          '1': new Date(today.getFullYear() - 1, today.getMonth(), 10).toISOString().split('T')[0],
          '2': new Date(today.getFullYear() - 1, today.getMonth() + 1, 10).toISOString().split('T')[0],
          '3': new Date(today.getFullYear() - 1, today.getMonth() + 2, 10).toISOString().split('T')[0],
          '4': new Date(today.getFullYear() - 1, today.getMonth() + 3, 10).toISOString().split('T')[0],
          '5': new Date(today.getFullYear() - 1, today.getMonth() + 4, 10).toISOString().split('T')[0],
          '6': new Date(today.getFullYear() - 1, today.getMonth() + 5, 10).toISOString().split('T')[0],
          '7': new Date(today.getFullYear() - 1, today.getMonth() + 6, 10).toISOString().split('T')[0],
          '8': new Date(today.getFullYear() - 1, today.getMonth() + 7, 10).toISOString().split('T')[0],
          '9': new Date(today.getFullYear() - 1, today.getMonth() + 8, 10).toISOString().split('T')[0],
          '10': new Date(today.getFullYear() - 1, today.getMonth() + 9, 10).toISOString().split('T')[0],
          '11': new Date(today.getFullYear() - 1, today.getMonth() + 10, 10).toISOString().split('T')[0],
          '12': new Date(today.getFullYear() - 1, today.getMonth() + 11, 10).toISOString().split('T')[0],
        },
        tags: ['ประกันภัย'],
        status: 'ผ่อนครบแล้ว',
        note: 'ชำระครบถ้วนแล้ว ทุกวันที่ 10 ของเดือน',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        sequenceNumber: 3,
        licensePlate: 'คค-9012',
        vehicleType: 'รย.1',
        brand: 'Mazda 2',
        customerName: 'วิชัย มั่นคง',
        phone: '0834567890',
        insuranceCompany: 'บริษัท ทิพยประกันภัย',
        insurancePremium: 18000,
        installmentCount: 6,
        currentInstallment: 3,
        startDate: startDate3,
        paymentDay: 15,
        paidDates: {
          '1': new Date(today.getFullYear(), today.getMonth() - 3, 15).toISOString().split('T')[0],
          '2': new Date(today.getFullYear(), today.getMonth() - 2, 15).toISOString().split('T')[0],
          '3': new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split('T')[0],
        },
        tags: ['ประกันภัย', 'พรบ.'],
        status: 'กำลังผ่อน',
        note: 'ผ่อนงวดละ 3,000 บาท ทุกวันที่ 15 ของเดือน',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // เพิ่มข้อมูลลงฐานข้อมูล
    console.log('📝 กำลังเพิ่มข้อมูลตัวอย่าง...');
    const result = await collection.insertMany(sampleData);
    console.log(`✅ เพิ่มข้อมูลสำเร็จ ${result.insertedCount} รายการ\n`);

    // แสดงข้อมูลที่เพิ่มเข้าไป
    console.log('📋 ข้อมูลที่เพิ่มเข้าไป:');
    sampleData.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.licensePlate} - ${item.customerName} (${item.status})`);
    });

    console.log('\n🎉 เสร็จสิ้น!\n');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    await client.close();
    console.log('🔌 ปิดการเชื่อมต่อแล้ว');
  }
}

initDatabase().catch(console.error);

