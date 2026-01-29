import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const stats: any = await db.stats();

    return NextResponse.json({
      success: true,
      data: {
        dbName: db.databaseName,
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
        avgObjSize: stats.avgObjSize,
      },
    });
  } catch (error) {
    console.error('❌ [DB Usage] Error fetching database stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch database usage',
      },
      { status: 500 },
    );
  }
}

