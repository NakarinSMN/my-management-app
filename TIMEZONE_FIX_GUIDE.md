# คู่มือแก้ไขปัญหา Timezone วันที่ไม่ตรงกัน

## ปัญหา
- หน้าเว็บแสดงวันที่ 25
- Google Sheet แสดงวันที่ 26
- เกิดจาก timezone difference ระหว่าง UTC และ Asia/Bangkok

## การแก้ไข

### 1. แก้ไข Google Apps Script

**วางโค้ดใหม่ใน Google Apps Script Editor:**

```javascript
// ใช้ไฟล์: GOOGLE_APPS_SCRIPT_FINAL_FIX.js
```

**การเปลี่ยนแปลงสำคัญ:**
- ใช้ `'Asia/Bangkok'` timezone แทน `Session.getScriptTimeZone()`
- แปลงวันที่เป็น `dd/MM/yyyy` format
- เพิ่ม timezone offset +7 ชั่วโมง

### 2. แก้ไข Frontend (Next.js)

**ไฟล์: `src/app/customer-info/page.tsx`**

```typescript
// ฟังก์ชันแสดงวันที่ตรงกับชีต รองรับทั้ง YYYY-MM-DD และ DD/MM/YYYY
function formatDateFlexible(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  
  try {
    let dateObj: Date;
    
    // ถ้าเป็น YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    }
    // ถ้าเป็น DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('/');
      dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    }
    // ถ้าเป็น Date object หรือ string อื่น
    else {
      dateObj = new Date(dateStr);
    }
    
    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(dateObj.getTime())) {
      return dateStr; // คืนค่าต้นฉบับถ้าไม่สามารถแปลงได้
    }
    
    // แปลงเป็น timezone ไทย (UTC+7)
    const thaiDate = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
    
    // แสดงผลในรูปแบบ DD/MM/YYYY
    const day = thaiDate.getUTCDate().toString().padStart(2, '0');
    const month = (thaiDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = thaiDate.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr; // คืนค่าต้นฉบับถ้าเกิดข้อผิดพลาด
  }
}
```

## ขั้นตอนการแก้ไข

### 1. อัปเดต Google Apps Script

1. เปิด Google Apps Script Editor
2. ลบโค้ดเก่าทั้งหมด
3. วางโค้ดจากไฟล์ `GOOGLE_APPS_SCRIPT_FINAL_FIX.js`
4. บันทึก (Ctrl+S)
5. Deploy ใหม่:
   - คลิก "Deploy" → "New deployment"
   - เลือก "Web app"
   - ตั้งค่า "Execute as: Me"
   - ตั้งค่า "Who has access: Anyone"
   - คลิก "Deploy"
   - คัดลอก URL ใหม่

### 2. อัปเดต Frontend

1. เปิดไฟล์ `src/app/customer-info/page.tsx`
2. แทนที่ฟังก์ชัน `formatDateFlexible` ด้วยโค้ดใหม่
3. บันทึกไฟล์

### 3. อัปเดต URL ใน Frontend

1. เปิดไฟล์ `src/app/components/EditCustomerForm.tsx`
2. เปลี่ยน `GOOGLE_SCRIPT_URL` เป็น URL ใหม่
3. เปิดไฟล์ `src/app/components/AddCustomerForm.tsx`
4. เปลี่ยน `GOOGLE_SCRIPT_URL` เป็น URL ใหม่
5. เปิดไฟล์ `src/app/components/TestAPI.tsx`
6. เปลี่ยน `GOOGLE_SCRIPT_URL` เป็น URL ใหม่

## การทดสอบ

1. รันแอป: `npm run dev`
2. เปิดหน้าเว็บ: `http://localhost:3000/customer-info`
3. ตรวจสอบวันที่ในตาราง
4. ทดสอบแก้ไขข้อมูล
5. ตรวจสอบวันที่ใน Google Sheet

## ผลลัพธ์ที่คาดหวัง

- วันที่ในหน้าเว็บและ Google Sheet ตรงกัน
- ไม่มีปัญหา timezone difference
- ระบบทำงานได้ปกติ

## หมายเหตุ

- การแก้ไขนี้จะทำให้วันที่แสดงผลตรงกับ timezone ไทย (UTC+7)
- ข้อมูลใน Google Sheet จะถูกบันทึกในรูปแบบที่ถูกต้อง
- ระบบจะทำงานได้อย่างเสถียร
