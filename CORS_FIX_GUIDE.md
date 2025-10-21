# แก้ไขปัญหา CORS ใน Google Apps Script

## ปัญหาที่เกิดขึ้น
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## วิธีแก้ไข

### 1. ใช้ FormData แทน JSON (✅ ทำแล้ว)
- เปลี่ยนจาก `JSON.stringify()` เป็น `FormData`
- หลีกเลี่ยง CORS preflight request
- Google Apps Script รองรับ FormData โดยอัตโนมัติ

### 2. อัปเดต Google Apps Script Code
1. ไปที่ [Google Apps Script](https://script.google.com)
2. เปิดโปรเจคที่มีอยู่
3. แทนที่โค้ดทั้งหมดด้วยโค้ดจากไฟล์ `GOOGLE_APPS_SCRIPT_UPDATED.js`
4. บันทึกและ Deploy ใหม่

### 3. ตรวจสอบการตั้งค่า Google Apps Script
1. ไปที่ "Deploy" > "Manage deployments"
2. คลิก "Edit" (ไอคอนดินสอ)
3. ตรวจสอบการตั้งค่า:
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. คลิก "Done"

### 4. ทดสอบการเชื่อมต่อ
1. เปิดแอปใน browser
2. กดปุ่ม "🔧 ทดสอบ API"
3. ตรวจสอบผลลัพธ์ใน Console

## การเปลี่ยนแปลงที่ทำ

### Frontend (React)
```javascript
// เดิม (มีปัญหา CORS)
const response = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// ใหม่ (แก้ไข CORS)
const formData = new FormData();
Object.keys(data).forEach(key => {
  formData.append(key, data[key]);
});

const response = await fetch(URL, {
  method: 'POST',
  body: formData
});
```

### Backend (Google Apps Script)
```javascript
// รองรับทั้ง JSON และ FormData
function doPost(e) {
  let data;
  
  if (e.postData && e.postData.type === 'application/json') {
    data = JSON.parse(e.postData.contents);
  } else {
    data = e.parameter; // FormData
  }
  
  // ใช้งาน data ตามปกติ
}
```

## ข้อดีของการใช้ FormData
- ✅ หลีกเลี่ยง CORS preflight request
- ✅ Google Apps Script รองรับโดยอัตโนมัติ
- ✅ ไม่ต้องตั้งค่า CORS headers
- ✅ ทำงานได้กับ localhost และ production

## หมายเหตุ
- FormData จะส่งข้อมูลเป็น `multipart/form-data`
- Google Apps Script จะรับข้อมูลผ่าน `e.parameter`
- ไม่ต้องเปลี่ยน URL หรือการตั้งค่าอื่นๆ
