# 📋 คู่มือสร้าง Collections ใน MongoDB Atlas

## 🎯 เป้าหมาย

สร้าง Collections ที่จำเป็นสำหรับแอป:
- **Collection**: `customers`
- **Collection**: `billing`

## 🚀 ขั้นตอนการสร้าง

### 1. เข้า MongoDB Atlas Dashboard

1. **เข้า MongoDB Atlas**
   - ไปที่ [cloud.mongodb.com](https://cloud.mongodb.com/)
   - Login เข้าระบบ

2. **เลือก Project และ Cluster**
   - เลือก Project ของคุณ
   - คลิกที่ Cluster name

### 2. เข้า Database

1. **ไปที่ Database**
   - คลิก **"Database"** ในเมนูซ้าย
   - หรือคลิก **"Browse Collections"** ในหน้า Overview

2. **เลือก Database**
   - เลือก Database `tax_management`
   - หากไม่มี ให้สร้างใหม่

### 3. สร้าง Collection: customers

1. **คลิก "Add Collection"**
   - คลิกปุ่ม **"+ Add Collection"**

2. **ตั้งค่า Collection**
   - **Database Name**: `tax_management`
   - **Collection Name**: `customers`
   - คลิก **"Create"**

3. **เพิ่มข้อมูลตัวอย่าง (Optional)**
   ```json
   {
     "licensePlate": "กข-1234",
     "customerName": "ตัวอย่าง ลูกค้า",
     "phone": "080-000-0000",
     "registerDate": "2024-01-01",
     "status": "ต่อภาษีแล้ว",
     "note": "หมายเหตุ",
     "userId": "USER123",
     "day": 365,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

### 4. สร้าง Collection: billing

1. **คลิก "Add Collection"**
   - คลิกปุ่ม **"+ Add Collection"**

2. **ตั้งค่า Collection**
   - **Database Name**: `tax_management`
   - **Collection Name**: `billing`
   - คลิก **"Create"**

3. **เพิ่มข้อมูลตัวอย่าง (Optional)**
   ```json
   {
     "billNumber": "BILL-001",
     "customerName": "ตัวอย่าง ลูกค้า",
     "service": "ต่อภาษีรถยนต์",
     "category": "ภาษี",
     "price": 1000,
     "date": "2024-01-01",
     "phone": "080-000-0000",
     "status": "ชำระแล้ว",
     "items": "รายการและยอดเงิน",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## 🔍 ตรวจสอบ Collections

### 1. ตรวจสอบใน MongoDB Atlas

1. **ไปที่ Database**
   - คลิก **"Database"** > **"Browse Collections"**

2. **ตรวจสอบ Collections**
   - ควรเห็น `customers` และ `billing` ใน database `tax_management`

### 2. ทดสอบการเชื่อมต่อ

1. **ทดสอบใน Local**
   ```bash
   npm run dev
   ```
   - ไปที่ `http://localhost:3000/debug-mongodb`
   - คลิก **"เริ่ม Debug MongoDB"**

2. **ทดสอบใน Production**
   - ไปที่ `https://managemenapp.netlify.app/debug-mongodb`
   - คลิก **"เริ่ม Debug MongoDB"**

## 📋 Checklist

- [ ] ✅ เข้า MongoDB Atlas Dashboard
- [ ] ✅ เลือก Database `tax_management`
- [ ] ✅ สร้าง Collection `customers`
- [ ] ✅ สร้าง Collection `billing`
- [ ] ✅ ตรวจสอบ Collections
- [ ] ✅ ทดสอบการเชื่อมต่อ

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังสร้าง Collections แล้ว ควรจะเห็น:

```
✅ MongoDB Connection สำเร็จ
✅ Network Connectivity สำเร็จ
✅ Authentication สำเร็จ
✅ Database Access สำเร็จ
✅ Collections พบแล้ว
✅ ข้อมูลแสดงใน Production
```

## 🆘 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Collection ไม่พบ**
   - ตรวจสอบว่า Collection อยู่ใน Database ที่ถูกต้อง
   - ตรวจสอบชื่อ Collection (case-sensitive)

2. **Database ไม่พบ**
   - ตรวจสอบว่า Database `tax_management` มีอยู่
   - หากไม่มี ให้สร้างใหม่

3. **การเชื่อมต่อล้มเหลว**
   - ตรวจสอบ Network Access
   - ตรวจสอบ Database Access
   - ตรวจสอบ Environment Variables

### วิธีแก้ไข

1. **ตรวจสอบ MongoDB Atlas**
   - Network Access: Allow access from anywhere
   - Database Access: Read and write to any database
   - Collections: customers และ billing

2. **ตรวจสอบ Environment Variables**
   - ตรวจสอบการตั้งค่าใน Netlify
   - ตรวจสอบค่าในตัวแปร
   - Redeploy หลังตั้งค่า

3. **ตรวจสอบ Logs**
   - ดู error messages ใน Netlify Functions
   - ดู connection logs ใน MongoDB Atlas

## 🚀 พร้อมใช้งานแล้ว!

ตอนนี้คุณสามารถ:

1. **สร้าง Collections ใน MongoDB Atlas**
2. **ทดสอบการเชื่อมต่อ**
3. **ดูข้อมูลใน Production**

ดูคู่มือเพิ่มเติมใน `docs/MONGODB_CONNECTION_GUIDE.md` ครับ! 🎉
