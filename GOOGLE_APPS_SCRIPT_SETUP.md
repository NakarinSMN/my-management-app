# การตั้งค่า Google Apps Script สำหรับระบบจัดการข้อมูลลูกค้า

## ขั้นตอนการตั้งค่า

### 1. สร้าง Google Sheet
1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างสเปรดชีตใหม่
3. ตั้งชื่อคอลัมน์ในแถวแรก:
   - A1: ทะเบียนรถ
   - B1: ชื่อลูกค้า
   - C1: เบอร์ติดต่อ
   - D1: วันที่ชำระภาษีล่าสุด
   - E1: สถานะ
   - F1: ยี่ห้อ/รุ่น
   - G1: หมายเหตุ

### 2. สร้าง Google Apps Script
1. ไปที่ [Google Apps Script](https://script.google.com)
2. สร้างโปรเจคใหม่
3. วางโค้ดจากไฟล์ `google-apps-script-example.js`
4. บันทึกโปรเจค

### 3. ตั้งค่า Web App
1. ใน Google Apps Script Editor คลิก "Deploy" > "New deployment"
2. เลือก Type: "Web app"
3. ตั้งค่า:
   - Execute as: "Me"
   - Who has access: "Anyone"
4. คลิก "Deploy"
5. คัดลอก URL ที่ได้

### 4. อัปเดต URL ในแอป
1. เปิดไฟล์ `src/app/customer-info/page.tsx`
2. แก้ไข URL ในบรรทัดที่ 158:
   ```typescript
   const GOOGLE_SHEET_CUSTOMER_API_URL: string = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```

3. เปิดไฟล์ `src/app/components/AddCustomerForm.tsx`
4. แก้ไข URL ในบรรทัดที่ 4:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```

5. เปิดไฟล์ `src/app/components/EditCustomerForm.tsx`
6. แก้ไข URL ในบรรทัดที่ 4:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```

## ฟีเจอร์ที่รองรับ

### API Endpoints

#### 1. ดึงข้อมูลลูกค้าทั้งหมด
- **Method**: GET
- **URL**: `YOUR_SCRIPT_URL?getAll=1`
- **Response**: JSON array ของข้อมูลลูกค้า

#### 2. เพิ่มข้อมูลลูกค้า
- **Method**: POST
- **URL**: `YOUR_SCRIPT_URL`
- **Body**:
  ```json
  {
    "action": "addCustomer",
    "licensePlate": "กข-1234",
    "customerName": "ชื่อลูกค้า",
    "phone": "0812345678",
    "registerDate": "01/01/2024",
    "status": "รอดำเนินการ",
    "brand": "Toyota Camry",
    "note": "หมายเหตุ"
  }
  ```

#### 3. แก้ไขข้อมูลลูกค้า
- **Method**: POST
- **URL**: `YOUR_SCRIPT_URL`
- **Body**:
  ```json
  {
    "action": "updateCustomer",
    "originalLicensePlate": "กข-1234",
    "licensePlate": "กข-5678",
    "customerName": "ชื่อลูกค้าใหม่",
    "phone": "0812345678",
    "registerDate": "01/01/2024",
    "status": "ต่อภาษีแล้ว",
    "brand": "Honda Civic",
    "note": "หมายเหตุใหม่"
  }
  ```

#### 4. ลบข้อมูลลูกค้า
- **Method**: POST
- **URL**: `YOUR_SCRIPT_URL`
- **Body**:
  ```json
  {
    "action": "deleteCustomer",
    "licensePlate": "กข-1234"
  }
  ```

## การแก้ไขปัญหา

### 1. ข้อผิดพลาด CORS
- ตรวจสอบว่า Google Apps Script ตั้งค่าเป็น "Anyone" access
- ตรวจสอบ URL ว่าถูกต้อง

### 2. ข้อผิดพลาด JSON
- ตรวจสอบว่า Google Sheet มี header row ที่ถูกต้อง
- ตรวจสอบว่า Google Apps Script ได้รับการ deploy แล้ว

### 3. ข้อมูลไม่แสดง
- ตรวจสอบว่า Google Sheet มีข้อมูล
- ตรวจสอบ console.log ใน browser developer tools

## หมายเหตุ
- ระบบจะใช้ทะเบียนรถเป็น unique identifier
- วันที่ต้องอยู่ในรูปแบบ DD/MM/YYYY
- สถานะที่รองรับ: ต่อภาษีแล้ว, กำลังจะครบกำหนด, ใกล้ครบกำหนด, เกินกำหนด, รอดำเนินการ
