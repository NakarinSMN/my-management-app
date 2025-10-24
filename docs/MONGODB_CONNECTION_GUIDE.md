# 🔧 คู่มือเชื่อมต่อ MongoDB แบบละเอียด

## 📋 ภาพรวม

คู่มือนี้จะสอนวิธีเชื่อมต่อ MongoDB Atlas กับแอป Next.js แบบละเอียดทุกขั้นตอน

## 🚀 ขั้นตอนที่ 1: ตั้งค่า MongoDB Atlas

### 1.1 สร้าง MongoDB Atlas Account

1. **เข้า MongoDB Atlas**
   - ไปที่ [cloud.mongodb.com](https://cloud.mongodb.com/)
   - คลิก **"Try Free"** หรือ **"Sign Up"**

2. **สร้าง Account**
   - กรอกข้อมูล Email, Password
   - ยืนยัน Email
   - Login เข้าระบบ

### 1.2 สร้าง Cluster

1. **เลือก Plan**
   - เลือก **"M0 Sandbox"** (ฟรี)
   - คลิก **"Create"**

2. **ตั้งค่า Cluster**
   - **Cloud Provider**: AWS
   - **Region**: Asia Pacific (Singapore)
   - **Cluster Name**: `Cluster0` (default)
   - คลิก **"Create Cluster"**

3. **รอให้ Cluster สร้างเสร็จ**
   - ใช้เวลาประมาณ 3-5 นาที

### 1.3 ตั้งค่า Database Access

1. **ไปที่ Database Access**
   - คลิก **"Database Access"** ในเมนูซ้าย
   - คลิก **"Add New Database User"**

2. **ตั้งค่า User**
   - **Authentication Method**: Password
   - **Username**: `nakrin_db_user`
   - **Password**: `lZNUgpbFZXgTjI35` (หรือสร้างใหม่)
   - **Database User Privileges**: Read and write to any database
   - คลิก **"Add User"**

### 1.4 ตั้งค่า Network Access

1. **ไปที่ Network Access**
   - คลิก **"Network Access"** ในเมนูซ้าย
   - คลิก **"Add IP Address"**

2. **ตั้งค่า IP Address**
   - เลือก **"Allow access from anywhere"** (0.0.0.0/0)
   - คลิก **"Confirm"**

### 1.5 สร้าง Database และ Collections

1. **เข้า Database**
   - คลิก **"Browse Collections"**
   - คลิก **"Add My Own Data"**

2. **ตั้งค่า Database**
   - **Database Name**: `tax_management`
   - **Collection Name**: `customers`
   - คลิก **"Create"**

3. **สร้าง Collection เพิ่ม**
   - คลิก **"Add Collection"**
   - **Collection Name**: `billing`
   - คลิก **"Create"**

## 🔧 ขั้นตอนที่ 2: ตั้งค่า Environment Variables

### 2.1 ตั้งค่าใน Netlify

1. **เข้า Netlify Dashboard**
   - ไปที่ [netlify.com](https://netlify.com)
   - Login เข้าระบบ

2. **เลือก Site**
   - คลิกที่ชื่อ Site ของคุณ

3. **ไปที่ Environment Variables**
   - คลิก **"Site settings"**
   - คลิก **"Environment variables"**

4. **เพิ่มตัวแปร**

   **ตัวแปรที่ 1: MONGODB_URI**
   - คลิก **"Add a variable"**
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority`
   - คลิก **"Save"**

   **ตัวแปรที่ 2: MONGODB_DATABASE**
   - คลิก **"Add a variable"**
   - **Key**: `MONGODB_DATABASE`
   - **Value**: `tax_management`
   - คลิก **"Save"**

### 2.2 ตั้งค่าใน Vercel (ทางเลือก)

1. **เข้า Vercel Dashboard**
   - ไปที่ [vercel.com](https://vercel.com)
   - Login เข้าระบบ

2. **เลือก Project**
   - คลิกที่ชื่อ Project ของคุณ

3. **ไปที่ Environment Variables**
   - คลิก **"Settings"**
   - คลิก **"Environment Variables"**

4. **เพิ่มตัวแปร**
   - เพิ่ม `MONGODB_URI` และ `MONGODB_DATABASE`
   - คลิก **"Save"**

## 🧪 ขั้นตอนที่ 3: ทดสอบการเชื่อมต่อ

### 3.1 ทดสอบใน Local

1. **สร้างไฟล์ .env.local**
   ```bash
   # .env.local
   MONGODB_URI=mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority
   MONGODB_DATABASE=tax_management
   ```

2. **รัน Development Server**
   ```bash
   npm run dev
   ```

3. **ทดสอบหน้า Debug**
   - ไปที่ `http://localhost:3000/debug-mongodb`
   - คลิก **"เริ่ม Debug MongoDB"**
   - ดูผลลัพธ์การทดสอบ

### 3.2 ทดสอบใน Production

1. **Redeploy Site**
   - ใน Netlify: ไปที่ **"Deploys"** > **"Trigger deploy"**
   - ใน Vercel: ไปที่ **"Deployments"** > **"Redeploy"**

2. **ทดสอบหน้า Debug**
   - ไปที่ `https://your-domain.com/debug-mongodb`
   - คลิก **"เริ่ม Debug MongoDB"**
   - ดูผลลัพธ์การทดสอบ

## 🔍 ขั้นตอนที่ 4: ตรวจสอบปัญหา

### 4.1 ตรวจสอบ MongoDB Atlas

1. **ตรวจสอบ Network Access**
   - ไปที่ **Network Access**
   - ตรวจสอบว่า IP Address ถูกต้อง
   - ควรมี `0.0.0.0/0` (Allow access from anywhere)

2. **ตรวจสอบ Database Access**
   - ไปที่ **Database Access**
   - ตรวจสอบ Username และ Password
   - ตรวจสอบ Privileges

3. **ตรวจสอบ Cluster Status**
   - ไปที่ **Database**
   - ตรวจสอบว่า Cluster ทำงานปกติ
   - ตรวจสอบ Collections

### 4.2 ตรวจสอบ Environment Variables

1. **ตรวจสอบใน Netlify**
   - ไปที่ **Site settings** > **Environment variables**
   - ตรวจสอบว่า `MONGODB_URI` และ `MONGODB_DATABASE` ตั้งค่าแล้ว

2. **ตรวจสอบใน Vercel**
   - ไปที่ **Settings** > **Environment Variables**
   - ตรวจสอบว่าตัวแปรตั้งค่าแล้ว

### 4.3 ตรวจสอบ Logs

1. **ตรวจสอบใน Netlify**
   - ไปที่ **Functions** > **Logs**
   - ดู error messages

2. **ตรวจสอบใน Vercel**
   - ไปที่ **Functions** > **Logs**
   - ดู error messages

## 🚀 ขั้นตอนที่ 5: Migration ข้อมูล

### 5.1 รัน Migration Script

1. **สร้างไฟล์ Migration**
   ```bash
   # scripts/migrate-to-mongodb.js
   node scripts/migrate-to-mongodb.js
   ```

2. **ตรวจสอบข้อมูล**
   - ไปที่ MongoDB Atlas
   - ตรวจสอบ Collections
   - ตรวจสอบข้อมูล

### 5.2 ทดสอบ API Endpoints

1. **ทดสอบ Customers API**
   ```bash
   curl https://your-domain.com/api/customers
   ```

2. **ทดสอบ Billing API**
   ```bash
   curl https://your-domain.com/api/billing
   ```

## 📋 Checklist การเชื่อมต่อ

### MongoDB Atlas
- [ ] ✅ สร้าง Account
- [ ] ✅ สร้าง Cluster
- [ ] ✅ ตั้งค่า Database Access
- [ ] ✅ ตั้งค่า Network Access
- [ ] ✅ สร้าง Database และ Collections

### Environment Variables
- [ ] ✅ ตั้งค่า MONGODB_URI
- [ ] ✅ ตั้งค่า MONGODB_DATABASE
- [ ] ✅ ตรวจสอบค่าในตัวแปร

### Testing
- [ ] ✅ ทดสอบใน Local
- [ ] ✅ ทดสอบใน Production
- [ ] ✅ ตรวจสอบ Logs
- [ ] ✅ Migration ข้อมูล

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังเชื่อมต่อสำเร็จ ควรจะเห็น:

```
✅ MongoDB Connection สำเร็จ
✅ Network Connectivity สำเร็จ
✅ Authentication สำเร็จ
✅ Database Access สำเร็จ
✅ API Endpoints ทำงานได้
✅ ข้อมูล Migration สำเร็จ
```

## 🆘 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **MongoDB Connection ล้มเหลว**
   - ตรวจสอบ Network Access
   - ตรวจสอบ Database Access
   - ตรวจสอบ Connection String

2. **Environment Variables ไม่ทำงาน**
   - ตรวจสอบการตั้งค่าใน Platform
   - Redeploy หลังตั้งค่า Environment Variables

3. **API Endpoints ไม่ทำงาน**
   - ตรวจสอบ MongoDB Connection
   - ตรวจสอบ Environment Variables
   - ตรวจสอบ Logs

### วิธีแก้ไข

1. **ตรวจสอบ MongoDB Atlas**
   - Network Access: Allow access from anywhere
   - Database Access: Read and write to any database
   - Connection String: ตรวจสอบ format

2. **ตรวจสอบ Environment Variables**
   - ตรวจสอบการตั้งค่าใน Platform
   - ตรวจสอบค่าในตัวแปร
   - Redeploy หลังตั้งค่า

3. **ตรวจสอบ Logs**
   - ดู error messages
   - ตรวจสอบ MongoDB connection errors

## 📞 ติดต่อ

- **MongoDB Atlas Support**: [support.mongodb.com](https://support.mongodb.com)
- **Netlify Support**: [support.netlify.com](https://support.netlify.com)
- **Vercel Support**: [vercel.com/help](https://vercel.com/help)

## 🎉 สรุป

คู่มือนี้ครอบคลุมทุกขั้นตอนการเชื่อมต่อ MongoDB Atlas กับแอป Next.js ครับ!

### ขั้นตอนหลัก:
1. **ตั้งค่า MongoDB Atlas**
2. **ตั้งค่า Environment Variables**
3. **ทดสอบการเชื่อมต่อ**
4. **ตรวจสอบปัญหา**
5. **Migration ข้อมูล**

ดูคู่มือเพิ่มเติมใน `docs/MONGODB_QUICK_FIX.md` และ `docs/MONGODB_TROUBLESHOOTING.md` ครับ! 🚀
