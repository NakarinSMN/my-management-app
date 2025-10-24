const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

async function migratePricingData() {
  console.log('🚀 เริ่มต้นการย้ายข้อมูลราคางานบริการ...');
  
  if (!MONGODB_URI) {
    console.error('❌ ไม่พบ MONGODB_URI ใน environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    // เชื่อมต่อ MongoDB
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');
    
    const db = client.db('tax_management');
    const pricingCollection = db.collection('pricing');
    
    // ลบข้อมูลเก่า
    console.log('🗑️ ลบข้อมูลราคางานบริการเก่า...');
    const deleteResult = await pricingCollection.deleteMany({});
    console.log(`✅ ลบข้อมูลเก่าแล้ว: ${deleteResult.deletedCount} รายการ`);
    
    // ดึงข้อมูลจาก Google Sheets
    console.log('📥 ดึงข้อมูลจาก Google Sheets...');
    const response = await fetch(GOOGLE_SCRIPT_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const googleData = await response.json();
    console.log(`✅ ดึงข้อมูลจาก Google Sheets สำเร็จ: ${googleData.length} รายการ`);
    
    // แปลงข้อมูล
    console.log('🔄 แปลงข้อมูล...');
    const pricingData = googleData.map((item, index) => ({
      categoryName: item.categoryName || '',
      categoryDescription: item.categoryDescription || '',
      serviceName: item.serviceName || '',
      servicePrice: parseFloat(item.servicePrice) || 0,
      serviceDetails: item.serviceDetails || '',
      rowIndex: item.rowIndex || index,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    console.log(`✅ แปลงข้อมูลสำเร็จ: ${pricingData.length} รายการ`);
    
    // แยกข้อมูลตามหมวดหมู่
    const categories = {};
    pricingData.forEach(item => {
      if (!categories[item.categoryName]) {
        categories[item.categoryName] = {
          categoryName: item.categoryName,
          categoryDescription: item.categoryDescription,
          services: []
        };
      }
      categories[item.categoryName].services.push(item);
    });
    
    console.log(`✅ จัดกลุ่มข้อมูลสำเร็จ: ${Object.keys(categories).length} หมวดหมู่`);
    
    // บันทึกข้อมูลลง MongoDB
    console.log('💾 บันทึกข้อมูลลง MongoDB...');
    const insertResult = await pricingCollection.insertMany(pricingData);
    console.log(`✅ บันทึกข้อมูลสำเร็จ: ${insertResult.insertedCount} รายการ`);
    
    // แสดงสถิติ
    console.log('\n📊 สถิติการย้ายข้อมูล:');
    console.log(`- หมวดหมู่ทั้งหมด: ${Object.keys(categories).length}`);
    console.log(`- บริการทั้งหมด: ${pricingData.length}`);
    
    // แสดงรายละเอียดหมวดหมู่
    console.log('\n📋 รายละเอียดหมวดหมู่:');
    Object.values(categories).forEach(category => {
      console.log(`- ${category.categoryName}: ${category.services.length} บริการ`);
    });
    
    console.log('\n🎉 การย้ายข้อมูลราคางานบริการเสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 ปิดการเชื่อมต่อ MongoDB');
  }
}

// เรียกใช้ฟังก์ชัน
migratePricingData().catch(console.error);
