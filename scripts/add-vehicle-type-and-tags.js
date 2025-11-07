// scripts/add-vehicle-type-and-tags.js
// Script สำหรับเพิ่มฟิลด์ vehicleType และ tags ให้กับข้อมูลลูกค้าเก่า

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'tax-management';

async function addVehicleTypeAndTags() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log('🔄 Starting migration: Add vehicleType and tags fields...');
  console.log('📊 Database:', MONGODB_DATABASE);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DATABASE);
    const customers = db.collection('customers');

    // นับข้อมูลทั้งหมด
    const totalCount = await customers.countDocuments();
    console.log(`📊 Total customers: ${totalCount}`);

    // อัปเดตข้อมูลทั้งหมดที่ยังไม่มี vehicleType และ tags
    const result = await customers.updateMany(
      {
        $or: [
          { vehicleType: { $exists: false } },
          { tags: { $exists: false } }
        ]
      },
      {
        $set: {
          vehicleType: '',
          tags: []
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} customers with vehicleType and tags fields`);
    console.log(`📊 Matched ${result.matchedCount} customers`);

    // ตรวจสอบข้อมูลหลังอัปเดต
    const sample = await customers.findOne({});
    console.log('📝 Sample customer after update:', sample);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

addVehicleTypeAndTags();

