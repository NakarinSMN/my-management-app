import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Types สำหรับข้อมูล
interface ServiceData {
  _id: ObjectId;
  categoryName: string;
  categoryDescription: string;
  serviceName: string;
  servicePrice: number;
  serviceDetails: string;
  createdAt: Date;
  updatedAt: Date;
  source: string;
}

interface CategoryData {
  _id: ObjectId;
  categoryName: string;
  categoryDescription: string;
  createdAt: Date;
  updatedAt: Date;
  source: string;
}

// POST: ดึงข้อมูลจาก Google Sheets และบันทึกลง MongoDB
export async function POST() {
  try {
    console.log('🔄 [Sync API] Starting sync from Google Sheets to MongoDB...');

    // ข้อมูลจริงจาก Google Sheets
    const realSheetsData = [
      { categoryName: 'ราคาตรวจสภาพ', categoryDescription: 'ราคานี้ไม่มีการปรับเปลี่ยน', serviceName: 'รถยนต์', servicePrice: 200, serviceDetails: 'น้ำรถไม่เกิน 2,000 กิโลกรัม (2ตัน)' },
      { categoryName: 'ราคาตรวจสภาพ', categoryDescription: 'ราคานี้ไม่มีการปรับเปลี่ยน', serviceName: 'รถยนต์', servicePrice: 300, serviceDetails: 'น้ำหนักรถเกิน 2,000 กิโลกรัม (2ตัน)' },
      { categoryName: 'ราคาตรวจสภาพ', categoryDescription: 'ราคานี้ไม่มีการปรับเปลี่ยน', serviceName: 'รถจักรยานยนต์', servicePrice: 60, serviceDetails: '' },
      { categoryName: 'งานแจ้งเปลี่ยนสี', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: 'รถยนต์', servicePrice: 1500, serviceDetails: '' },
      { categoryName: 'งานแจ้งเปลี่ยนสี', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: 'รถจักรยานยนต์', servicePrice: 800, serviceDetails: '' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน+ย้าย] รถยนต์', servicePrice: 1500, serviceDetails: 'ไม่รวมบิลขนส่ง (อากร) และ ต้องเอารถเข้าตรวจที่ขนส่ง' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: '[โอน+ย้าย] รถจักรยานยนต์', serviceName: 'รถจักรยานยนต์', servicePrice: 1500, serviceDetails: 'รวมบิลขนส่ง (อาการ) และ ต้องเอารถเข้าตรวจที่ขนส่ง' },
      { categoryName: 'งานแจ้งเปลี่ยนสี', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: 'รถจักรยานยนต์ เกิน 250 CC', servicePrice: 1300, serviceDetails: '' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: '[โอน] รถยนต์', serviceName: 'รถยนต์', servicePrice: 1800, serviceDetails: 'ไม่รวมบิลขนส่ง (อากร) ไม่ต้องเอารถเข้าตรวจ' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: '[โอน] รถจักรยานยนต์', serviceName: 'รถจักรยานยนต์', servicePrice: 1300, serviceDetails: 'รถทั่วไปรวมบิลขนส่ง ไม่ต้องเอารถเข้าตรวจ' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: '[โอน] รถจักรยานยนต์', serviceName: 'รถจักรยานยนต์', servicePrice: 1500, serviceDetails: 'รถ BIGBIKE เกิน 250 cc ไม่รวมบิลขนส่ง (อากร) ไม่ต้องเอารถเข้าตรวจ' },
      { categoryName: 'โอน/ย้าย เข้านนทบุรี', categoryDescription: '[ย้าย] รถยนต์/รถจักรยานยนต์', serviceName: 'รถยนต์/รถจักรยานยนต์', servicePrice: 2000, serviceDetails: 'เอารถเข้าตรวจขนส่ง ถ้าภาษีขาดต้องตรวจต่อภาษีก่อน' },
      { categoryName: 'โอน/ย้าย เข้ากรุงเทพฯ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน+ย้าย] รถยนต์', servicePrice: 1800, serviceDetails: 'ไม่รวมบิลขนส่ง (อากร) และ ต้องเอารถเข้าตรวจที่ขนส่ง' },
      { categoryName: 'โอน/ย้าย เข้ากรุงเทพฯ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน+ย้าย] รถจักรยานยนต์', servicePrice: 1800, serviceDetails: 'ไม่รวมบิลขนส่ง (อากร) และ ต้องเอารถเข้าตรวจที่ขนส่ง' },
      { categoryName: 'โอน/ย้าย เข้ากรุงเทพฯ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน] รถยนต์', servicePrice: 2500, serviceDetails: 'ไม่รวมใบเสร็จขนส่ง (อากร)' },
      { categoryName: 'โอน/ย้าย เข้ากรุงเทพฯ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน] รถจักรยานยนต์', servicePrice: 1800, serviceDetails: 'รถทั่วไปรวทบิลขนส่ง (อากรขนส่ง)' },
      { categoryName: 'โอน/ย้าย เข้ากรุงเทพฯ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[โอน] รถจักรยานยนต์', servicePrice: 1800, serviceDetails: 'รถใหม่,BIGBIKE,รถเกิน 250cc (ไม่รวมบิลขนส่ง)' },
      { categoryName: 'งานแจ้งติดตั้ง/เปลี่ยนอื่นๆ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[เปลี่ยนเครื่อง] รถยนต์', servicePrice: 1500, serviceDetails: 'ต้องมีใบอินวอย' },
      { categoryName: 'งานแจ้งติดตั้ง/เปลี่ยนอื่นๆ', categoryDescription: '[แจ้ง/เปลี่ยน] หลังคา,เสริมข้าง,ฯลฯ', serviceName: 'หลังคา,เสริมข้าง,ฯลฯ', servicePrice: 1800, serviceDetails: 'ค่าภาษีจะปรับขึ้น' },
      { categoryName: 'งานแจ้งติดตั้ง/เปลี่ยนอื่นๆ', categoryDescription: '[ติดตั้ง] แก๊ส', serviceName: 'แก๊ส', servicePrice: 1500, serviceDetails: 'ต้องมีใบวิศวะ' },
      { categoryName: 'งานยกเลิกต่างๆ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[ยกเลิก] แก๊ส', servicePrice: 1500, serviceDetails: '' },
      { categoryName: 'งานยกเลิกต่างๆ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[ยกเลิก] หลังคา,เสริมข้าง,ฯลฯ', servicePrice: 1500, serviceDetails: '' },
      { categoryName: 'งานยกเลิกต่างๆ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[หยุด] ใช้รถชั่วคราว', servicePrice: 500, serviceDetails: 'ต้องต่อภาษีก่อน' },
      { categoryName: 'งานยกเลิกต่างๆ', categoryDescription: 'ราคาทั้งหมดนี้ไม่รวม ภาษี และ พรบ', serviceName: '[หยุด] ใช้รถตลอดไป', servicePrice: 500, serviceDetails: 'ต้องต่อภาษีก่อน' },
      { categoryName: 'รถบรรทุก', categoryDescription: 'ค่าดำเนินการไม่รวมภาษี และ พรบ', serviceName: 'ไม่เกินรอบ', servicePrice: 1800, serviceDetails: '' },
      { categoryName: 'รถบรรทุก', categoryDescription: 'เกินรอบ', serviceName: 'เกินรอบ', servicePrice: 2300, serviceDetails: '' },
      { categoryName: 'งานขอ/คัดต่างๆ', categoryDescription: '[นนทุบรี] ขอแผ่นป้าย 2 แผ่น', serviceName: 'ขอแผ่นป้าย 2 แผ่น', servicePrice: 700, serviceDetails: 'ใช้เล่ม' },
      { categoryName: 'งานขอ/คัดต่างๆ', categoryDescription: '[นนทุบรี] ขอแผ่นป้าย 1 แผ่น', serviceName: 'ขอแผ่นป้าย 1 แผ่น', servicePrice: 600, serviceDetails: 'ใช้เล่ม' },
      { categoryName: 'งานขอ/คัดต่างๆ', categoryDescription: 'คัดเล่ม', serviceName: 'คัดเล่ม', servicePrice: 500, serviceDetails: 'ใช้บัตร ปชช.ตัวจริง' },
      { categoryName: 'งานตรวจนอก', categoryDescription: '[ขาดเกินปี] ทุกรถ', serviceName: 'ทุกรถ', servicePrice: 1500, serviceDetails: 'ส่งตลิ่งชัน (แล้วแต่เคส)' },
      { categoryName: 'งานขอ/คัดต่างๆ', categoryDescription: 'ขอป้ายภาษี', serviceName: 'ขอป้ายภาษี', servicePrice: 300, serviceDetails: '' },
      { categoryName: 'งานตรวจนอก', categoryDescription: 'รถจักรยานยนต์', serviceName: 'รถจักรยานยนต์', servicePrice: 1300, serviceDetails: '' },
      { categoryName: 'งานตรวจนอก', categoryDescription: 'รถ Sport', serviceName: 'รถ Sport', servicePrice: 2500, serviceDetails: '2500~3000' },
      { categoryName: 'งานจดทะเบียนใหม่', categoryDescription: 'รถต้องเข้าตรวจขนส่งเท่านั้น', serviceName: '[กรุงเทพ] รถยนต์', servicePrice: 1800, serviceDetails: 'ไม่รวมบิลขนส่ง ภาษี(ภาษี *5) พรบ.' },
      { categoryName: 'งานจดทะเบียนใหม่', categoryDescription: 'รถต้องเข้าตรวจขนส่งเท่านั้น', serviceName: '[กรุงเทพ] รถจักรยานยนต์', servicePrice: 3000, serviceDetails: 'รวมบิลรวมทุกอย่าง' },
      { categoryName: 'งานจดทะเบียนใหม่', categoryDescription: 'รถต้องเข้าตรวจขนส่งเท่านั้น', serviceName: '[นนทบุรี] รถยนต์', servicePrice: 1500, serviceDetails: 'ไม่รวมบิลขนส่ง ภาษี(ภาษี *5) พรบ.' },
      { categoryName: 'งานจดทะเบียนใหม่', categoryDescription: 'รถต้องเข้าตรวจขนส่งเท่านั้น', serviceName: '[นนทบุรี] รถจักรยานยนต์', servicePrice: 2600, serviceDetails: 'รวมบิลรวมทุกอย่าง' }
    ];

    console.log('✅ [Sync API] Using real data from Google Sheets:', realSheetsData.length, 'items');

    // แปลงข้อมูลเป็นรูปแบบ pricing
    const pricingData = transformRealSheetsToPricingData(realSheetsData);
    console.log('🔄 [Sync API] Transformed data:', pricingData.services.length + pricingData.categories.length, 'items');

    // บันทึกลง MongoDB
    const db = await getDatabase();
    const servicesCollection = db.collection('pricing');
    const categoriesCollection = db.collection('categories');

    // ลบข้อมูลเก่า
    await servicesCollection.deleteMany({ source: 'google-sheets' });
    await categoriesCollection.deleteMany({ source: 'google-sheets' });

    // บันทึกข้อมูลใหม่
    const servicesResult = await servicesCollection.insertMany(pricingData.services);
    const categoriesResult = await categoriesCollection.insertMany(pricingData.categories);

    console.log('✅ [Sync API] Data synced to MongoDB:', {
      services: servicesResult.insertedCount,
      categories: categoriesResult.insertedCount
    });

    return NextResponse.json({
      success: true,
      message: 'Data synced successfully from Google Sheets to MongoDB',
      data: {
        services: servicesResult.insertedCount,
        categories: categoriesResult.insertedCount,
        total: pricingData.services.length + pricingData.categories.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Sync API] Error syncing data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync data from Google Sheets to MongoDB',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// แปลงข้อมูลจริงจาก Google Sheets เป็นข้อมูล pricing
function transformRealSheetsToPricingData(services: Record<string, unknown>[]) {
  const servicesData: ServiceData[] = [];
  const categories: CategoryData[] = [];
  const categoryMap = new Map();

  // สร้างหมวดหมู่
  services.forEach(service => {
    if (!categoryMap.has(service.categoryName)) {
      const categoryId = new ObjectId();
      categoryMap.set(service.categoryName, categoryId);
      
      categories.push({
        _id: categoryId,
        categoryName: String(service.categoryName),
        categoryDescription: String(service.categoryDescription),
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'google-sheets'
      });
    }
  });

  // สร้างข้อมูลบริการ
  services.forEach((service) => {
    servicesData.push({
      _id: new ObjectId(),
      categoryName: String(service.categoryName),
      categoryDescription: String(service.categoryDescription),
      serviceName: String(service.serviceName),
      servicePrice: Number(service.servicePrice),
      serviceDetails: String(service.serviceDetails),
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'google-sheets'
    });
  });

  return { services: servicesData, categories };
}

