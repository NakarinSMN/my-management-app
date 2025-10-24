// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET: ดึงข้อมูลลูกค้าทั้งหมด
export async function GET() {
  try {
    const db = await getDatabase();
    const customers = db.collection('customers');
    
    const data = await customers.find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data.length 
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มลูกค้าใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    
    const newCustomer = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await customers.insertOne(newCustomer);
    
    return NextResponse.json({ 
      success: true, 
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error adding customer:', error);
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
    
    const result = await customers.updateOne(
      { licensePlate: originalLicensePlate },
      { 
        $set: {
          ...updateData,
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ' 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลลูกค้า
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('licensePlate');
    
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
