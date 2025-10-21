# 🚨 แก้ไขปัญหา "Cannot read properties of undefined (reading 'contents')" อย่างเร่งด่วน

## ปัญหาที่เกิดขึ้น
```
เกิดข้อผิดพลาด: Cannot read properties of undefined (reading 'contents')
```

## สาเหตุ
Google Apps Script ยังใช้โค้ดเก่าที่พยายามอ่าน `e.postData.contents` แม้ว่าจะส่งข้อมูลเป็น FormData

## 🔥 วิธีแก้ไขเร่งด่วน

### 1. อัปเดต Google Apps Script Code
1. ไปที่ [Google Apps Script](https://script.google.com)
2. เปิดโปรเจคที่มีอยู่
3. **ลบโค้ดเก่าทั้งหมด** (Ctrl+A แล้ว Delete)
4. **วางโค้ดใหม่จากไฟล์ `GOOGLE_APPS_SCRIPT_COMPLETE.js`**
5. บันทึก (Ctrl+S)
6. **Deploy ใหม่**:
   - ไปที่ "Deploy" > "Manage deployments"
   - คลิก "Edit" (ไอคอนดินสอ)
   - คลิก "Done"
   - คลิก "Deploy"

### 2. ตรวจสอบการทำงาน
1. เปิดแอปใน browser
2. กดปุ่ม "🔧 ทดสอบ API"
3. ตรวจสอบผลลัพธ์
4. ลองแก้ไขข้อมูลลูกค้า

## 🔧 การเปลี่ยนแปลงหลัก

### เดิม (มีปัญหา)
```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents); // ❌ Error เมื่อใช้ FormData
  // ไม่มี action parameter
}
```

### ใหม่ (แก้ไขแล้ว)
```javascript
function doPost(e) {
  let data;
  
  // รองรับทั้ง JSON และ FormData
  if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
    data = JSON.parse(e.postData.contents); // JSON
  } else if (e.parameter) {
    data = e.parameter; // FormData ✅
  }
  
  const action = data.action; // ✅ ตรวจสอบ action
  
  if (action === 'addCustomer') {
    return addCustomer(data);
  } else if (action === 'updateCustomer') {
    return updateCustomer(data);
  }
}
```

## 🎯 ฟังก์ชันใหม่ที่เพิ่ม

### addCustomer(data)
- เพิ่มข้อมูลลูกค้าใหม่
- ตรวจสอบทะเบียนรถซ้ำ
- เพิ่มสูตรสำหรับคอลัมน์ J และ K

### updateCustomer(data)
- แก้ไขข้อมูลลูกค้า
- ใช้ `originalLicensePlate` เป็น key
- ตรวจสอบทะเบียนรถซ้ำ
- อัปเดตสูตรสำหรับคอลัมน์ J และ K

### deleteCustomer(data)
- ลบข้อมูลลูกค้า
- ใช้ `licensePlate` เป็น key

## 📋 ขั้นตอนการทดสอบ

### 1. ทดสอบ API
1. กดปุ่ม "🔧 ทดสอบ API"
2. ตรวจสอบผลลัพธ์ GET และ POST
3. ดู Console logs

### 2. ทดสอบแก้ไขข้อมูล
1. กดปุ่ม "แก้ไข" ในแถวใดแถวหนึ่ง
2. แก้ไขข้อมูล
3. กดปุ่ม "บันทึกการแก้ไข"
4. ตรวจสอบว่าข้อมูลอัปเดตใน Google Sheet

### 3. ตรวจสอบ Console
1. เปิด Developer Tools (F12)
2. ดู Console logs
3. ตรวจสอบ Network requests

## ⚠️ หมายเหตุสำคัญ

- **ต้อง Deploy Google Apps Script ใหม่ทุกครั้งที่แก้ไขโค้ด**
- ตรวจสอบว่า Google Sheet มี header row ที่ถูกต้อง
- ตรวจสอบ permissions ของ Google Apps Script
- ใช้ Console logs เพื่อ debug ปัญหา

## 🚀 ข้อดีของการแก้ไข

### ✅ รองรับทั้ง JSON และ FormData
- JSON: ใช้ `e.postData.contents`
- FormData: ใช้ `e.parameter`

### ✅ Action-based Processing
- `addCustomer` - เพิ่มข้อมูล
- `updateCustomer` - แก้ไขข้อมูล
- `deleteCustomer` - ลบข้อมูล

### ✅ Error Handling ที่ดีขึ้น
- ตรวจสอบข้อมูลก่อนประมวลผล
- แสดง error message ที่ชัดเจน
- เพิ่ม console.log สำหรับ debug

### ✅ รักษาฟังก์ชันเดิม
- เก็บฟังก์ชัน `sendAlert()` เดิม
- เก็บฟังก์ชัน `getDataSheet()` เดิม
- เก็บฟังก์ชัน `normalizePlate()` เดิม

## 🎉 หลังแก้ไขแล้ว
ระบบควรทำงานได้ปกติ:
- ✅ การแก้ไขข้อมูลลูกค้า
- ✅ การเพิ่มข้อมูลลูกค้า
- ✅ การลบข้อมูลลูกค้า
- ✅ การดึงข้อมูลลูกค้า
