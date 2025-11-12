// src/app/api/installment-insurance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION_NAME = 'installment_insurance';

// GET: ดึงข้อมูลผ่อนประกันทั้งหมด หรือค้นหาตามทะเบียน
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('licensePlate');
    
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // ถ้ามีการระบุทะเบียน ให้ค้นหาแค่ทะเบียนนั้น
    const query = licensePlate ? { licensePlate: licensePlate } : {};
    const data = await collection.find(query).sort({ sequenceNumber: -1 }).toArray();

    console.log(`✅ [GET /api/installment-insurance] Found ${data.length} records${licensePlate ? ` for plate: ${licensePlate}` : ''}`);

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installment insurance data';
    console.error('❌ [GET /api/installment-insurance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มข้อมูลผ่อนประกันใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // สร้าง sequenceNumber ใหม่
    const lastRecord = await collection.find({}).sort({ sequenceNumber: -1 }).limit(1).toArray();
    const newSequenceNumber = lastRecord.length > 0 ? (lastRecord[0].sequenceNumber || 0) + 1 : 1;

    const newData = {
      sequenceNumber: newSequenceNumber,
      licensePlate: body.licensePlate,
      vehicleType: body.vehicleType || '',
      brand: body.brand || '',
      customerName: body.customerName,
      phone: body.phone,
      insuranceCompany: body.insuranceCompany,
      insurancePremium: parseFloat(body.insurancePremium) || 0,
      installmentCount: parseInt(body.installmentCount) || 0,
      currentInstallment: parseInt(body.currentInstallment) || 0,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      paymentDay: parseInt(body.paymentDay) || 1,
      paidDates: body.paidDates || {},
      installmentAmounts: body.installmentAmounts || {},
      tags: body.tags || [],
      status: body.status || 'กำลังผ่อน',
      note: body.note || '',
      userId: body.userId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newData);

    console.log(`✅ [POST /api/installment-insurance] Created new record with ID: ${result.insertedId}`);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...newData }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create installment insurance data';
    console.error('❌ [POST /api/installment-insurance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// PUT: แก้ไขข้อมูลผ่อนประกัน
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const updateData = body;

    const result = await collection.updateOne(
      { sequenceNumber: updateData.sequenceNumber || body.sequenceNumber },
      {
        $set: {
          ...updateData,
          insurancePremium: parseFloat(updateData.insurancePremium) || 0,
          installmentCount: parseInt(updateData.installmentCount) || 0,
          currentInstallment: parseInt(updateData.currentInstallment) || 0,
          paymentDay: parseInt(updateData.paymentDay) || 1,
          paidDates: updateData.paidDates || body.paidDates || {},
          installmentAmounts: updateData.installmentAmounts || body.installmentAmounts || {},
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log(`✅ [PUT /api/installment-insurance] Updated record`);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update installment insurance data';
    console.error('❌ [PUT /api/installment-insurance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลผ่อนประกัน
export async function DELETE(request: NextRequest) {
  try {
    // รองรับทั้งแบบ query params และ body
    const { searchParams } = new URL(request.url);
    let sequenceNumber = searchParams.get('sequenceNumber');
    
    // ถ้าไม่มีใน query params ให้ลองอ่านจาก body
    if (!sequenceNumber) {
      const body = await request.json();
      sequenceNumber = body.sequenceNumber?.toString();
    }

    if (!sequenceNumber) {
      return NextResponse.json(
        { success: false, error: 'sequenceNumber is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteOne({ sequenceNumber: parseInt(sequenceNumber) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [DELETE /api/installment-insurance] Deleted record with sequenceNumber: ${sequenceNumber}`);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete installment insurance data';
    console.error('❌ [DELETE /api/installment-insurance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

