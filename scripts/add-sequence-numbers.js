// scripts/add-sequence-numbers.js
// สคริปต์สำหรับเพิ่มเลขลำดับอัตโนมัติให้กับข้อมูลเดิมที่ยังไม่มี sequenceNumber

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'tax_management';

async function addSequenceNumbers() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const customers = db.collection('customers');
    const counters = db.collection('counters');
    
    // ดึงข้อมูลลูกค้าทั้งหมดที่ยังไม่มี sequenceNumber
    const customersWithoutSeq = await customers.find({
      $or: [
        { sequenceNumber: { $exists: false } },
        { sequenceNumber: null },
        { sequenceNumber: 0 }
      ]
    }).sort({ createdAt: 1 }).toArray();
    
    console.log(`📋 Found ${customersWithoutSeq.length} customers without sequence numbers`);
    
    if (customersWithoutSeq.length === 0) {
      console.log('✅ All customers already have sequence numbers!');
      return;
    }
    
    // หา sequence number สูงสุดที่มีอยู่
    const maxSeqCustomer = await customers.findOne(
      { sequenceNumber: { $exists: true, $ne: null, $ne: 0 } },
      { sort: { sequenceNumber: -1 } }
    );
    
    let currentSeq = maxSeqCustomer ? maxSeqCustomer.sequenceNumber : 0;
    console.log(`🔢 Starting sequence from: ${currentSeq + 1}`);
    
    // อัพเดทข้อมูลทีละรายการ
    for (const customer of customersWithoutSeq) {
      currentSeq++;
      
      await customers.updateOne(
        { _id: customer._id },
        { $set: { sequenceNumber: currentSeq } }
      );
      
      console.log(`✅ Updated ${customer.licensePlate} with sequence number: ${String(currentSeq).padStart(6, '0')}`);
    }
    
    // อัพเดท counter ให้เป็นค่าล่าสุด
    await counters.updateOne(
      { _id: 'customerId' },
      { $set: { sequence: currentSeq } },
      { upsert: true }
    );
    
    console.log(`\n🎉 Successfully added sequence numbers to ${customersWithoutSeq.length} customers!`);
    console.log(`📊 Counter set to: ${currentSeq}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔒 MongoDB connection closed');
  }
}

// Run the script
addSequenceNumbers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

