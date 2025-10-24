// src/app/api/debug-mongodb/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test } = body;

    console.log('🔍 [Debug MongoDB] Starting test:', test);

    switch (test) {
      case 'environment':
        const mongoUri = process.env.MONGODB_URI;
        const mongoDb = process.env.MONGODB_DATABASE;
        
        if (!mongoUri || !mongoDb) {
          return NextResponse.json({
            success: false,
            error: '❌ Environment Variables ไม่พบ',
            details: `MONGODB_URI: ${mongoUri ? '✅ ตั้งค่าแล้ว' : '❌ ไม่พบ'}\nMONGODB_DATABASE: ${mongoDb ? '✅ ตั้งค่าแล้ว' : '❌ ไม่พบ'}`
          });
        }
        
        return NextResponse.json({
          success: true,
          message: '✅ Environment Variables พบแล้ว',
          details: `MONGODB_URI: ${mongoUri.substring(0, 50)}...\nMONGODB_DATABASE: ${mongoDb}`
        });

      case 'uri_format':
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          return NextResponse.json({
            success: false,
            error: '❌ MONGODB_URI ไม่พบ',
            details: 'กรุณาตั้งค่า MONGODB_URI ใน environment variables'
          });
        }
        
        const isValidFormat = uri.startsWith('mongodb+srv://') && uri.includes('@') && uri.includes('.mongodb.net');
        if (!isValidFormat) {
          return NextResponse.json({
            success: false,
            error: '❌ MongoDB URI Format ไม่ถูกต้อง',
            details: 'URI ต้องเริ่มต้นด้วย mongodb+srv:// และมี @ และ .mongodb.net'
          });
        }
        
        return NextResponse.json({
          success: true,
          message: '✅ MongoDB URI Format ถูกต้อง',
          details: `URI: ${uri.substring(0, 50)}...`
        });

      case 'network':
        try {
          const db = await getDatabase();
          await db.admin().ping();
          
          return NextResponse.json({
            success: true,
            message: '✅ Network connectivity สำเร็จ - เชื่อมต่อ MongoDB Atlas ได้',
            details: {
              database: db.databaseName,
              collections: await db.listCollections().toArray()
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: '❌ Network connectivity ล้มเหลว',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'auth':
        try {
          const db = await getDatabase();
          const collections = await db.listCollections().toArray();
          
          return NextResponse.json({
            success: true,
            message: '✅ Authentication สำเร็จ - ยืนยันตัวตนได้',
            details: {
              database: db.databaseName,
              collectionsCount: collections.length
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: '❌ Authentication ล้มเหลว',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'database':
        try {
          const db = await getDatabase();
          const collections = await db.listCollections().toArray();
          
          // ตรวจสอบ collections ที่ต้องการ
          const customersExists = collections.some(c => c.name === 'customers');
          const billingExists = collections.some(c => c.name === 'billing');
          
          return NextResponse.json({
            success: true,
            message: '✅ Database access สำเร็จ - เข้าถึง database ได้',
            details: {
              database: db.databaseName,
              collections: collections.map(c => c.name),
              customersExists,
              billingExists
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: '❌ Database access ล้มเหลว',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: '❌ Test ไม่รู้จัก',
          details: 'Unknown test type'
        });
    }
  } catch (error) {
    console.error('❌ [Debug MongoDB] Error:', error);
    return NextResponse.json({
      success: false,
      error: '❌ เกิดข้อผิดพลาดในการทดสอบ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}