// src/app/api/notification-status/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET - ดึงสถานะการแจ้งเตือนทั้งหมด
export async function GET() {
  try {
    const db = await getDatabase();
    
    // ดึงข้อมูลสถานะการแจ้งเตือนทั้งหมด
    const statuses = await db.collection('notification_status')
      .find({})
      .toArray();
    
    // แปลงเป็น object map { licensePlate: { sent: boolean, sentAt: string } }
    const statusMap: { [key: string]: { sent: boolean; sentAt: string } } = {};
    statuses.forEach(status => {
      statusMap[status.licensePlate] = {
        sent: status.sent,
        sentAt: status.sentAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    console.error('❌ Error fetching notification status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notification status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - บันทึกสถานะการส่งข้อความ
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { licensePlate, sent, sentAt } = body;
    
    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'licensePlate is required' },
        { status: 400 }
      );
    }
    
    // อัปเดตหรือสร้างสถานะการส่ง
    await db.collection('notification_status').updateOne(
      { licensePlate },
      {
        $set: {
          licensePlate,
          sent: sent !== false, // default เป็น true
          sentAt: sentAt || new Date().toISOString(),
          updatedAt: new Date()
        }
      },
      { upsert: true } // สร้างใหม่ถ้าไม่มี
    );
    
    console.log('✅ Notification status saved:', licensePlate);
    
    return NextResponse.json({
      success: true,
      message: 'Notification status saved'
    });
  } catch (error) {
    console.error('❌ Error saving notification status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save notification status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบสถานะการส่งข้อความ
export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { licensePlate } = body;
    
    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'licensePlate is required' },
        { status: 400 }
      );
    }
    
    // ลบสถานะการส่ง
    const result = await db.collection('notification_status').deleteOne({
      licensePlate
    });
    
    console.log('✅ Notification status deleted:', licensePlate);
    
    return NextResponse.json({
      success: true,
      message: 'Notification status deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting notification status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete notification status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

