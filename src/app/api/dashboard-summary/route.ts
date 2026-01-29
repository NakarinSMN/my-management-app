import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  const startTime = Date.now();

  try {
    const db = await getDatabase();
    const customers = db.collection('customers');

    // ใช้ projection เฉพาะฟิลด์ที่จำเป็นต่อแดชบอร์ด
    const docs = await customers
      .find(
        {},
        {
          projection: {
            _id: 0,
            licensePlate: 1,
            customerName: 1,
            registerDate: 1,
            inspectionDate: 1,
            vehicleType: 1,
            status: 1,
            tags: 1,
          },
        },
      )
      .toArray();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    let thisMonthRenewals = 0;
    let upcomingExpiry = 0;
    let overdueCount = 0;
    let alreadyTaxed = 0;

    const nextYearTax: { licensePlate: string; customerName: string }[] = [];

    // ฟังก์ชันช่วยแปลงวันที่เป็น { day, month, year }
    const parseDate = (value: unknown): { day: number; month: number; year: number } | null => {
      const s = String(value || '');
      if (!s) return null;

      try {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
          const [dd, mm, yyyy] = s.split('/');
          return {
            day: parseInt(dd, 10),
            month: parseInt(mm, 10),
            year: parseInt(yyyy, 10),
          };
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          const [yyyy, mm, dd] = s.split('-');
          return {
            day: parseInt(dd, 10),
            month: parseInt(mm, 10),
            year: parseInt(yyyy, 10),
          };
        }
        if (s.includes('T')) {
          const d = new Date(s);
          if (Number.isNaN(d.getTime())) return null;
          return {
            day: d.getDate(),
            month: d.getMonth() + 1,
            year: d.getFullYear(),
          };
        }
      } catch {
        return null;
      }

      return null;
    };

    // วนรอบข้อมูลเพื่อคำนวณสถิติหลัก
    docs.forEach((item) => {
      const lastTax = parseDate(item.registerDate);

      if (lastTax) {
        if (lastTax.month === currentMonth && lastTax.year === currentYear) {
          thisMonthRenewals += 1;
        }
        if (lastTax.year === nextYear && nextYearTax.length < 10) {
          nextYearTax.push({
            licensePlate: String(item.licensePlate || ''),
            customerName: String(item.customerName || ''),
          });
        }
      }

      const status = String(item.status || '');
      if (status === 'กำลังจะครบกำหนด') {
        upcomingExpiry += 1;
      } else if (status === 'เกินกำหนด') {
        overdueCount += 1;
      } else if (status === 'ต่อภาษีแล้ว') {
        alreadyTaxed += 1;
      }
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration,
      data: {
        totalCustomers: docs.length,
        thisMonthRenewals,
        upcomingExpiry,
        overdueCount,
        alreadyTaxed,
        nextYearTax,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Dashboard Summary API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate dashboard summary',
        duration,
      },
      { status: 500 },
    );
  }
}

