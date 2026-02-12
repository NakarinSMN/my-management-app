// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Db } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/api-auth';

// Interface สำหรับ Counter Document
interface CounterDocument {
  _id: string;
  sequence: number;
}

// ฟังก์ชันสร้างเลขลำดับอัตโนมัติ (Auto Increment)
async function getNextSequenceNumber(db: Db): Promise<number> {
  const counters = db.collection<CounterDocument>('counters');

  const result = await counters.findOneAndUpdate(
    { _id: 'customerId' },
    { $inc: { sequence: 1 } },
    {
      upsert: true,
      returnDocument: 'after'
    }
  );

  return result?.sequence || 1;
}

// GET: ดึงข้อมูลลูกค้าทั้งหมด หรือค้นหาตามทะเบียน
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 [Customers API] Starting MongoDB connection...');
    console.log('🔍 [Customers API] Environment check:', {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasMongoDb: !!process.env.MONGODB_DATABASE,
      nodeEnv: process.env.NODE_ENV
    });

    const db = await getDatabase();
    console.log('✅ [Customers API] MongoDB connected successfully');

    const customers = db.collection('customers');

    // เช็คว่ามี query parameter licensePlate หรือไม่
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('licensePlate');

    if (licensePlate) {
      // ค้นหาตามทะเบียน
      console.log('🔍 [Customers API] Searching for license plate:', licensePlate);
      const data = await customers.find(
        { licensePlate: licensePlate },
        {
          projection: {
            _id: 0,
            sequenceNumber: 1,
            licensePlate: 1,
            brand: 1,
            customerName: 1,
            phone: 1,
            registerDate: 1,
            inspectionDate: 1,
            vehicleType: 1,
            status: 1,
            note: 1,
            tags: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ).toArray();

      const duration = Date.now() - startTime;
      console.log(`✅ [Customers API] Found ${data.length} customers with plate ${licensePlate} in ${duration}ms`);

      return NextResponse.json({
        success: true,
        data: data,
        count: data.length,
        duration: duration
      });
    }
    console.log('🔍 [Customers API] Fetching customers from collection...');

    // ตรวจสอบว่า collection มีอยู่หรือไม่
    const collections = await db.listCollections({ name: 'customers' }).toArray();
    console.log('🔍 [Customers API] Collections found:', collections.length);

    if (collections.length === 0) {
      console.warn('⚠️ [Customers API] Collection "customers" not found, creating empty result');
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Collection "customers" not found. Please create the collection in MongoDB Atlas.'
      });
    }

    // ใช้ projection เพื่อลดข้อมูลที่ส่ง
    const data = await customers.find({}, {
      projection: {
        _id: 0, // ไม่ส่ง _id
        sequenceNumber: 1,
        licensePlate: 1,
        brand: 1,
        customerName: 1,
        phone: 1,
        registerDate: 1,
        inspectionDate: 1,
        vehicleType: 1,
        status: 1,
        note: 1,
        tags: 1,
        userId: 1,
        day: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }).toArray();

    const duration = Date.now() - startTime;
    console.log(`✅ [Customers API] Successfully fetched ${data.length} customers in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length,
      duration: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Customers API] Error fetching customers:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: duration
    });

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = errorMessage.includes('connection') ||
      errorMessage.includes('SSL') ||
      errorMessage.includes('TLS') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNREFUSED');

    return NextResponse.json(
      {
        success: false,
        error: isConnectionError
          ? 'MongoDB connection failed. Please check your connection string and network access.'
          : 'Failed to fetch customers',
        details: errorMessage,
        duration: duration
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มลูกค้าใหม่
export async function POST(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const body = await request.json();
    console.log('📝 [Customers API] Adding new customer:', body);

    const db = await getDatabase();
    const customers = db.collection('customers');

    // ตรวจสอบว่าทะเบียนรถซ้ำกับประเภทรถเดียวกันหรือไม่
    // หากไม่มีประเภทรถ (ข้อมูลเก่า) ให้เช็คเฉพาะทะเบียน
    // หากมีประเภทรถ ให้เช็คทั้งทะเบียนและประเภท
    const newVehicleType = body.vehicleType || '';

    // หาทะเบียนที่ซ้ำทั้งหมด
    const duplicates = await customers.find({
      licensePlate: body.licensePlate
    }).toArray();

    // เช็คว่ามีทะเบียนซ้ำกับประเภทเดียวกันหรือไม่
    const existingCustomer = duplicates.find((doc: any) => {
      const existingType = doc.vehicleType || '';
      return existingType === newVehicleType;
    });
    if (existingCustomer) {
      const sequenceStr = existingCustomer.sequenceNumber
        ? String(existingCustomer.sequenceNumber).padStart(6, '0')
        : 'ไม่ทราบ';

      return NextResponse.json(
        {
          success: false,
          error: `ทะเบียนรถ ${body.licensePlate} ประเภท "${body.vehicleType || 'ไม่ระบุ'}" มีอยู่แล้วในระบบ\n\nซ้ำกับเลขลำดับ: ${sequenceStr}\nชื่อลูกค้า: ${existingCustomer.customerName}`,
          duplicateSequence: existingCustomer.sequenceNumber
        },
        { status: 400 }
      );
    }

    // แจ้งเตือนว่ามีทะเบียนซ้ำ (แต่ต่างประเภท)
    if (duplicates.length > 0) {
      console.log(`⚠️ [Customers API] Duplicate license plate found, but different vehicle type. Allowing...`);
      duplicates.forEach(dup => {
        console.log(`   - Existing: ${dup.licensePlate} (${dup.vehicleType || 'ไม่ระบุ'}) - Seq: ${dup.sequenceNumber}`);
      });
      console.log(`   - New: ${body.licensePlate} (${body.vehicleType || 'ไม่ระบุ'})`);
    }

    // สร้างเลขลำดับอัตโนมัติ (Auto Increment)
    const sequenceNumber = await getNextSequenceNumber(db);
    console.log('🔢 [Customers API] Generated sequence number:', sequenceNumber);

    const now = new Date();
    const newCustomer = {
      sequenceNumber: sequenceNumber,
      licensePlate: body.licensePlate,
      brand: body.brand || '',
      customerName: body.customerName,
      phone: body.phone,
      registerDate: body.registerDate,
      inspectionDate: body.inspectionDate || '',
      vehicleType: body.vehicleType || '',
      status: body.status || 'รอดำเนินการ',
      note: body.note || '',
      tags: body.tags || [],
      createdAt: now,
      updatedAt: now
    };

    console.log('💾 [Customers API] Saving customer with sequence number:', {
      sequenceNumber: newCustomer.sequenceNumber,
      licensePlate: newCustomer.licensePlate,
      createdAt: newCustomer.createdAt.toISOString(),
      updatedAt: newCustomer.updatedAt.toISOString()
    });

    const result = await customers.insertOne(newCustomer);

    console.log('✅ [Customers API] Customer added successfully with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ',
      id: result.insertedId,
      sequenceNumber: sequenceNumber,
      data: newCustomer
    });
  } catch (error) {
    console.error('❌ [Customers API] Error adding customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add customer' },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลลูกค้า
export async function PUT(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const body = await request.json();
    console.log('🔄 [Customers API] Updating customer:', body);

    const db = await getDatabase();
    const customers = db.collection('customers');

    const { originalLicensePlate, originalVehicleType, ...updateData } = body;

    // หาข้อมูลเดิม
    const originalCustomer = await customers.findOne({
      licensePlate: originalLicensePlate,
      vehicleType: originalVehicleType || ''
    });

    if (!originalCustomer) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าทะเบียนรถใหม่และประเภทรถใหม่ซ้ำกับข้อมูลอื่นหรือไม่
    const isDifferent = updateData.licensePlate !== originalLicensePlate ||
      (updateData.vehicleType || '') !== (originalVehicleType || '');

    if (isDifferent) {
      const newVehicleType = updateData.vehicleType || '';

      // หาทะเบียนที่ซ้ำทั้งหมด (ยกเว้นตัวเอง)
      const duplicates = await customers.find({
        licensePlate: updateData.licensePlate,
        _id: { $ne: originalCustomer._id }
      }).toArray();

      // เช็คว่ามีทะเบียนซ้ำกับประเภทเดียวกันหรือไม่
      const existingCustomer = duplicates.find(doc => {
        const existingType = doc.vehicleType || '';
        return existingType === newVehicleType;
      });

      if (existingCustomer) {
        const sequenceStr = existingCustomer.sequenceNumber
          ? String(existingCustomer.sequenceNumber).padStart(6, '0')
          : 'ไม่ทราบ';

        return NextResponse.json(
          {
            success: false,
            error: `ทะเบียนรถ ${updateData.licensePlate} ประเภท "${updateData.vehicleType || 'ไม่ระบุ'}" มีอยู่แล้วในระบบ\n\nซ้ำกับเลขลำดับ: ${sequenceStr}\nชื่อลูกค้า: ${existingCustomer.customerName}`,
            duplicateSequence: existingCustomer.sequenceNumber
          },
          { status: 400 }
        );
      }

      // แจ้งเตือนว่ามีทะเบียนซ้ำ (แต่ต่างประเภท)
      if (duplicates.length > 0) {
        console.log(`⚠️ [Customers API] Duplicate license plate found during update, but different vehicle type. Allowing...`);
      }
    }

    await customers.updateOne(
      { _id: originalCustomer._id },
      {
        $set: {
          licensePlate: updateData.licensePlate,
          brand: updateData.brand || '',
          customerName: updateData.customerName,
          phone: updateData.phone,
          registerDate: updateData.registerDate,
          inspectionDate: updateData.inspectionDate || '',
          vehicleType: updateData.vehicleType || '',
          status: updateData.status,
          note: updateData.note || '',
          tags: updateData.tags || [],
          sequenceNumber: originalCustomer.sequenceNumber || 0, // เก็บเลขลำดับเดิม
          createdAt: originalCustomer.createdAt || new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ [Customers API] Customer updated successfully');

    return NextResponse.json({
      success: true,
      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ'
    });
  } catch (error) {
    console.error('❌ [Customers API] Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลลูกค้า
export async function DELETE(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const body = await request.json();
    const { licensePlate } = body;

    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'License plate is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const customers = db.collection('customers');

    const result = await customers.deleteOne({ licensePlate });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลลูกค้าสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
