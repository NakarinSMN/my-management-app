// src/app/api/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/api-auth';

// GET: ดึงข้อมูลบิลทั้งหมด (เร็วขึ้น)
export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [Billing API] Starting MongoDB connection...');
    console.log('🔍 [Billing API] Environment check:', {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasMongoDb: !!process.env.MONGODB_DATABASE,
      nodeEnv: process.env.NODE_ENV
    });
    
    const db = await getDatabase();
    console.log('✅ [Billing API] MongoDB connected successfully');
    
    const billing = db.collection('billing');
    console.log('🔍 [Billing API] Fetching billing from collection...');
    
    // ตรวจสอบว่า collection มีอยู่หรือไม่
    const collections = await db.listCollections({ name: 'billing' }).toArray();
    console.log('🔍 [Billing API] Collections found:', collections.length);
    
    if (collections.length === 0) {
      console.warn('⚠️ [Billing API] Collection "billing" not found, creating empty result');
      return NextResponse.json({ 
        success: true, 
        data: [],
        count: 0,
        message: 'Collection "billing" not found. Please create the collection in MongoDB Atlas.'
      });
    }
    
    // ใช้ projection เพื่อลดข้อมูลที่ส่ง
    const data = await billing.find({}, {
      projection: {
        _id: 0, // ไม่ส่ง _id
        billNumber: 1,
        customerName: 1,
        service: 1,
        category: 1,
        price: 1,
        date: 1,
        phone: 1,
        status: 1,
        items: 1
      }
    }).toArray();
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Billing API] Successfully fetched ${data.length} billing records in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data.length,
      duration: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Billing API] Error fetching billing:', {
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
          : 'Failed to fetch billing data',
        details: errorMessage,
        duration: duration
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มบิลใหม่
export async function POST(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const body = await request.json();
    const db = await getDatabase();
    const billing = db.collection('billing');
    
    // ตรวจสอบว่าเลขที่บิลซ้ำหรือไม่
    const existingBill = await billing.findOne({ 
      billNumber: body.billNumber 
    });
    
    if (existingBill) {
      return NextResponse.json(
        { success: false, error: 'เลขที่บิลนี้มีอยู่แล้วในระบบ' },
        { status: 400 }
      );
    }
    
    const newBill = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await billing.insertOne(newBill);
    
    return NextResponse.json({ 
      success: true, 
      message: 'เพิ่มข้อมูลบิลสำเร็จ',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error adding bill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add bill' },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลบิล
export async function PUT(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const body = await request.json();
    const db = await getDatabase();
    const billing = db.collection('billing');
    
    const { originalBillNumber, ...updateData } = body;
    
    // ตรวจสอบว่าเลขที่บิลใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยนเลขที่บิล)
    if (updateData.billNumber !== originalBillNumber) {
      const existingBill = await billing.findOne({ 
        billNumber: updateData.billNumber 
      });
      
      if (existingBill) {
        return NextResponse.json(
          { success: false, error: 'เลขที่บิลใหม่นี้มีอยู่แล้วในระบบ' },
          { status: 400 }
        );
      }
    }
    
    const result = await billing.updateOne(
      { billNumber: originalBillNumber },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลบิลที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'แก้ไขข้อมูลบิลสำเร็จ' 
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลบิล
export async function DELETE(request: NextRequest) {
  // Check authentication
  const authSession = await requireAuth();
  if (authSession instanceof NextResponse) {
    return authSession; // Return error response
  }

  try {
    const { searchParams } = new URL(request.url);
    const billNumber = searchParams.get('billNumber');
    
    if (!billNumber) {
      return NextResponse.json(
        { success: false, error: 'Bill number is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const billing = db.collection('billing');
    
    const result = await billing.deleteOne({ billNumber });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลบิลที่ต้องการลบ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'ลบข้อมูลบิลสำเร็จ' 
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}
