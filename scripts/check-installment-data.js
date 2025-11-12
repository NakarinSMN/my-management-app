// scripts/check-installment-data.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkData() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'tax_management';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ\n');

    const db = client.db(dbName);
    const collection = db.collection('installment_insurance');

    const count = await collection.countDocuments();
    console.log(`📊 จำนวนข้อมูลทั้งหมด: ${count} รายการ\n`);

    const data = await collection.find({}).sort({ sequenceNumber: -1 }).limit(5).toArray();
    
    console.log('📋 ข้อมูล 5 รายการล่าสุด:\n');
    data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.licensePlate} - ${item.customerName}`);
      console.log(`   เบี้ย: ${item.insurancePremium} บาท`);
      console.log(`   งวด: ${item.installmentCount}`);
      console.log(`   paidDates:`, item.paidDates || 'ไม่มี');
      console.log(`   installmentAmounts:`, item.installmentAmounts || 'ไม่มี');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkData();

