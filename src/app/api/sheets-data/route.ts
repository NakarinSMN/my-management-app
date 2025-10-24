import { NextRequest, NextResponse } from 'next/server';

// Google Apps Script URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU/exec';

// GET: ดึงข้อมูลจาก Google Sheets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'customers';
    const forceRefresh = searchParams.get('refresh') === '1';

    console.log('🔄 [Sheets API] Fetching data:', { dataType, forceRefresh });

    let url = GAS_URL;
    
    // กำหนด parameter ตามประเภทข้อมูล
    if (dataType === 'customers') {
      url += '?getAll=1';
    } else if (dataType === 'billing') {
      url += '?getBills=1';
    } else if (dataType === 'pricing') {
      // สำหรับข้อมูลราคาบริการ ใช้ข้อมูลลูกค้าเป็นฐาน
      url += '?getAll=1';
    }

    if (forceRefresh) {
      url += '&refresh=1';
    }

    console.log('📡 [Sheets API] Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ [Sheets API] Data fetched successfully:', {
      result: data.result,
      count: data.count || data.data?.length || 0
    });

    // แปลงข้อมูลสำหรับ pricing
    if (dataType === 'pricing' && data.result === 'success') {
      const pricingData = transformToPricingData(data.data);
      return NextResponse.json({
        success: true,
        data: pricingData,
        count: pricingData.length,
        source: 'google-sheets',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: data.result === 'success',
      data: data.data || [],
      count: data.count || data.data?.length || 0,
      source: 'google-sheets',
      timestamp: data.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Sheets API] Error fetching data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data from Google Sheets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// แปลงข้อมูลลูกค้าเป็นข้อมูลราคาบริการ
function transformToPricingData(customers: Record<string, unknown>[]) {
  const pricingData: Record<string, unknown>[] = [];
  
  // สร้างหมวดหมู่จากข้อมูลลูกค้า
  const categories = new Set();
  customers.forEach(customer => {
    if (customer.service) {
      categories.add(customer.service);
    }
  });

  // สร้างข้อมูลราคาบริการ
  categories.forEach(category => {
    // หาข้อมูลลูกค้าที่ใช้บริการนี้
    const customersInCategory = customers.filter(c => c.service === category);
    
    if (customersInCategory.length > 0) {
      // สร้างข้อมูลบริการตัวอย่าง
      pricingData.push({
        _id: `sheet-${category}-1`,
        categoryName: category,
        categoryDescription: `บริการ${category}`,
        serviceName: `${category} - บริการพื้นฐาน`,
        servicePrice: 100,
        serviceDetails: `บริการ${category}สำหรับลูกค้า`,
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'google-sheets'
      });

      // สร้างข้อมูลบริการเพิ่มเติม
      if (customersInCategory.length > 5) {
        pricingData.push({
          _id: `sheet-${category}-2`,
          categoryName: category,
          categoryDescription: `บริการ${category}`,
          serviceName: `${category} - บริการพิเศษ`,
          servicePrice: 200,
          serviceDetails: `บริการ${category}พิเศษสำหรับลูกค้า`,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'google-sheets'
        });
      }
    }
  });

  return pricingData;
}
