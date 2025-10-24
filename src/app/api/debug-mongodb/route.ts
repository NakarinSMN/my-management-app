// src/app/api/debug-mongodb/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'tax_management';

if (!uri) {
  console.error('MONGODB_URI is not defined');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test } = body;

    if (!uri) {
      return NextResponse.json({
        success: false,
        error: 'MONGODB_URI is not defined in environment variables'
      });
    }

    switch (test) {
      case 'network':
        // ทดสอบการเชื่อมต่อ network
        try {
          const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
          });
          
          await client.connect();
          await client.db('admin').admin().ping();
          await client.close();
          
          return NextResponse.json({
            success: true,
            message: 'Network connection successful'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Network connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }

      case 'auth':
        // ทดสอบการยืนยันตัวตน
        try {
          const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
          });
          
          await client.connect();
          await client.db(dbName).admin().ping();
          await client.close();
          
          return NextResponse.json({
            success: true,
            message: 'Authentication successful'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }

      case 'database':
        // ทดสอบการเข้าถึง database
        try {
          const client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
          });
          
          await client.connect();
          const db = client.db(dbName);
          
          // ทดสอบการเข้าถึง collections
          const collections = await db.listCollections().toArray();
          await client.close();
          
          return NextResponse.json({
            success: true,
            message: `Database access successful. Found ${collections.length} collections.`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `Database access failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown test type'
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Debug test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
