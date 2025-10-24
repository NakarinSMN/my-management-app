// src/app/api/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET: ดึงข้อมูลบิลทั้งหมด
export async function GET() {
  try {
    const db = await getDatabase();
    const billing = db.collection('billing');
    
    const data = await billing.find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data.length 
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มบิลใหม่
export async function POST(request: NextRequest) {
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
