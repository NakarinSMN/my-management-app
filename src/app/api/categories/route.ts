import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: ดึงข้อมูลหมวดหมู่ทั้งหมด
export async function GET() {
  try {
    console.log('📥 [Categories API] GET - เริ่มดึงข้อมูลหมวดหมู่');
    
    const db = await getDatabase();
    const categories = db.collection('categories');
    
    const data = await categories.find({}).toArray();
    
    console.log(`✅ [Categories API] GET - ดึงข้อมูลสำเร็จ: ${data.length} หมวดหมู่`);
    
    return NextResponse.json({ 
      success: true, 
      data,
      count: data.length 
    });
  } catch (error) {
    console.error('❌ [Categories API] GET - เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Categories API] POST - เริ่มเพิ่มหมวดหมู่ใหม่');
    
    const body = await request.json();
    const { categoryName, categoryDescription } = body;
    
    if (!categoryName) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const categories = db.collection('categories');
    
    // ตรวจสอบว่ามีหมวดหมู่นี้อยู่แล้วหรือไม่
    const existingCategory = await categories.findOne({ categoryName });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'หมวดหมู่นี้มีอยู่แล้ว' },
        { status: 400 }
      );
    }
    
    const newCategory = {
      categoryName,
      categoryDescription: categoryDescription || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await categories.insertOne(newCategory);
    
    console.log(`✅ [Categories API] POST - เพิ่มหมวดหมู่สำเร็จ: ${result.insertedId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'เพิ่มหมวดหมู่สำเร็จ',
      data: { _id: result.insertedId, ...newCategory }
    });
  } catch (error) {
    console.error('❌ [Categories API] POST - เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add category' },
      { status: 500 }
    );
  }
}

// PUT: แก้ไขหมวดหมู่
export async function PUT(request: NextRequest) {
  try {
    console.log('📥 [Categories API] PUT - เริ่มแก้ไขหมวดหมู่');
    
    const body = await request.json();
    const { _id, categoryName, categoryDescription } = body;
    
    if (!_id || !categoryName) {
      return NextResponse.json(
        { success: false, error: 'Category ID and name are required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const categories = db.collection('categories');
    
    const updateData = {
      categoryName,
      categoryDescription: categoryDescription || '',
      updatedAt: new Date()
    };
    
    const result = await categories.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }
    
    console.log(`✅ [Categories API] PUT - แก้ไขหมวดหมู่สำเร็จ: ${_id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'แก้ไขหมวดหมู่สำเร็จ' 
    });
  } catch (error) {
    console.error('❌ [Categories API] PUT - เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE: ลบหมวดหมู่
export async function DELETE(request: NextRequest) {
  try {
    console.log('📥 [Categories API] DELETE - เริ่มลบหมวดหมู่');
    
    const body = await request.json();
    const { _id } = body;
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const categories = db.collection('categories');
    const services = db.collection('pricing');
    
    // ลบบริการทั้งหมดในหมวดหมู่นี้ก่อน
    const servicesInCategory = await services.countDocuments({ categoryName: body.categoryName });
    if (servicesInCategory > 0) {
      console.log(`🗑️ [Categories API] DELETE - ลบบริการ ${servicesInCategory} รายการในหมวดหมู่`);
      await services.deleteMany({ categoryName: body.categoryName });
    }
    
    const result = await categories.deleteOne({ _id: new ObjectId(_id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' },
        { status: 404 }
      );
    }
    
    console.log(`✅ [Categories API] DELETE - ลบหมวดหมู่สำเร็จ: ${_id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'ลบหมวดหมู่สำเร็จ' 
    });
  } catch (error) {
    console.error('❌ [Categories API] DELETE - เกิดข้อผิดพลาด:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
