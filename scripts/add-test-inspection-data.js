// scripts/add-test-inspection-data.js
// สคริปต์สำหรับเพิ่มข้อมูลทดสอบการตรวจรถ

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addTestInspectionData() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE;

  if (!uri || !dbName) {
    console.error('❌ กรุณาตั้งค่า MONGODB_URI และ MONGODB_DATABASE ใน .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔗 เชื่อมต่อกับ MongoDB...');
    await client.connect();
    console.log('✅ เชื่อมต่อสำเร็จ!');

    const db = client.db(dbName);
    const customers = db.collection('customers');

    // สร้างข้อมูลทดสอบ 30 รายการ
    const testData = [];
    const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
    const brands = ['TOYOTA', 'HONDA', 'ISUZU', 'MAZDA', 'NISSAN', 'MITSUBISHI'];
    const firstNames = ['สมชาย', 'สมหญิง', 'วิชัย', 'ประยุทธ', 'สุดา', 'นภา', 'อรุณ', 'วิไล'];
    const lastNames = ['ใจดี', 'รักษา', 'มั่นคง', 'สุขสันต์', 'วงศ์ดี', 'เจริญ', 'สว่าง', 'พัฒนา'];
    
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      // สุ่มวันที่ตรวจใน 7 วันล่าสุด (50%) และเดือนอื่นๆ (50%)
      let inspectionDate;
      if (i < 15) {
        // 7 วันล่าสุด
        const daysAgo = Math.floor(Math.random() * 7);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        inspectionDate = `${dd}/${mm}/${yyyy}`;
      } else {
        // เดือนอื่นๆในปีนี้
        const randomMonth = Math.floor(Math.random() * 12) + 1;
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const dd = String(randomDay).padStart(2, '0');
        const mm = String(randomMonth).padStart(2, '0');
        const yyyy = today.getFullYear();
        inspectionDate = `${dd}/${mm}/${yyyy}`;
      }
      
      // สร้างทะเบียนรถ
      const letters = ['กก', 'ขข', 'คค', 'งง', 'จจ', 'ฉฉ', 'ชช', 'ซซ'];
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const licensePlate = `ทดสอบ${randomLetter}${randomNum}`;
      
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const phone = `08${Math.floor(Math.random() * 90000000) + 10000000}`;
      
      const now = new Date();
      testData.push({
        licensePlate: licensePlate,
        brand: brand,
        customerName: `${firstName} ${lastName}`,
        phone: phone,
        registerDate: inspectionDate, // ใช้วันเดียวกับ inspectionDate
        inspectionDate: inspectionDate,
        vehicleType: vehicleType,
        status: 'รอดำเนินการ',
        note: 'ข้อมูลทดสอบสำหรับกราฟตรวจรถ',
        tags: ['ตรอ.'], // มีแท็ก ตรอ. เท่านั้น
        createdAt: now,
        updatedAt: now
      });
    }

    console.log(`\n📝 กำลังเพิ่มข้อมูลทดสอบ ${testData.length} รายการ...`);
    
    const result = await customers.insertMany(testData);
    
    console.log(`\n✅ เพิ่มข้อมูลทดสอบสำเร็จ!`);
    console.log(`   - จำนวนที่เพิ่ม: ${result.insertedCount} รายการ`);
    
    // แสดงตัวอย่างข้อมูล
    console.log('\n📋 ตัวอย่างข้อมูล (5 รายการแรก):');
    testData.slice(0, 5).forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.licensePlate} - ${doc.customerName}`);
      console.log(`   - ประเภทรถ: ${doc.vehicleType}`);
      console.log(`   - วันที่ตรวจ: ${doc.inspectionDate}`);
      console.log(`   - แท็ก: ${doc.tags.join(', ')}`);
    });

    // สรุปการกระจายตัวของข้อมูล
    console.log('\n📊 สรุปข้อมูล:');
    const summary = {};
    testData.forEach(doc => {
      summary[doc.vehicleType] = (summary[doc.vehicleType] || 0) + 1;
    });
    
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} คัน`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ ปิดการเชื่อมต่อแล้ว');
  }
}

// รันสคริปต์
console.log('🚀 เริ่มต้นการเพิ่มข้อมูลทดสอบ\n');
addTestInspectionData()
  .then(() => {
    console.log('\n🎉 เสร็จสิ้น!');
    console.log('\n💡 Tip: ลอง refresh หน้า Dashboard เพื่อดูกราฟใหม่');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });

