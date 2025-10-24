# 🚀 คู่มือ Deploy ไป Netlify

## 📋 **ปัญหาที่พบ**

### **❌ Build Error:**
```
Error: Please add your MongoDB URI to .env.local
Failed to collect page data for /api/billing
```

### **🔍 สาเหตุ:**
- MongoDB URI ไม่มีใน Netlify Environment Variables
- Code throw error ตอน build time แทนที่จะเป็น runtime error

---

## 🔧 **วิธีแก้ไข**

### **ขั้นตอนที่ 1: ตั้งค่า Environment Variables ใน Netlify**

#### **1.1 ไปที่ Netlify Dashboard**
```
🌐 https://app.netlify.com/
```

#### **1.2 เลือก Site ของคุณ**
- คลิกที่ site name

#### **1.3 ไปที่ Site Settings**
- คลิก **"Site settings"**
- เลือก **"Build & deploy"**
- เลือก **"Environment"**

#### **1.4 เพิ่ม Environment Variables**
```
Key: MONGODB_URI
Value: mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority

Key: MONGODB_DATABASE
Value: tax_management
```

#### **1.5 Save และ Redeploy**
- คลิก **"Save"**
- ไปที่ **"Deploys"** tab
- คลิก **"Trigger deploy"** → **"Deploy site"**

---

## 🔧 **การแก้ไข Code (เสร็จแล้ว)**

### **✅ แก้ไข MongoDB Connection:**
- **ลบ throw error ตอน module load**
- **ย้าย environment check ไปใน function**
- **เพิ่ม lazy initialization**

### **✅ Code Changes:**
```typescript
// BEFORE (problematic)
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

// AFTER (safe)
const getMongoConfig = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MongoDB URI not found in environment variables');
    return null;
  }
  return { uri, dbName };
};
```

---

## 📊 **Environment Variables ที่ต้องตั้งค่า**

### **ใน Netlify Dashboard:**
```
MONGODB_URI=mongodb+srv://nakrin_db_user:lZNUgpbFZXgTjI35@cluster0.b1dg8xo.mongodb.net/tax_management?retryWrites=true&w=majority
MONGODB_DATABASE=tax_management
```

### **⚠️ ข้อสำคัญ:**
- **ห้าม commit .env.local** ไปใน repository
- **ใช้ Netlify Environment Variables** แทน
- **MongoDB URI ต้องถูกต้อง**

---

## 🚀 **ขั้นตอน Deploy**

### **1. ตั้งค่า Environment Variables**
- ตามขั้นตอนข้างต้น

### **2. Redeploy**
- ไปที่ Netlify Dashboard
- คลิก **"Trigger deploy"**

### **3. ตรวจสอบ Build Logs**
- ดูว่า build สำเร็จหรือไม่
- ตรวจสอบ environment variables

### **4. ทดสอบ API**
- ไปที่ `https://your-site.netlify.app/api/customers`
- ตรวจสอบว่า API ทำงานได้

---

## 🔍 **Troubleshooting**

### **❌ Build ยังล้มเหลว:**
1. ตรวจสอบ MongoDB URI ใน Netlify
2. ตรวจสอบ Network Access ใน MongoDB Atlas
3. ตรวจสอบ Database Access ใน MongoDB Atlas

### **❌ API ไม่ทำงาน:**
1. ตรวจสอบ Console Logs
2. ตรวจสอบ MongoDB Atlas Dashboard
3. ตรวจสอบ Environment Variables

### **❌ SSL/TLS Error:**
1. ตรวจสอบ MongoDB Atlas Network Access
2. ตรวจสอบ IP Whitelist
3. ใช้ MongoDB Compass ทดสอบ connection

---

## 🎊 **สรุป**

✅ **แก้ไข Code แล้ว** - ไม่ throw error ตอน build time  
✅ **Environment Variables** - ต้องตั้งค่าใน Netlify  
✅ **MongoDB URI** - ต้องถูกต้อง  
✅ **Network Access** - ต้องเปิดใน MongoDB Atlas  

**หลังตั้งค่า Environment Variables แล้ว Deploy จะสำเร็จ!** 🚀

---

## 📞 **การสนับสนุน**

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ **Environment Variables** ใน Netlify
2. ตรวจสอบ **MongoDB Atlas Network Access**
3. ตรวจสอบ **Build Logs** ใน Netlify
4. ตรวจสอบ **Console Logs** ใน Browser
