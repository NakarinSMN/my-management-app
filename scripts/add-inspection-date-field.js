// scripts/add-inspection-date-field.js
// สคริปต์สำหรับเพิ่มฟิลด์ inspectionDate ให้กับข้อมูลที่มีอยู่แล้ว

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addInspectionDateField() {
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

    // ตรวจสอบจำนวนเอกสารที่ไม่มีฟิลด์ inspectionDate
    const countWithoutField = await customers.countDocuments({
      inspectionDate: { $exists: false }
    });

    console.log(`\n📊 พบข้อมูลที่ยังไม่มีฟิลด์ inspectionDate: ${countWithoutField} รายการ`);

    if (countWithoutField === 0) {
      console.log('✅ ข้อมูลทั้งหมดมีฟิลด์ inspectionDate แล้ว');
      return;
    }

    // อัปเดตข้อมูลทั้งหมดที่ยังไม่มีฟิลด์ inspectionDate
    console.log('\n🔄 กำลังเพิ่มฟิลด์ inspectionDate...');
    
    const result = await customers.updateMany(
      { inspectionDate: { $exists: false } },
      { 
        $set: { 
          inspectionDate: '' 
        } 
      }
    );

    console.log(`\n✅ อัปเดตสำเร็จ!`);
    console.log(`   - จำนวนที่ตรงกัน: ${result.matchedCount} รายการ`);
    console.log(`   - จำนวนที่แก้ไข: ${result.modifiedCount} รายการ`);

    // แสดงตัวอย่างข้อมูลที่อัปเดต
    const samples = await customers.find({}).limit(3).toArray();
    console.log('\n📋 ตัวอย่างข้อมูล (3 รายการแรก):');
    samples.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.licensePlate} - ${doc.customerName}`);
      console.log(`   - registerDate: ${doc.registerDate || '-'}`);
      console.log(`   - inspectionDate: ${doc.inspectionDate || '(ว่าง)'}`);
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
console.log('🚀 เริ่มต้นการเพิ่มฟิลด์ inspectionDate\n');
addInspectionDateField()
  .then(() => {
    console.log('\n🎉 เสร็จสิ้น!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });

