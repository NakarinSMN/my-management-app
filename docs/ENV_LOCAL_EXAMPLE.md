# 🔧 .env.local Configuration

## 📋 Environment Variables ที่ต้องตั้งค่า

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค:

```bash
# MongoDB Atlas Configuration (อัพเดท Password ใหม่)
MONGODB_URI=mongodb+srv://nakrin_db_user:KE63EQKy8tjo0Mj9@cluster0.bldg8xo.mongodb.net/tax_management?retryWrites=true&w=majority
MONGODB_DATABASE=tax_management

# Google Sheets API (สำหรับ Migration)
GOOGLE_SHEET_CUSTOMER_API_URL=https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1
GOOGLE_SHEET_BILLING_API_URL=https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU/exec?getBills=1
```

## 🚀 ขั้นตอนการตั้งค่า

### 1. สร้างไฟล์ .env.local

1. **สร้างไฟล์ใหม่**
   - สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค
   - คัดลอกเนื้อหาข้างต้นใส่ไฟล์

2. **ตรวจสอบไฟล์**
   - ตรวจสอบว่าไฟล์ `.env.local` อยู่ในโฟลเดอร์ root
   - ตรวจสอบว่าไม่มีไฟล์ `.env.local` ใน `.gitignore`

### 2. ตั้งค่า Environment Variables ใน Netlify

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
   - **Value**: `mongodb+srv://nakrin_db_user:KE63EQKy8tjo0Mj9@cluster0.bldg8xo.mongodb.net/tax_management?retryWrites=true&w=majority`
   - คลิก **"Save"**

   **MONGODB_DATABASE:**
   - คลิก **"Add a variable"**
   - **Key**: `MONGODB_DATABASE`
   - **Value**: `tax_management`
   - คลิก **"Save"**

### 3. ทดสอบการเชื่อมต่อ

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

- [ ] ✅ สร้างไฟล์ `.env.local`
- [ ] ✅ ตั้งค่า MONGODB_URI
- [ ] ✅ ตั้งค่า MONGODB_DATABASE
- [ ] ✅ ตั้งค่า Environment Variables ใน Netlify
- [ ] ✅ ทดสอบการเชื่อมต่อใน Local
- [ ] ✅ ทดสอบการเชื่อมต่อใน Production

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังตั้งค่าแล้ว ควรจะเห็น:

```
✅ MongoDB Connection สำเร็จ
✅ Network Connectivity สำเร็จ
✅ Authentication สำเร็จ
✅ Database Access สำเร็จ
```

## 🚀 พร้อมใช้งานแล้ว!

ตอนนี้คุณสามารถ:

1. **สร้างไฟล์ `.env.local`**
2. **ตั้งค่า Environment Variables ใน Netlify**
3. **ทดสอบการเชื่อมต่อ**

ดูคู่มือเพิ่มเติมใน `docs/MONGODB_CONNECTION_GUIDE.md` ครับ! 🎉
