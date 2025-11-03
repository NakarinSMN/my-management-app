// src/app/api/daily-notifications/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET - ดึงรายการแจ้งเตือนของวันนี้
export async function GET() {
  try {
    console.log('📥 [GET] Fetching daily notifications...');
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // ค้นหารายการของวันนี้
    const dailyNotification = await db.collection('daily_notifications').findOne({
      date: today
    });
    
    console.log('✅ [GET] Daily notifications fetched:', dailyNotification ? 'Found' : 'Not found');
    
    return NextResponse.json({
      success: true,
      data: dailyNotification,
      date: today
    });
  } catch (error) {
    console.error('❌ [GET] Error fetching daily notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - สร้างรายการแจ้งเตือนใหม่สำหรับวันนี้
export async function POST(request: Request) {
  try {
    console.log('📤 [POST] Saving daily notifications...');
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const body = await request.json();
    const { licensePlates, forceRefresh } = body;
    
    console.log('📝 [POST] Body:', { forceRefresh, licensePlatesCount: licensePlates?.length || 0 });
    
    // ถ้าเป็น forceRefresh ให้ลบรายการเก่าและสร้างใหม่
    if (forceRefresh) {
      console.log('🔄 [POST] Force refresh - deleting old data...');
      const deleteResult = await db.collection('daily_notifications').deleteOne({ date: today });
      console.log('✅ [POST] Deleted:', deleteResult.deletedCount);
      
      return NextResponse.json({
        success: true,
        message: 'Force refresh completed - please reload the page',
        date: today,
        count: 0
      });
    }
    
    if (!licensePlates || !Array.isArray(licensePlates)) {
      console.log('❌ [POST] Invalid licensePlates data');
      return NextResponse.json(
        { success: false, error: 'Invalid licensePlates data' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่ามีรายการของวันนี้อยู่แล้วหรือไม่
    const existing = await db.collection('daily_notifications').findOne({
      date: today
    });
    
    if (existing) {
      console.log('📝 [POST] Updating existing record...');
      // อัปเดตรายการที่มีอยู่
      await db.collection('daily_notifications').updateOne(
        { date: today },
        {
          $set: {
            licensePlates,
            updatedAt: new Date()
          }
        }
      );
    } else {
      console.log('➕ [POST] Creating new record...');
      // สร้างรายการใหม่
      await db.collection('daily_notifications').insertOne({
        date: today,
        licensePlates,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('✅ [POST] Daily notifications saved successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Daily notifications saved',
      date: today,
      count: licensePlates.length
    });
  } catch (error) {
    console.error('❌ [POST] Error saving daily notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save daily notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบรายการที่ส่งแล้วออกจากรายการวันนี้
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ [DELETE] Removing from daily notifications...');
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const body = await request.json();
    const { licensePlate } = body;
    
    if (!licensePlate) {
      console.log('❌ [DELETE] licensePlate is required');
      return NextResponse.json(
        { success: false, error: 'licensePlate is required' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [DELETE] Removing license plate:', licensePlate);
    
    // ลบทะเบียนรถออกจาก array
    const result = await db.collection('daily_notifications').updateOne(
      { date: today },
      {
        $pull: { licensePlates: licensePlate },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log('✅ [DELETE] Removed successfully. Modified:', result.modifiedCount);
    
    return NextResponse.json({
      success: true,
      message: 'License plate removed from today\'s notifications'
    });
  } catch (error) {
    console.error('❌ [DELETE] Error removing from daily notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove from daily notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

