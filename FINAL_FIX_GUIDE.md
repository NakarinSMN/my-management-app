# แก้ไขปัญหา "Cannot read properties of undefined (reading 'contents')"

## ปัญหาที่เกิดขึ้น
```
เกิดข้อผิดพลาด: Cannot read properties of undefined (reading 'contents')
```

## สาเหตุ
- Google Apps Script ไม่สามารถอ่านข้อมูล FormData ได้ถูกต้อง
- `e.postData.contents` เป็น undefined เมื่อส่งข้อมูลเป็น FormData
- ต้องใช้ `e.parameter` สำหรับ FormData

## วิธีแก้ไข

### 1. อัปเดต Google Apps Script Code
1. ไปที่ [Google Apps Script](https://script.google.com)
2. เปิดโปรเจคที่มีอยู่
3. **ลบโค้ดเก่าทั้งหมด**
4. **วางโค้ดใหม่จากไฟล์ `GOOGLE_APPS_SCRIPT_FINAL.js`**
5. บันทึก (Ctrl+S)
6. Deploy ใหม่:
   - ไปที่ "Deploy" > "Manage deployments"
   - คลิก "Edit" (ไอคอนดินสอ)
   - คลิก "Done"
   - คลิก "Deploy"

### 2. ตรวจสอบการทำงาน
1. เปิดแอปใน browser
2. กดปุ่ม "🔧 ทดสอบ API"
3. ตรวจสอบผลลัพธ์
4. ลองแก้ไขข้อมูลลูกค้า

## การเปลี่ยนแปลงใน Google Apps Script

### เดิม (มีปัญหา)
```javascript
function doPost(e) {
  let data = JSON.parse(e.postData.contents); // ❌ Error เมื่อใช้ FormData
}
```

### ใหม่ (แก้ไขแล้ว)
```javascript
function doPost(e) {
  let data;
  
  // รองรับทั้ง JSON และ FormData
  if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
    data = JSON.parse(e.postData.contents);
  } else if (e.parameter) {
    data = e.parameter; // ✅ FormData
  } else {
    return error('No data received');
  }
}
```

## ข้อดีของการแก้ไข

### ✅ รองรับทั้ง JSON และ FormData
- JSON: ใช้ `e.postData.contents`
- FormData: ใช้ `e.parameter`

### ✅ Error Handling ที่ดีขึ้น
- ตรวจสอบข้อมูลก่อนประมวลผล
- แสดง error message ที่ชัดเจน
- เพิ่ม console.log สำหรับ debug

### ✅ Debug Information
- แสดงข้อมูลที่ได้รับ
- แสดง error ที่เกิดขึ้น
- ง่ายต่อการแก้ไขปัญหา

## ขั้นตอนการทดสอบ

### 1. ทดสอบ API
- กดปุ่ม "🔧 ทดสอบ API"
- ตรวจสอบผลลัพธ์ GET และ POST

### 2. ทดสอบแก้ไขข้อมูล
- กดปุ่ม "แก้ไข" ในแถวใดแถวหนึ่ง
- แก้ไขข้อมูล
- กดปุ่ม "บันทึกการแก้ไข"
- ตรวจสอบว่าข้อมูลอัปเดตใน Google Sheet

### 3. ตรวจสอบ Console
- เปิด Developer Tools (F12)
- ดู Console logs
- ตรวจสอบ Network requests

## หมายเหตุ
- ต้อง Deploy Google Apps Script ใหม่ทุกครั้งที่แก้ไขโค้ด
- ตรวจสอบว่า Google Sheet มี header row ที่ถูกต้อง
- ตรวจสอบ permissions ของ Google Apps Script
