require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;

if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
}
if (!dbName) {
    console.error('❌ MONGODB_DATABASE is not defined in .env.local');
    process.exit(1);
}

async function deleteTestData() {
    console.log('🚀 เริ่มต้นการลบข้อมูลทดสอบ');
    const client = new MongoClient(uri);

    try {
        console.log('🔗 เชื่อมต่อกับ MongoDB...');
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('customers');
        console.log('✅ เชื่อมต่อสำเร็จ!');

        // ค้นหาข้อมูลทดสอบที่มี note หรือ licensePlate ที่บ่งบอกว่าเป็นข้อมูลทดสอบ
        const query = {
            $or: [
                { note: /ข้อมูลทดสอบ/i },
                { licensePlate: /^ทดสอบ/i }
            ]
        };

        // นับจำนวนข้อมูลที่จะลบ
        const count = await collection.countDocuments(query);
        console.log(`📊 พบข้อมูลทดสอบที่จะลบ: ${count} รายการ`);

        if (count === 0) {
            console.log('✅ ไม่พบข้อมูลทดสอบที่ต้องลบ');
            return;
        }

        // แสดงตัวอย่างข้อมูลที่จะลบ
        console.log('\n📋 ตัวอย่างข้อมูลที่จะลบ (5 รายการแรก):');
        const samples = await collection.find(query).limit(5).toArray();
        samples.forEach((doc, i) => {
            console.log(`${i + 1}. ${doc.licensePlate} - ${doc.customerName}`);
            console.log(`   - ประเภทรถ: ${doc.vehicleType}`);
            console.log(`   - วันที่ตรวจ: ${doc.inspectionDate || 'ไม่มี'}`);
            console.log(`   - หมายเหตุ: ${doc.note || 'ไม่มี'}`);
        });

        console.log('\n🗑️  กำลังลบข้อมูล...');
        const result = await collection.deleteMany(query);

        console.log('✅ ลบข้อมูลสำเร็จ!');
        console.log(`   - จำนวนที่ลบ: ${result.deletedCount} รายการ`);

        // แสดงจำนวนข้อมูลที่เหลือ
        const remainingCount = await collection.countDocuments({});
        console.log(`\n📊 จำนวนข้อมูลที่เหลือในระบบ: ${remainingCount} รายการ`);

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        await client.close();
        console.log('✅ ปิดการเชื่อมต่อแล้ว');
    }
    console.log('\n🎉 เสร็จสิ้น!');
}

deleteTestData();

