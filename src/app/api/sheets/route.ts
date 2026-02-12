import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Sheet from '@/models/Sheet';

export async function GET() {
  try {
    await connectMongoDB();
    const sheets = await Sheet.find({});
    return NextResponse.json(sheets);
  } catch (error) {
    // แก้ไข: เช็คประเภท error เพื่อดึง message ออกมาอย่างปลอดภัย
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, desc } = body;
    
    await connectMongoDB();
    
    const newSheet = await Sheet.create({
      name: title,
      url,
      description: desc
    });

    return NextResponse.json(newSheet, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await connectMongoDB();
    await Sheet.findByIdAndDelete(id);

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}