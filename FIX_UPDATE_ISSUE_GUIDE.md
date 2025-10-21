# คู่มือแก้ไขปัญหา: แก้ไขข้อมูลแล้วไปเพิ่มในฐานข้อมูลแทน

## ปัญหา
เมื่อกดแก้ไขข้อมูลลูกค้า ระบบไม่แก้ไขแถวเดิม แต่ไปเพิ่มแถวใหม่แทน

## สาเหตุที่เป็นไปได้
1. Google Apps Script ไม่ได้รับค่า `action: 'updateCustomer'` 
2. Google Apps Script ค้นหา `originalLicensePlate` ไม่เจอ
3. Google Apps Script ที่ deploy อยู่ไม่ใช่เวอร์ชันล่าสุด

## การแก้ไข

### 1. อัปเดต Google Apps Script

**ขั้นตอน:**
1. เปิด Google Apps Script Editor
2. ลบโค้ดเก่าทั้งหมด
3. คัดลอกโค้ดจากไฟล์ `GOOGLE_APPS_SCRIPT_FINAL_FIX.js`
4. วางโค้ดทั้งหมดใน Google Apps Script Editor
5. บันทึก (Ctrl+S)
6. **Deploy ใหม่:**
   - คลิก "Deploy" → "Manage deployments"
   - คลิกที่ไอคอน "Edit" (ดินสอ) ของ deployment ที่มีอยู่
   - เลือก "New version" ในช่อง "Version"
   - คลิก "Deploy"
   - **หมายเหตุ: URL จะยังคงเหมือนเดิม** (ไม่ต้องเปลี่ยน URL ใน Frontend)

### 2. การทดสอบ

**ขั้นตอนการทดสอบ:**

1. เปิด Google Apps Script Editor
2. คลิก "Executions" ในเมนูด้านซ้าย
3. เปิดหน้าเว็บแอปพลิเคชัน
4. ทดสอบแก้ไขข้อมูล
5. เปิด Developer Console (F12)
6. ตรวจสอบ console logs:

**ใน Browser Console ควรเห็น:**
```
=== DEBUG EDIT FORM ===
customerData (original): {licensePlate: "...", ...}
formData (current): {licensePlate: "...", ...}
originalLicensePlate: ...
Sending update data: {action: "updateCustomer", ...}
```

**ใน Google Apps Script Logs ควรเห็น:**
```
=== UPDATE CUSTOMER ===
Updating customer: {...}
originalLicensePlate: ...
licensePlate: ...
Total rows: ...
Looking for originalLicensePlate: ...
Row 1: comparing "..." with "..."
Found matching row: ...
Final targetRow: ...
```

### 3. การแก้ไขเพิ่มเติม

**ถ้ายังเจอปัญหา:**

#### ปัญหา 1: `targetRow = -1` (ไม่พบข้อมูล)
- **สาเหตุ:** ทะเบียนรถในชีตและที่ส่งมาไม่ตรงกัน (อาจมี whitespace หรือ case ต่างกัน)
- **วิธีแก้:** ฟังก์ชัน `normalizePlate` จะช่วยแก้ไขปัญหานี้โดยอัตโนมัติ

#### ปัญหา 2: `action` ไม่ถูกส่ง
- **วิธีแก้:** ตรวจสอบใน Browser Console ว่า `updateData` มี `action: 'updateCustomer'` หรือไม่

#### ปัญหา 3: Google Apps Script ยังเป็นเวอร์ชันเก่า
- **วิธีแก้:** Deploy ใหม่อีกครั้งและรอสักครู่ (1-2 นาที) เพื่อให้ระบบอัปเดต

### 4. ตรวจสอบข้อมูล

**ตรวจสอบใน Google Sheet:**
1. เปิด Google Sheet
2. ดูว่าข้อมูลถูกแก้ไขที่แถวเดิมหรือไม่
3. ตรวจสอบว่าไม่มีแถวซ้ำ

**ตรวจสอบ Execution Logs:**
1. เปิด Google Apps Script Editor
2. คลิก "Executions" 
3. ดู logs ของการ execute ล่าสุด
4. ตรวจสอบว่ามี error หรือไม่

### 5. Code Changes Summary

**Frontend Changes:**
- เพิ่ม `brand` และ `note` ใน `CustomerData` interface
- ปรับ `EditCustomerForm` ให้รับและส่งข้อมูลครบถ้วน
- เพิ่ม debug logs

**Backend Changes:**
- เพิ่มฟังก์ชัน `normalizePlate` เพื่อ normalize ทะเบียนรถ
- เพิ่ม debug logs ใน `updateCustomer`
- แก้ไขการค้นหาแถวให้ใช้ `normalizePlate`

## ผลลัพธ์ที่คาดหวัง
- เมื่อกดแก้ไขข้อมูล ระบบจะแก้ไขแถวเดิมใน Google Sheet
- ไม่มีการเพิ่มแถวซ้ำ
- ระบบแสดงข้อความ "แก้ไขข้อมูลลูกค้าสำเร็จ"

## หมายเหตุ
- ต้อง Deploy Google Apps Script ใหม่ทุกครั้งที่แก้ไขโค้ด
- รอสักครู่ (1-2 นาที) หลัง Deploy เพื่อให้ระบบอัปเดต
- ตรวจสอบ logs ทั้งใน Browser และ Google Apps Script

