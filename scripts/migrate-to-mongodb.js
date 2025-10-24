// scripts/migrate-to-mongodb.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_SHEET_CUSTOMER_API = process.env.GOOGLE_SHEET_CUSTOMER_API_URL;
const GOOGLE_SHEET_BILLING_API = process.env.GOOGLE_SHEET_BILLING_API_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function migrateCustomers() {
  console.log('🔄 กำลังย้ายข้อมูลลูกค้า...');
  
  try {
    // ดึงข้อมูลจาก Google Sheets
    const response = await fetch(GOOGLE_SHEET_CUSTOMER_API);
    const data = await response.json();
    
    if (!data.data) {
      console.error('❌ ไม่พบข้อมูลลูกค้าใน Google Sheets');
      return;
    }

    // เชื่อมต่อ MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('tax_management');
    const customers = db.collection('customers');

    // แปลงข้อมูลเป็น MongoDB format
    const mongoData = data.data.map(item => ({
      licensePlate: item['ทะเบียนรถ'] || '',
      brand: item['ยี่ห้อ / รุ่น'] || '',
      customerName: item['ชื่อลูกค้า'] || '',
      phone: item['เบอร์ติดต่อ'] || '',
      registerDate: item['วันที่ชำระภาษีล่าสุด'] || '',
      status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
      note: item['หมายเหตุ'] || '',
      userId: item['userId'] || '',
      day: item['day'] || 365,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // ลบข้อมูลเก่า (ถ้ามี)
    await customers.deleteMany({});
    console.log('🗑️ ลบข้อมูลลูกค้าเก่าแล้ว');

    // บันทึกข้อมูลใหม่
    const result = await customers.insertMany(mongoData);
    console.log(`✅ ย้ายข้อมูลลูกค้าเรียบร้อย: ${result.insertedCount} รายการ`);

    await client.close();
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการย้ายข้อมูลลูกค้า:', error);
  }
}

async function migrateBilling() {
  console.log('🔄 กำลังย้ายข้อมูลบิล...');
  
  try {
    // ดึงข้อมูลจาก Google Sheets
    const response = await fetch(GOOGLE_SHEET_BILLING_API);
    const data = await response.json();
    
    if (!data.data) {
      console.error('❌ ไม่พบข้อมูลบิลใน Google Sheets');
      return;
    }

    // เชื่อมต่อ MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('tax_management');
    const billing = db.collection('billing');

    // แปลงข้อมูลเป็น MongoDB format
    const mongoData = data.data.map(item => ({
      billNumber: item['เลขที่บิล'] || '',
      customerName: item['ลูกค้า'] || '',
      service: item['บริการ'] || '',
      category: item['หมวดหมู่'] || '',
      price: typeof item['ราคา'] === 'string' ? parseFloat(item['ราคา']) : item['ราคา'] || 0,
      date: item['วันที่'] || '',
      phone: (item['เบอร์ติดต่อ'] || '').toString(),
      status: item['สถานะ'] || 'รอดำเนินการ',
      items: item['รายการและยอดเงิน'] || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // ลบข้อมูลเก่า (ถ้ามี)
    await billing.deleteMany({});
    console.log('🗑️ ลบข้อมูลบิลเก่าแล้ว');

    // บันทึกข้อมูลใหม่
    const result = await billing.insertMany(mongoData);
    console.log(`✅ ย้ายข้อมูลบิลเรียบร้อย: ${result.insertedCount} รายการ`);

    await client.close();
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการย้ายข้อมูลบิล:', error);
  }
}

async function main() {
  console.log('🚀 เริ่มการย้ายข้อมูลไป MongoDB Atlas...');
  console.log('📊 MongoDB URI:', MONGODB_URI ? '✅ ตั้งค่าแล้ว' : '❌ ไม่พบ');
  console.log('📊 Google Sheets API:', GOOGLE_SHEET_CUSTOMER_API ? '✅ ตั้งค่าแล้ว' : '❌ ไม่พบ');
  
  await migrateCustomers();
  await migrateBilling();
  
  console.log('🎉 การย้ายข้อมูลเสร็จสิ้น!');
}

main().catch(console.error);
