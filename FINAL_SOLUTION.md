# แก้ไขปัญหา Google Apps Script ให้รองรับ FormData

## ปัญหาที่พบ
1. **doPost ใช้ `JSON.parse(e.postData.contents)`** - ไม่รองรับ FormData
2. **ไม่มี action parameter** - ไม่รู้ว่าต้องทำอะไร
3. **โครงสร้างข้อมูลไม่ตรงกัน** - ชื่อฟิลด์ไม่ตรงกับที่ส่งมา

## วิธีแก้ไข

### 1. อัปเดต Google Apps Script Code
1. ไปที่ [Google Apps Script](https://script.google.com)
2. เปิดโปรเจคที่มีอยู่
3. **ลบโค้ดเก่าทั้งหมด**
4. **วางโค้ดใหม่จากไฟล์ `GOOGLE_APPS_SCRIPT_FIXED.js`**
5. บันทึก (Ctrl+S)
6. Deploy ใหม่:
   - ไปที่ "Deploy" > "Manage deployments"
   - คลิก "Edit" (ไอคอนดินสอ)
   - คลิก "Done"
   - คลิก "Deploy"

### 2. การเปลี่ยนแปลงหลัก

#### เดิม (มีปัญหา)
```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents); // ❌ ไม่รองรับ FormData
  // ไม่มี action parameter
}
```

#### ใหม่ (แก้ไขแล้ว)
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

### 3. ฟังก์ชันใหม่ที่เพิ่ม

#### addCustomer(data)
- เพิ่มข้อมูลลูกค้าใหม่
- ตรวจสอบทะเบียนรถซ้ำ
- เพิ่มสูตรสำหรับคอลัมน์ J และ K

#### updateCustomer(data)
- แก้ไขข้อมูลลูกค้า
- ใช้ `originalLicensePlate` เป็น key
- ตรวจสอบทะเบียนรถซ้ำ
- อัปเดตสูตรสำหรับคอลัมน์ J และ K

#### deleteCustomer(data)
- ลบข้อมูลลูกค้า
- ใช้ `licensePlate` เป็น key

### 4. การทดสอบ

#### ทดสอบ API
1. กดปุ่ม "🔧 ทดสอบ API"
2. ตรวจสอบผลลัพธ์ GET และ POST
3. ดู Console logs

#### ทดสอบแก้ไขข้อมูล
1. กดปุ่ม "แก้ไข" ในแถวใดแถวหนึ่ง
2. แก้ไขข้อมูล
3. กดปุ่ม "บันทึกการแก้ไข"
4. ตรวจสอบว่าข้อมูลอัปเดตใน Google Sheet

### 5. Debug Information
โค้ดใหม่มี debug logs เพิ่มขึ้น:
```javascript
console.log('=== DEBUG INFO ===');
console.log('e.parameter:', e.parameter);
console.log('e.postData:', e.postData);
console.log('Final data:', data);
```

### 6. ข้อดีของการแก้ไข

#### ✅ รองรับทั้ง JSON และ FormData
- JSON: ใช้ `e.postData.contents`
- FormData: ใช้ `e.parameter`

#### ✅ Action-based Processing
- `addCustomer` - เพิ่มข้อมูล
- `updateCustomer` - แก้ไขข้อมูล
- `deleteCustomer` - ลบข้อมูล

#### ✅ Error Handling ที่ดีขึ้น
- ตรวจสอบข้อมูลก่อนประมวลผล
- แสดง error message ที่ชัดเจน
- เพิ่ม console.log สำหรับ debug

#### ✅ รักษาฟังก์ชันเดิม
- เก็บฟังก์ชัน `sendAlert()` เดิม
- เก็บฟังก์ชัน `getDataSheet()` เดิม
- เก็บฟังก์ชัน `normalizePlate()` เดิม

## หมายเหตุ
- ต้อง Deploy Google Apps Script ใหม่ทุกครั้งที่แก้ไขโค้ด
- ตรวจสอบว่า Google Sheet มี header row ที่ถูกต้อง
- ตรวจสอบ permissions ของ Google Apps Script
- ใช้ Console logs เพื่อ debug ปัญหา
