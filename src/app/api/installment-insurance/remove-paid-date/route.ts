// src/app/api/installment-insurance/remove-paid-date/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION_NAME = 'installment_insurance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequenceNumber, installmentNumber } = body;

    if (!sequenceNumber || !installmentNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // ลบวันที่จ่ายและจำนวนเงินของงวดนั้นๆ
    const result = await collection.updateOne(
      { sequenceNumber: parseInt(sequenceNumber) },
      {
        $unset: {
          [`paidDates.${installmentNumber}`]: "",
          [`installmentAmounts.${installmentNumber}`]: ""
        },
        $set: {
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log(`✅ [POST /api/installment-insurance/remove-paid-date] Removed installment ${installmentNumber} paid date`);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove paid date';
    console.error('❌ [POST /api/installment-insurance/remove-paid-date] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

