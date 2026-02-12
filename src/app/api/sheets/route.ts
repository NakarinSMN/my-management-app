import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Sheet from '@/models/Sheet';

export async function GET() {
  try {
    await connectMongoDB();
    const sheets = await Sheet.find({});
    return NextResponse.json(sheets);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, url, desc } = await request.json();
    await connectMongoDB();
    
    const newSheet = await Sheet.create({
      name: title,
      url,
      description: desc
    });

    return NextResponse.json(newSheet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // รับ id จาก URL เช่น /api/sheets?id=xxx

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await connectMongoDB();
    await Sheet.findByIdAndDelete(id);

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}