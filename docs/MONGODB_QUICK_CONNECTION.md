# ⚡ MongoDB Quick Connection Guide

## 🚀 เชื่อมต่อ MongoDB แบบเร่งด่วน

### ขั้นตอนที่ 1: ตั้งค่า MongoDB Atlas

#### 1.1 สร้าง Account และ Cluster
1. **เข้า MongoDB Atlas**
   - ไปที่ [cloud.mongodb.com](https://cloud.mongodb.com/)
   - คลิก **"Try Free"** > สร้าง Account

2. **สร้าง Cluster**
   - เลือก **"M0 Sandbox"** (ฟรี)
   - **Region**: Asia Pacific (Singapore)
   - คลิก **"Create Cluster"**

#### 1.2 ตั้งค่า Database Access
1. **ไปที่ Database Access**
   - คลิก **"Database Access"** ในเมนูซ้าย
   - คลิก **"Add New Database User"**

2. **ตั้งค่า User**
   - **Username**: `nakrin_db_user`
   - **Password**: `lZNUgpbFZXgTjI35`
   - **Privileges**: Read and write to any database
   - คลิก **"Add User"**

#### 1.3 ตั้งค่า Network Access
1. **ไปที่ Network Access**
   - คลิก **"Network Access"** ในเมนูซ้าย
   - คลิก **"Add IP Address"**

2. **ตั้งค่า IP Address**
   - เลือก **"Allow access from anywhere"** (0.0.0.0/0)
   - คลิก **"Confirm"**

#### 1.4 สร้าง Database
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

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

#### 2.1 ใน Netlify
1. **เข้า Netlify Dashboard**
   - ไปที่ [netlify.com](https://netlify.com)
   - เลือก Site ของคุณ

2. **ไปที่ Environment Variables**
   - คลิก **"Site settings"**
   - คลิก **"Environment variables"**

3. **เพิ่มตัวแปร**

   **MONGODB_URI:**
   - คลิก **"Add a variable"**
   - **Key**: `MONGODB_URI`
   - **Value**: `mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority`
   - คลิก **"Save"**

   **MONGODB_DATABASE:**
   - คลิก **"Add a variable"**
   - **Key**: `MONGODB_DATABASE`
   - **Value**: `tax_management`
   - คลิก **"Save"**

#### 2.2 ใน Vercel (ทางเลือก)
1. **เข้า Vercel Dashboard**
   - ไปที่ [vercel.com](https://vercel.com)
   - เลือก Project ของคุณ

2. **ไปที่ Environment Variables**
   - คลิก **"Settings"**
   - คลิก **"Environment Variables"**

3. **เพิ่มตัวแปร**
   - เพิ่ม `MONGODB_URI` และ `MONGODB_DATABASE`
   - คลิก **"Save"**

### ขั้นตอนที่ 3: ทดสอบการเชื่อมต่อ

#### 3.1 ทดสอบใน Local
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

#### 3.2 ทดสอบใน Production
1. **Redeploy Site**
   - ใน Netlify: ไปที่ **"Deploys"** > **"Trigger deploy"**
   - ใน Vercel: ไปที่ **"Deployments"** > **"Redeploy"**

2. **ทดสอบหน้า Debug**
   - ไปที่ `https://your-domain.com/debug-mongodb`
   - คลิก **"เริ่ม Debug MongoDB"**

## 🔍 ตรวจสอบปัญหา

### 1. MongoDB Atlas
- [ ] ✅ Network Access: Allow access from anywhere (0.0.0.0/0)
- [ ] ✅ Database Access: Read and write to any database
- [ ] ✅ Username: nakrin_db_user
- [ ] ✅ Password: lZNUgpbFZXgTjI35

### 2. Environment Variables
- [ ] ✅ MONGODB_URI ตั้งค่าแล้ว
- [ ] ✅ MONGODB_DATABASE ตั้งค่าแล้ว
- [ ] ✅ ค่าในตัวแปรถูกต้อง

### 3. Testing
- [ ] ✅ ทดสอบใน Local
- [ ] ✅ ทดสอบใน Production
- [ ] ✅ ตรวจสอบ Logs

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังเชื่อมต่อสำเร็จ ควรจะเห็น:

```
✅ MongoDB Connection สำเร็จ
✅ Network Connectivity สำเร็จ
✅ Authentication สำเร็จ
✅ Database Access สำเร็จ
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

## 📋 Checklist

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

## 🚀 พร้อมเชื่อมต่อแล้ว!

คู่มือนี้ครอบคลุมทุกขั้นตอนการเชื่อมต่อ MongoDB Atlas ครับ!

### ขั้นตอนหลัก:
1. **ตั้งค่า MongoDB Atlas**
2. **ตั้งค่า Environment Variables**
3. **ทดสอบการเชื่อมต่อ**

ดูคู่มือเพิ่มเติมใน `docs/MONGODB_CONNECTION_GUIDE.md` สำหรับรายละเอียดเพิ่มเติมครับ! 🎉
