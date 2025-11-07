// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET: ดึงข้อมูลลูกค้าทั้งหมด (เร็วขึ้น)
export async function GET() {
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
        licensePlate: 1,
        brand: 1,
        customerName: 1,
        phone: 1,
        registerDate: 1,
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
  try {
    const body = await request.json();
    console.log('📝 [Customers API] Adding new customer:', body);
    
    const db = await getDatabase();
    const customers = db.collection('customers');
    
    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่
    const existingCustomer = await customers.findOne({ 
      licensePlate: body.licensePlate 
    });
    
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'ทะเบียนรถนี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    const newCustomer = {
      licensePlate: body.licensePlate,
      brand: body.brand || '',
      customerName: body.customerName,
      phone: body.phone,
      registerDate: body.registerDate,
      vehicleType: body.vehicleType || '',
      status: body.status || 'รอดำเนินการ',
      note: body.note || '',
      tags: body.tags || [],
      createdAt: now,
      updatedAt: now
    };
    
    console.log('💾 [Customers API] Saving customer with timestamps:', {
      ...newCustomer,
      createdAt: newCustomer.createdAt.toISOString(),
      updatedAt: newCustomer.updatedAt.toISOString()
    });
    
    const result = await customers.insertOne(newCustomer);
    
    console.log('✅ [Customers API] Customer added successfully with ID:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ',
      id: result.insertedId,
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
  try {
    const body = await request.json();
    console.log('🔄 [Customers API] Updating customer:', body);
    
    const db = await getDatabase();
    const customers = db.collection('customers');
    
    const { originalLicensePlate, ...updateData } = body;
    
    // ตรวจสอบว่าทะเบียนรถใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยนทะเบียน)
    if (updateData.licensePlate !== originalLicensePlate) {
      const existingCustomer = await customers.findOne({ 
        licensePlate: updateData.licensePlate 
      });
      
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'ทะเบียนรถใหม่นี้มีอยู่แล้วในระบบ' },
          { status: 400 }
        );
      }
    }
    
    // หาข้อมูลเดิมเพื่อเก็บ createdAt
    const existingData = await customers.findOne({ licensePlate: originalLicensePlate });
    
    const result = await customers.updateOne(
      { licensePlate: originalLicensePlate },
      { 
        $set: {
          licensePlate: updateData.licensePlate,
          brand: updateData.brand || '',
          customerName: updateData.customerName,
          phone: updateData.phone,
          registerDate: updateData.registerDate,
          vehicleType: updateData.vehicleType || '',
          status: updateData.status,
          note: updateData.note || '',
          tags: updateData.tags || [],
          createdAt: existingData?.createdAt || new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }
    
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
