# คู่มือ: แสดงข้อมูลยี่ห้อ/รุ่นในหน้าแก้ไขข้อมูล

## ปัญหา
หน้า pop-up แก้ไขข้อมูลไม่แสดงข้อมูล "ยี่ห้อ / รุ่น" (brand)

## สาเหตุ
ตอนดึงข้อมูลจาก API มา mapping เป็น `CustomerData` ไม่ได้ดึงฟิลด์ `brand` และ `note` มาด้วย

## การแก้ไข

### 1. เพิ่มฟิลด์ใน RawCustomerDataItem Interface

**ไฟล์: `src/app/customer-info/page.tsx`**

```typescript
interface RawCustomerDataItem {
  'ทะเบียนรถ'?: string;
  'ยี่ห้อ / รุ่น'?: string;        // ✅ เพิ่มบรรทัดนี้
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'สถานะ'?: string;
  'สถานะการเตือน'?: string;
  'หมายเหตุ'?: string;              // ✅ เพิ่มบรรทัดนี้
}
```

### 2. แก้ไขการ mapping ข้อมูล

**ไฟล์: `src/app/customer-info/page.tsx`**

```typescript
useEffect(() => {
  if (swrData && swrData.data) {
    const formatted: CustomerData[] = (swrData.data || []).map((item: RawCustomerDataItem) => {
      const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
      const registerDate: string = dtField.includes('T') ? dtField.split('T')[0] : dtField;
      const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
      const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
      return {
        licensePlate: item['ทะเบียนรถ'] || '',
        brand: item['ยี่ห้อ / รุ่น'] || '',  // ✅ เพิ่มบรรทัดนี้
        customerName: item['ชื่อลูกค้า'] || '',
        phone,
        registerDate,
        status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
        note: item['หมายเหตุ'] || '',        // ✅ เพิ่มบรรทัดนี้
      };
    });
    setData(formatted);
    setError(null);
  } else if (swrError) {
    setError('ไม่สามารถโหลดข้อมูลลูกค้าได้: ' + swrError.message);
  }
  setLoading(false);
}, [swrData, swrError]);
```

### 3. ตรวจสอบชื่อคอลัมน์ใน Google Sheet

**สำคัญ:** ชื่อคอลัมน์ใน Google Sheet ต้องตรงกับที่ระบุใน interface

**ตรวจสอบว่าคอลัมน์ใน Google Sheet เป็น:**
- คอลัมน์ A: `timestamp` (ไม่แสดงในหน้าเว็บ)
- คอลัมน์ B: `ทะเบียนรถ`
- คอลัมน์ C: `ยี่ห้อ / รุ่น` หรือ `brand` หรือ `ยี่ห้อ/รุ่น`
- คอลัมน์ D: `ชื่อลูกค้า`
- คอลัมน์ E: `เบอร์ติดต่อ`
- คอลัมน์ F: `วันที่ชำระภาษีล่าสุด`
- คอลัมน์ G: `หมายเหตุ`
- คอลัมน์ H: `userId`
- คอลัมน์ I: `day`
- คอลัมน์ J: สูตรคำนวณวันครบกำหนด
- คอลัมน์ K: `สถานะ`
- คอลัมน์ L: `สถานะการเตือน`

## การทดสอบ

### 1. เปิด Browser Console (F12)
ตรวจสอบว่า console แสดงข้อมูลอะไร:

```
=== DEBUG API DATA ===
First item keys: ["timestamp", "ทะเบียนรถ", "ยี่ห้อ / รุ่น", ...]
First item: {timestamp: ..., ทะเบียนรถ: "...", ยี่ห้อ / รุ่น: "Honda", ...}
Formatted data first item: {licensePlate: "...", brand: "Honda", ...}
```

### 2. ตรวจสอบชื่อคอลัมน์

**ถ้าชื่อคอลัมน์ไม่ตรง:**
- ถ้า Google Sheet ใช้ `brand` แทน `ยี่ห้อ / รุ่น`
- แก้ไขโค้ดเป็น: `brand: item['brand'] || ''`

**ถ้า Google Sheet ใช้ `ยี่ห้อ/รุ่น` (ไม่มีช่องว่าง):**
- แก้ไขโค้ดเป็น: `brand: item['ยี่ห้อ/รุ่น'] || ''`

### 3. ทดสอบการแก้ไขข้อมูล

1. คลิกปุ่ม "แก้ไข" ที่แถวใดแถวหนึ่ง
2. ตรวจสอบว่า pop-up แสดงข้อมูล "ยี่ห้อ / รุ่น" หรือไม่
3. ตรวจสอบว่าข้อมูลถูกต้องตรงกับใน Google Sheet

## แก้ไขปัญหา

### ปัญหา 1: ยังไม่แสดงข้อมูล brand

**วิธีแก้:**
1. เปิด Browser Console
2. ดูที่ `First item keys` เพื่อดูว่าชื่อคอลัมน์เป็นอะไร
3. แก้ไขโค้ดให้ตรงกับชื่อคอลัมน์ที่แสดง

**ตัวอย่าง:**
```javascript
// ถ้า console แสดง keys: ["...", "brand", "..."]
brand: item['brand'] || '',

// ถ้า console แสดง keys: ["...", "ยี่ห้อ / รุ่น", "..."]
brand: item['ยี่ห้อ / รุ่น'] || '',

// ถ้า console แสดง keys: ["...", "ยี่ห้อ/รุ่น", "..."]
brand: item['ยี่ห้อ/รุ่น'] || '',
```

### ปัญหา 2: Console แสดง undefined

**วิธีแก้:**
1. ตรวจสอบว่า Google Sheet มีคอลัมน์ "ยี่ห้อ / รุ่น" หรือไม่
2. ตรวจสอบว่าชื่อคอลัมน์สะกดถูกต้อง (มีช่องว่างหรือไม่)
3. ตรวจสอบว่า Google Apps Script ส่งข้อมูลคอลัมน์นี้มาหรือไม่

### ปัญหา 3: API ไม่ส่งข้อมูลมา

**วิธีแก้:**
1. ตรวจสอบ Google Apps Script `doGet` function
2. ตรวจสอบว่า `getAll=1` ใช้ `headers` ทั้งหมดจาก Google Sheet
3. ตรวจสอบว่าไม่มีการกรองคอลัมน์ออก

## ผลลัพธ์ที่คาดหวัง

✅ หน้า pop-up แก้ไขข้อมูลแสดงข้อมูล "ยี่ห้อ / รุ่น"
✅ ข้อมูลตรงกับที่อยู่ใน Google Sheet
✅ สามารถดูข้อมูลได้ชัดเจน (แม้จะแก้ไขไม่ได้ก็ตาม)

## หมายเหตุ

- ฟิลด์ "ยี่ห้อ / รุ่น" ถูกตั้งเป็น `disabled` จึงแก้ไขไม่ได้
- ถ้าต้องการให้แก้ไขได้ ให้ลบ `disabled` ออกจาก input
- ชื่อคอลัมน์ใน Google Sheet ต้องตรงกับที่กำหนดไว้ใน `RawCustomerDataItem` interface

## ขั้นตอนถัดไป

1. รีเฟรชหน้าเว็บ
2. เปิด Browser Console (F12)
3. ตรวจสอบ debug logs
4. คลิก "แก้ไข" เพื่อดู pop-up
5. ตรวจสอบว่าแสดงข้อมูล brand หรือไม่

