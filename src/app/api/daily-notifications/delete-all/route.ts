// src/app/api/daily-notifications/delete-all/route.ts
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// DELETE - ลบรายการแจ้งเตือนทั้งหมด (สำหรับ DevTool)
export async function DELETE() {
  try {
    console.log('🗑️ [DELETE-ALL] Deleting all daily notifications...');
    const db = await getDatabase();
    
    // ลบทุกเอกสารใน collection
    const result = await db.collection('daily_notifications').deleteMany({});
    
    console.log('✅ [DELETE-ALL] Deleted successfully:', result.deletedCount);
    
    return NextResponse.json({
      success: true,
      message: 'Deleted all daily notifications',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ [DELETE-ALL] Error deleting all notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete all notifications',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

