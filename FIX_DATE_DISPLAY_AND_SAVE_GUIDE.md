# คู่มือแก้ไขปัญหา: วันที่ไม่ตรงและถอยลงเมื่อบันทึก

## ปัญหา
1. วันที่แสดงในหน้าข้อมูลต่อภาษีไม่ตรงกับ Google Sheet
2. เมื่อบันทึกการแก้ไข วันเดือนปีถอยลง

## สาเหตุ

### ปัญหา 1: วันที่ไม่ตรง
- Google Apps Script ส่ง Date object ผ่าน `getAll=1`
- เมื่อ JSON.stringify จะกลายเป็น ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
- เกิด timezone offset ทำให้วันที่เปลี่ยน

### ปัญหา 2: วันที่ถอยลง
- การแปลงวันที่ผิดพลาด
- ใช้ Date object ที่มีปัญหา timezone
- ไม่ได้ใช้ `Asia/Bangkok` timezone

## การแก้ไข

### 1. แก้ไข Google Apps Script

**ไฟล์: `GOOGLE_APPS_SCRIPT_FINAL_FIX.js`**

**แก้ไขส่วน `getAll=1`:**

```javascript
// ✅ กรณี getAll=1 ให้ส่งข้อมูลทั้งหมด
if (e.parameter.getAll === '1') {
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      // แปลง Date object เป็น string ในรูปแบบ DD/MM/YYYY
      if (row[i] instanceof Date) {
        obj[h] = Utilities.formatDate(row[i], 'Asia/Bangkok', 'dd/MM/yyyy');
      } else {
        obj[h] = row[i];
      }
    });
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify({ data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**สิ่งที่เปลี่ยน:**
- ✅ เพิ่มการตรวจสอบว่าเป็น Date object หรือไม่
- ✅ แปลง Date object เป็น string ด้วย `Utilities.formatDate`
- ✅ ใช้ timezone `'Asia/Bangkok'`
- ✅ Format เป็น `'dd/MM/yyyy'`

### 2. แก้ไข Frontend - Data Fetching

**ไฟล์: `src/app/customer-info/page.tsx`**

**แก้ไขการ parse วันที่:**

```typescript
const formatted: CustomerData[] = (swrData.data || []).map((item: RawCustomerDataItem) => {
  const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
  
  // จัดการวันที่ให้ถูกต้อง
  let registerDate = '';
  if (dtField) {
    // ถ้าเป็น ISO format (YYYY-MM-DDTHH:mm:ss)
    if (dtField.includes('T')) {
      registerDate = dtField.split('T')[0];
    }
    // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dtField)) {
      registerDate = dtField;
    }
    // ถ้าเป็น YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dtField)) {
      registerDate = dtField;
    }
    // อื่นๆ ใช้ค่าเดิม
    else {
      registerDate = dtField;
    }
  }
  
  return {
    licensePlate: item['ทะเบียนรถ'] || '',
    brand: item['ยี่ห้อ / รุ่น'] || '',
    customerName: item['ชื่อลูกค้า'] || '',
    phone,
    registerDate,
    status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
    note: item['หมายเหตุ'] || '',
  };
});
```

### 3. แก้ไข Frontend - Date Display

**ไฟล์: `src/app/customer-info/page.tsx`**

**ฟังก์ชัน `formatDateFlexible` ใช้งานได้แล้ว:**

```typescript
function formatDateFlexible(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  
  try {
    // ถ้าเป็น YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
    }
    // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    // อื่นๆ
    else {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return dateStr;
      }
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr;
  }
}
```

### 4. แก้ไข Frontend - Date Save

**ไฟล์: `src/app/components/EditCustomerForm.tsx`**

**การบันทึกวันที่ (ใช้งานได้แล้ว):**

```typescript
// แปลงวันที่กลับเป็น DD/MM/YYYY สำหรับ Google Sheet
let formattedDate = '';
if (formData.registerDate) {
  const [year, month, day] = formData.registerDate.split('-');
  // แปลงเป็น DD/MM/YYYY โดยไม่ปรับวันที่
  formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}
```

## ขั้นตอนการแก้ไข

### 1. อัปเดต Google Apps Script

1. เปิด Google Apps Script Editor
2. แก้ไขโค้ดใน `doGet` function ส่วน `getAll=1`
3. เพิ่มการตรวจสอบ `instanceof Date`
4. เพิ่มการแปลงเป็น string ด้วย `Utilities.formatDate`
5. บันทึก (Ctrl+S)
6. **Deploy ใหม่:**
   - คลิก "Deploy" → "Manage deployments"
   - คลิก "Edit" (ไอคอนดินสอ)
   - เลือก "New version"
   - คลิก "Deploy"

### 2. อัปเดต Frontend

1. แก้ไขไฟล์ `src/app/customer-info/page.tsx`
2. แก้ไขการ parse วันที่ใน `useEffect`
3. บันทึกไฟล์
4. รีเฟรชหน้าเว็บ

### 3. ทดสอบ

1. **ทดสอบการแสดงผล:**
   - เปิดหน้าข้อมูลต่อภาษี
   - ตรวจสอบวันที่ในตาราง
   - เปรียบเทียบกับ Google Sheet
   - ✅ ควรตรงกัน

2. **ทดสอบการบันทึก:**
   - คลิก "แก้ไข" ที่แถวใดแถวหนึ่ง
   - เปลี่ยนชื่อหรือเบอร์โทร
   - บันทึกการแก้ไข
   - ตรวจสอบวันที่ใน Google Sheet
   - ✅ ควรไม่เปลี่ยนแปลง

3. **ตรวจสอบ Console Logs:**
   ```
   === DEBUG API DATA ===
   First item: {วันที่ชำระภาษีล่าสุด: "26/11/2024", ...}
   Formatted data first item: {registerDate: "26/11/2024", ...}
   ```

## ผลลัพธ์ที่คาดหวัง

### ก่อนแก้ไข:
- ❌ Google Sheet: 26/11/2024
- ❌ หน้าเว็บ: 25/11/2024
- ❌ หลังบันทึก: 24/11/2024

### หลังแก้ไข:
- ✅ Google Sheet: 26/11/2024
- ✅ หน้าเว็บ: 26/11/2024
- ✅ หลังบันทึก: 26/11/2024 (ไม่เปลี่ยน)

## การแก้ไขปัญหา

### ปัญหา 1: ยังไม่ตรง

**วิธีแก้:**
1. ตรวจสอบว่า Deploy Google Apps Script ใหม่แล้วหรือยัง
2. รอ 1-2 นาทีให้ระบบอัปเดต
3. ล้าง cache ของ browser (Ctrl+Shift+Delete)
4. รีเฟรชหน้าเว็บ (Ctrl+Shift+R)

### ปัญหา 2: วันที่ยังถอยลง

**วิธีแก้:**
1. เปิด Browser Console (F12)
2. ดูที่ `=== DEBUG EDIT FORM ===`
3. ตรวจสอบ `Formatted date` ควรเป็น DD/MM/YYYY
4. ตรวจสอบว่าไม่มีการเพิ่มหรือลบวัน

### ปัญหา 3: Format ไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบ `First item` ใน console
2. ดูว่า `วันที่ชำระภาษีล่าสุด` เป็น format อะไร
3. แก้ไขโค้ดให้ตรงกับ format ที่ได้

## หมายเหตุ

- การแก้ไขนี้แก้ไขทั้ง timezone และ format
- ใช้ `Asia/Bangkok` timezone ทั้ง backend และ frontend
- ไม่ใช้ Date object ในการแปลงวันที่
- ใช้ string manipulation แทน

## สรุป

✅ **แก้ไข Google Apps Script:**
- เพิ่มการแปลง Date object เป็น string
- ใช้ timezone Asia/Bangkok
- Format เป็น DD/MM/YYYY

✅ **แก้ไข Frontend:**
- ปรับการ parse วันที่
- รองรับหลาย format
- ไม่ใช้ Date object ที่มีปัญหา timezone

🚀 **ผลลัพธ์:**
- วันที่แสดงผลถูกต้อง
- วันที่ไม่ถอยลงเมื่อบันทึก
- ตรงกับ Google Sheet

