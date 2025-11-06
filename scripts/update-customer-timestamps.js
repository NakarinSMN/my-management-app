// scripts/update-customer-timestamps.js
// สคริปต์สำหรับอัปเดตข้อมูลลูกค้าที่ไม่มี createdAt/updatedAt

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://nakrin_db_user:2240444SmnQ@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority';
const dbName = 'tax_management';

async function updateTimestamps() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db(dbName);
    const customers = db.collection('customers');
    
    // หาข้อมูลที่ไม่มี createdAt หรือ updatedAt
    const customersWithoutTimestamps = await customers.find({
      $or: [
        { createdAt: { $exists: false } },
        { updatedAt: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${customersWithoutTimestamps.length} customers without timestamps`);
    
    if (customersWithoutTimestamps.length === 0) {
      console.log('✅ All customers already have timestamps');
      return;
    }
    
    // อัปเดตข้อมูลทีละรายการ
    const now = new Date();
    let updated = 0;
    
    for (const customer of customersWithoutTimestamps) {
      const updateData = {};
      
      if (!customer.createdAt) {
        updateData.createdAt = now;
      }
      
      if (!customer.updatedAt) {
        updateData.updatedAt = now;
      }
      
      if (Object.keys(updateData).length > 0) {
        await customers.updateOne(
          { _id: customer._id },
          { $set: updateData }
        );
        updated++;
        console.log(`✅ Updated: ${customer.licensePlate}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updated} customers`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateTimestamps();

