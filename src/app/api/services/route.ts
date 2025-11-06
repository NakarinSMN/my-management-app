import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: ดึงข้อมูลราคางานบริการทั้งหมด
export async function GET() {
  try {
    console.log('🔍 [Services API] Fetching all services...');
    
    const db = await getDatabase();
    const services = db.collection('pricing');
    
    const allServices = await services.find({}).toArray();
    
    console.log(`✅ [Services API] Found ${allServices.length} services`);
    
    return NextResponse.json({ 
      success: true, 
      data: allServices,
      count: allServices.length
    });
  } catch (error) {
    console.error('❌ [Services API] Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มข้อมูลราคางานบริการใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryName, categoryDescription, serviceName, servicePrice, serviceDetails } = body;
    
    // จัดการ encoding สำหรับข้อความภาษาไทย
    const cleanCategoryName = categoryName ? categoryName.toString().trim() : '';
    const cleanServiceName = serviceName ? serviceName.toString().trim() : '';
    const cleanServiceDetails = serviceDetails ? serviceDetails.toString().trim() : '';
    const cleanCategoryDescription = categoryDescription ? categoryDescription.toString().trim() : '';
    
    console.log('📝 [Services API] Adding new service:', { 
      categoryName, 
      serviceName, 
      servicePrice,
      categoryNameType: typeof categoryName,
      serviceNameType: typeof serviceName,
      servicePriceType: typeof servicePrice
    });
    
    if (!categoryName || !serviceName || servicePrice === undefined || servicePrice === null || servicePrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Category name, service name, and price are required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const services = db.collection('pricing');
    
    const newService = {
      categoryName: cleanCategoryName,
      categoryDescription: cleanCategoryDescription,
      serviceName: cleanServiceName,
      servicePrice: parseFloat(servicePrice),
      serviceDetails: cleanServiceDetails,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await services.insertOne(newService);
    
    console.log('✅ [Services API] Service added successfully:', result.insertedId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service added successfully',
      data: { ...newService, _id: result.insertedId }
    });
  } catch (error) {
    console.error('❌ [Services API] Error adding service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add service' },
      { status: 500 }
    );
  }
}

// PUT: อัปเดตข้อมูลราคางานบริการ
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, categoryName, categoryDescription, serviceName, servicePrice, serviceDetails } = body;
    
    console.log('🔄 [Services API] Updating service:', { _id, serviceName });
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const services = db.collection('pricing');
    
    const updateData = {
      ...(categoryName && { categoryName }),
      ...(categoryDescription !== undefined && { categoryDescription }),
      ...(serviceName && { serviceName }),
      ...(servicePrice !== undefined && servicePrice !== null && { servicePrice: parseFloat(servicePrice) }),
      ...(serviceDetails !== undefined && { serviceDetails }),
      updatedAt: new Date()
    };
    
    // ตรวจสอบว่า _id เป็น ObjectId หรือ string ธรรมดา
    let query;
    if (ObjectId.isValid(_id) && _id.length === 24) {
      // ถ้าเป็น ObjectId ที่ถูกต้อง
      query = { _id: new ObjectId(_id) };
    } else {
      // ถ้าเป็น string ID แบบอื่น (เช่น จาก Google Sheets)
      query = { _id: _id };
    }
    
    const result = await services.updateOne(
      query,
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ [Services API] Service updated successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service updated successfully' 
    });
  } catch (error) {
    console.error('❌ [Services API] Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE: ลบข้อมูลราคางานบริการ
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id } = body;
    
    console.log('🗑️ [Services API] Deleting service:', { _id });
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const services = db.collection('pricing');
    
    // ตรวจสอบว่า _id เป็น ObjectId หรือ string ธรรมดา
    let query;
    if (ObjectId.isValid(_id) && _id.length === 24) {
      // ถ้าเป็น ObjectId ที่ถูกต้อง
      query = { _id: new ObjectId(_id) };
    } else {
      // ถ้าเป็น string ID แบบอื่น (เช่น จาก Google Sheets)
      query = { _id: _id };
    }
    
    const result = await services.deleteOne(query);
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ [Services API] Service deleted successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Service deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [Services API] Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
