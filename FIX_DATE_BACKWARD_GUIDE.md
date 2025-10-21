# คู่มือแก้ไขปัญหา: วันที่ถอยหลัง 1 วัน

## ปัญหา
ในหน้า "ข้อมูลต่อภาษี" วันที่แสดงผลถอยหลัง 1 วัน

เช่น:
- Google Sheet: 26/11/2024
- หน้าเว็บ: 25/11/2024

## สาเหตุ

### 1. ใน EditCustomerForm.tsx
มีการเพิ่ม 1 วันเพื่อแก้ปัญหา timezone แต่กลับทำให้วันที่ผิด

**โค้ดเก่า:**
```typescript
const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
dateObj.setDate(dateObj.getDate() + 1); // เพิ่ม 1 วัน ❌
formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
```

**โค้ดใหม่:**
```typescript
// แปลงเป็น DD/MM/YYYY โดยไม่ปรับวันที่
formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
```

### 2. ใน page.tsx (formatDateFlexible)
มีการปรับ timezone +7 ชั่วโมงซึ่งทำให้วันที่เปลี่ยน

**โค้ดเก่า:**
```typescript
// แปลงเป็น timezone ไทย (UTC+7)
const thaiDate = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // ❌
const day = thaiDate.getUTCDate().toString().padStart(2, '0');
```

**โค้ดใหม่:**
```typescript
// ถ้าเป็น YYYY-MM-DD
if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
  const [yyyy, mm, dd] = dateStr.split('-');
  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`; // ✅ แปลงตรงๆ
}
// ถ้าเป็น DD/MM/YYYY อยู่แล้ว
else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
  return dateStr; // ✅ คืนค่าเดิม
}
```

## การแก้ไข

### ไฟล์ที่แก้ไข:
1. ✅ `src/app/components/EditCustomerForm.tsx` - ลบการเพิ่ม 1 วัน
2. ✅ `src/app/customer-info/page.tsx` - แก้ไขฟังก์ชัน `formatDateFlexible`

### หลักการแก้ไข:
1. **ไม่ปรับวันที่ด้วย Date object** - ใช้การแปลง string ตรงๆ
2. **ไม่เพิ่ม timezone offset** - ไม่ต้องปรับ +7 ชั่วโมง
3. **แปลง format ตรงๆ** - YYYY-MM-DD → DD/MM/YYYY โดยไม่ผ่าน Date object

## ผลลัพธ์

### ก่อนแก้ไข:
- Google Sheet: **26/11/2024**
- หน้าเว็บ: **25/11/2024** ❌

### หลังแก้ไข:
- Google Sheet: **26/11/2024**
- หน้าเว็บ: **26/11/2024** ✅

## ทำไมต้องแก้แบบนี้?

### ปัญหาของ Date object ใน JavaScript:
```javascript
// ⚠️ Date object มีปัญหา timezone
const date = new Date(2024, 10, 26); // เดือน 11 (0-based)
console.log(date); // 2024-11-26T00:00:00.000Z (UTC)
console.log(date.toLocaleDateString()); // อาจแสดง 25/11/2024 ขึ้นอยู่กับ timezone

// ✅ แปลง string ตรงๆดีกว่า
const dateStr = "2024-11-26";
const [yyyy, mm, dd] = dateStr.split('-');
const formatted = `${dd}/${mm}/${yyyy}`; // 26/11/2024
```

## การทดสอบ

1. เปิดหน้า "ข้อมูลต่อภาษี"
2. ตรวจสอบวันที่ในตาราง
3. ลองแก้ไขข้อมูล
4. ตรวจสอบว่าวันที่ถูกต้องทั้งใน:
   - หน้าเว็บ
   - Google Sheet
   - หลังแก้ไขข้อมูล

## หมายเหตุ

- การแก้ไขนี้ทำให้วันที่แสดงผลตรงกับที่บันทึกใน Google Sheet
- ไม่ต้องแก้ไข Google Apps Script
- ไม่ต้อง Deploy ใหม่ (เฉพาะ Frontend)
- ใช้การแปลง string แทน Date object เพื่อหลีกเลี่ยงปัญหา timezone

## สรุป

✅ **แก้ไขแล้ว:**
- ลบการเพิ่ม 1 วันใน `EditCustomerForm.tsx`
- แก้ไข `formatDateFlexible` ให้แปลงตรงๆ
- ใช้ string manipulation แทน Date object

🚀 **ผลลัพธ์:**
- วันที่แสดงผลถูกต้อง
- ตรงกับ Google Sheet
- ไม่มีปัญหา timezone

