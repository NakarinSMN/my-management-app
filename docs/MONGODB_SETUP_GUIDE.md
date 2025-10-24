# 🚀 คู่มือติดตั้ง MongoDB Atlas

## 📋 **ขั้นตอนที่ 1: สร้าง MongoDB Atlas Account**

### **1.1 ไปที่ MongoDB Atlas**
```
🌐 https://cloud.mongodb.com/
```

### **1.2 สร้าง Account**
- คลิก **"Try Free"**
- กรอกข้อมูล (Email, Password)
- ยืนยัน Email

### **1.3 สร้าง Cluster**
- เลือก **"M0 Sandbox"** (Free Tier)
- เลือก **Region**: Asia Pacific (Singapore)
- ตั้งชื่อ Cluster: `tax-management-cluster`

---

## 📋 **ขั้นตอนที่ 2: ตั้งค่า Database Access**

### **2.1 สร้าง Database User**
- ไปที่ **"Database Access"**
- คลิก **"Add New Database User"**
- เลือก **"Password"**
- Username: `tax-management-user`
- Password: `your-secure-password`
- Database User Privileges: **"Read and write to any database"**

### **2.2 ตั้งค่า Network Access**
- ไปที่ **"Network Access"**
- คลิก **"Add IP Address"**
- เลือก **"Allow access from anywhere"** (0.0.0.0/0)

---

## 📋 **ขั้นตอนที่ 3: ตั้งค่า Connection String**

### **3.1 ไปที่ Clusters**
- คลิก **"Connect"** ที่ Cluster ของคุณ
- เลือก **"Connect your application"**
- Driver: **Node.js**
- Version: **4.1 or later**

### **3.2 คัดลอก Connection String**
```
mongodb+srv://tax-management-user:<password>@tax-management-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## 📋 **ขั้นตอนที่ 4: ตั้งค่า Environment Variables**

### **4.1 สร้างไฟล์ .env.local**
```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://tax-management-user:your-password@tax-management-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=tax_management

# Google Sheets API (สำหรับ Migration)
GOOGLE_SHEET_CUSTOMER_API_URL=https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1
GOOGLE_SHEET_BILLING_API_URL=https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getBills=1
```

### **4.2 แทนที่ <password> ด้วยรหัสผ่านจริง**
```bash
# ตัวอย่าง
MONGODB_URI=mongodb+srv://tax-management-user:MySecurePassword123@tax-management-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## 📋 **ขั้นตอนที่ 5: รัน Migration Script**

### **5.1 รัน Migration**
```bash
node scripts/migrate-to-mongodb.js
```

### **5.2 ตรวจสอบผลลัพธ์**
```
🚀 เริ่มการย้ายข้อมูลไป MongoDB Atlas...
📊 MongoDB URI: ✅ ตั้งค่าแล้ว
📊 Google Sheets API: ✅ ตั้งค่าแล้ว
🔄 กำลังย้ายข้อมูลลูกค้า...
✅ ย้ายข้อมูลลูกค้าเรียบร้อย: 150 รายการ
🔄 กำลังย้ายข้อมูลบิล...
✅ ย้ายข้อมูลบิลเรียบร้อย: 300 รายการ
🎉 การย้ายข้อมูลเสร็จสิ้น!
```

---

## 📋 **ขั้นตอนที่ 6: ทดสอบ API**

### **6.1 รัน Development Server**
```bash
npm run dev
```

### **6.2 ทดสอบ API Endpoints**
```bash
# ทดสอบ Customers API
curl http://localhost:3000/api/customers

# ทดสอบ Billing API
curl http://localhost:3000/api/billing
```

---

## 📋 **ขั้นตอนที่ 7: ตรวจสอบใน MongoDB Atlas**

### **7.1 ไปที่ Collections**
- เปิด MongoDB Atlas
- ไปที่ **"Browse Collections"**
- ตรวจสอบ Collections:
  - `customers` - ข้อมูลลูกค้า
  - `billing` - ข้อมูลบิล

### **7.2 ตรวจสอบข้อมูล**
- คลิกที่ Collection `customers`
- ตรวจสอบว่ามีข้อมูลลูกค้า
- คลิกที่ Collection `billing`
- ตรวจสอบว่ามีข้อมูลบิล

---

## 🎯 **ข้อดีของ MongoDB Atlas**

### **⚡ ความเร็ว:**
- **20-50 เท่า** เร็วกว่า Google Sheets
- **Real-time** updates
- **Index** support

### **🔍 การค้นหา:**
- **Full-text search**
- **Complex queries**
- **Aggregation pipelines**

### **📊 การจัดการ:**
- **Auto-scaling**
- **Backup** อัตโนมัติ
- **Security** ระดับ enterprise

---

## 🚨 **Troubleshooting**

### **❌ Connection Error**
```bash
# ตรวจสอบ MONGODB_URI
echo $MONGODB_URI

# ตรวจสอบ Network Access
# ไปที่ MongoDB Atlas > Network Access
# ตรวจสอบว่า IP ถูก Whitelist
```

### **❌ Authentication Error**
```bash
# ตรวจสอบ Username/Password
# ไปที่ MongoDB Atlas > Database Access
# ตรวจสอบ Database User
```

### **❌ Migration Error**
```bash
# ตรวจสอบ Google Sheets API
curl "https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1"
```

---

## 🎊 **สรุป**

✅ **MongoDB Atlas ตั้งค่าเสร็จ**  
✅ **Migration Script พร้อมใช้งาน**  
✅ **API Endpoints ทำงานได้**  
✅ **Custom Hooks อัพเดทแล้ว**  
✅ **พร้อมใช้งานทันที**  

**ตอนนี้โปรเจคใช้ MongoDB แทน Google Sheets แล้ว!** 🚀

---

## 📞 **การสนับสนุน**

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ **Troubleshooting** ด้านบน
2. ดู **Console Logs** ใน Browser
3. ตรวจสอบ **MongoDB Atlas Dashboard**
4. ตรวจสอบ **Network Access** และ **Database Access**
