// src/app/api/notification-status/import/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// POST - Import รายการที่ส่งแล้วจากไฟล์ข้อความ
export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const body = await request.json();
    const { textData } = body;
    
    if (!textData || typeof textData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'textData is required' },
        { status: 400 }
      );
    }
    
    // แยกข้อมูลเป็นบรรทัด
    const lines = textData.split('\n').filter((line: string) => line.trim() !== '');
    
    const importedItems: { licensePlate: string; sent: boolean; sentAt: string }[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // ข้ามบรรทัดว่างหรือบรรทัดที่ไม่มีข้อมูล
      if (!line) {
        i++;
        continue;
      }
      
      // แยกข้อมูลด้วย tab
      const parts = line.split('\t');
      
      if (parts.length >= 8) {
        const licensePlate = parts[0].trim();
        const sentStatus = parts[7].trim();
        
        // ตรวจสอบว่าส่งแล้วหรือไม่
        if (sentStatus.startsWith('ส่งแล้ว')) {
          // ดึงวันเวลาที่ส่งจากบรรทัดถัดไป (ถ้ามี)
          let sentAt = new Date().toISOString();
          
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            // ตรวจสอบว่าบรรทัดถัดไปเป็นวันเวลาหรือไม่ (รูปแบบ: (03/11 10:30))
            const timeMatch = nextLine.match(/\((\d{2}\/\d{2})\s+(\d{2}:\d{2})\)/);
            if (timeMatch) {
              // แปลงเป็น ISO string โดยใช้ปีปัจจุบัน
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [_match, dateStr, timeStr] = timeMatch;
              const [day, month] = dateStr.split('/');
              const [hour, minute] = timeStr.split(':');
              const currentYear = new Date().getFullYear();
              
              // สร้าง Date object (เดือนใน JS เริ่มที่ 0)
              const dateObj = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
              sentAt = dateObj.toISOString();
              
              i++; // ข้ามบรรทัดวันเวลา
            }
          }
          
          importedItems.push({
            licensePlate,
            sent: true,
            sentAt
          });
        }
      }
      
      i++;
    }
    
    // บันทึกลง MongoDB
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of importedItems) {
      try {
        await db.collection('notification_status').updateOne(
          { licensePlate: item.licensePlate },
          {
            $set: {
              licensePlate: item.licensePlate,
              sent: item.sent,
              sentAt: item.sentAt,
              updatedAt: new Date(),
              importedAt: new Date() // เพิ่ม flag เพื่อระบุว่าเป็นข้อมูล import
            }
          },
          { upsert: true }
        );
        successCount++;
      } catch (error) {
        console.error(`Error importing ${item.licensePlate}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Import completed: ${successCount} success, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: 'Import completed',
      imported: successCount,
      errors: errorCount,
      total: importedItems.length
    });
  } catch (error) {
    console.error('❌ Error importing notification status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import notification status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

