// src/app/api/installment-insurance/update-paid-date/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION_NAME = 'installment_insurance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequenceNumber, installmentNumber, paidDate, amount } = body;

    if (!sequenceNumber || !installmentNumber || !paidDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

      // สร้าง update object
      const updateFields: Record<string, string | number> = {
        [`paidDates.${installmentNumber}`]: paidDate,
        updatedAt: new Date().toISOString()
      };

      // ถ้ามีการระบุจำนวนเงิน ให้บันทึกด้วย
      if (amount !== undefined && amount !== null) {
        updateFields[`installmentAmounts.${installmentNumber}`] = parseFloat(amount);
      }

    // อัปเดตวันที่จ่ายและจำนวนเงิน (ถ้ามี) ของงวดนั้นๆ
    const result = await collection.updateOne(
      { sequenceNumber: parseInt(sequenceNumber) },
      { $set: updateFields }
    );

    console.log(`✅ [POST /api/installment-insurance/update-paid-date] Updated installment ${installmentNumber}`);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update paid date';
    console.error('❌ [POST /api/installment-insurance/update-paid-date] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

