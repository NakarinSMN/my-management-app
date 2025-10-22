# 🚗 ระบบจัดการข้อมูลลูกค้าและบิล

## 📋 เกี่ยวกับโปรเจค

ระบบจัดการข้อมูลลูกค้า บิล และการแจ้งเตือนภาษีรถยนต์  
พัฒนาด้วย **Next.js + Google Sheets + LINE Notify**

### ✨ ฟีเจอร์หลัก

- ✅ **จัดการข้อมูลลูกค้า** - เพิ่ม แก้ไข ลบ ค้นหา
- ✅ **จัดการบิล** - รายการบิลทั้งหมด กรองตามสถานะ
- ✅ **แจ้งเตือนภาษี** - ส่งการแจ้งเตือนผ่าน LINE อัตโนมัติ
- ✅ **Dashboard** - ภาพรวมสถิติและกราฟ
- ✅ **Cache System** - เร็วขึ้น 20-30 เท่า ⚡
- ✅ **Dark Mode** - รองรับโหมดมืด

---

## 🚀 การติดตั้งและใช้งาน

### ขั้นตอนที่ 1: ติดตั้ง Dependencies

```bash
npm install
```

### ขั้นตอนที่ 2: รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### ขั้นตอนที่ 3: Setup Google Apps Script

**อ่านคู่มือ:** `วิธีติดตั้ง-เพิ่มความเร็ว.md`

**Quick Start:**
1. ไปที่ [Google Apps Script](https://script.google.com)
2. สร้างโปรเจคใหม่
3. Copy โค้ดจาก **`GAS_Main_Combined.js`**
4. Paste และ Deploy เป็น Web App

### ขั้นตอนที่ 4: สร้าง Google Sheets

สร้าง 3 Sheets ใน Google Spreadsheet:

1. **Sheet "data"** - ข้อมูลลูกค้า
   - คอลัมน์: timestamp, ทะเบียนรถ, ยี่ห้อ/รุ่น, ชื่อ, เบอร์, วันที่, หมายเหตุ, userId, day

2. **Sheet "billing"** - ข้อมูลบิล
   - คอลัมน์: เลขที่บิล, ลูกค้า, บริการ, หมวดหมู่, ราคา, วันที่, เบอร์, สถานะ, รายการและยอดเงิน

3. **Sheet "sentnotify"** - ประวัติการแจ้งเตือน

---

## 📱 หน้าเว็บไซต์

| URL | ชื่อหน้า | คำอธิบาย |
|-----|---------|----------|
| `/` | หน้าแรก | Landing page |
| `/dashboard` | Dashboard | ภาพรวมสถิติและกราฟ |
| `/customer-info` | ข้อมูลลูกค้า | จัดการข้อมูลลูกค้า |
| `/billing` | รายการบิล | จัดการบิล ⭐ ใหม่! |
| `/tax-expiry-next-year` | ภาษีครั้งถัดไป | แสดงวันครบกำหนด |
| `/pricing` | ราคาบริการ | แสดงราคา |
| `/billing-main` | ออกบิล | ออกบิลใหม่ |

---

## ⚡ Cache System (เร็ว 20-30 เท่า!)

### ระบบ Cache 2 ชั้น:

1. **Frontend Cache (localStorage)**
   - อายุ: 5 นาที
   - แชร์ระหว่างหน้าต่างๆ
   - Auto clear เมื่อแก้ไขข้อมูล

2. **Backend Cache (Google CacheService)**
   - อายุ: 5 นาที
   - ลด API calls ไป Google Sheets
   - Auto clear เมื่อแก้ไขข้อมูล

**ผลลัพธ์:**
- ⏱️ โหลดครั้งแรก: 2-3 วินาที
- ⚡ โหลดครั้งที่ 2+: ~0.1 วินาที (เร็วขึ้น 20-30 เท่า!)

---

## 🔧 Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **State:** SWR (data fetching), React Hooks
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Notification:** LINE Notify
- **Icons:** Font Awesome, React Icons

---

## 📚 คู่มือการใช้งาน

### สำหรับผู้ใช้ทั่วไป:
1. **`วิธีติดตั้ง-เพิ่มความเร็ว.md`** - เริ่มต้นที่นี่!
2. **`BILLING_SYSTEM_GUIDE.md`** - วิธีใช้ระบบบิล

### สำหรับนักพัฒนา:
1. **`คู่มือไฟล์-Google-Apps-Script.md`** - อธิบายโค้ด GAS
2. **`SPEED_OPTIMIZATION_GUIDE.md`** - รายละเอียด Cache
3. **`LINE_NOTIFY_SETUP.md`** - Setup LINE Notify

### สำหรับ Admin:
1. **`โครงสร้างโปรเจค-สรุป.md`** - โครงสร้างไฟล์ทั้งหมด

---

## 🎯 การ Deploy

### Deploy Frontend (Vercel/Netlify):

```bash
npm run build
npm start
```

หรือ push ไป GitHub แล้วเชื่อม Vercel/Netlify

### Deploy Backend (Google Apps Script):

1. Copy โค้ดจาก `GAS_Main_Combined.js`
2. Paste ใน [Google Apps Script](https://script.google.com)
3. Deploy เป็น Web App
4. Copy URL ที่ได้
5. อัปเดต URL ใน Frontend code

---

## 📊 API Endpoints

### Customer API
- `GET ?getAll=1` - ดึงข้อมูลลูกค้าทั้งหมด
- `POST action=addCustomer` - เพิ่มลูกค้า
- `POST action=updateCustomer` - แก้ไขลูกค้า
- `POST action=deleteCustomer` - ลบลูกค้า

### Billing API
- `GET ?getBills=1` - ดึงข้อมูลบิลทั้งหมด
- `POST action=addBill` - เพิ่มบิล
- `POST action=updateBill` - แก้ไขบิล
- `POST action=deleteBill` - ลบบิล

---

## 🛠️ Scripts

```bash
npm run dev      # รัน development server
npm run build    # Build สำหรับ production
npm start        # รัน production server
npm run lint     # ตรวจสอบ code quality
```

---

## 📞 การแก้ปัญหา

### ปัญหา: ข้อมูลไม่โหลด
- ตรวจสอบ URL ของ Google Apps Script
- เปิด Console (F12) ดู error
- ตรวจสอบว่า Deploy แล้ว

### ปัญหา: ข้อมูลไม่อัปเดต
- กดปุ่ม "รีเฟรช" (สีม่วง)
- หรือรอ 5 นาทีให้ cache หมดอายุ
- หรือล้าง localStorage:
  ```javascript
  localStorage.clear();
  location.reload();
  ```

### ปัญหา: LINE ไม่ส่ง
- ตรวจสอบ ACCESS_TOKEN
- รันฟังก์ชัน `testLineNotify()` ใน Google Apps Script
- ดู Execution log

---

## 🎨 Features

### ✅ ระบบลูกค้า
- เพิ่ม/แก้ไข/ลบข้อมูล
- ค้นหาและกรอง
- แสดงสถานะภาษี
- วันครบกำหนดอัตโนมัติ

### ✅ ระบบบิล
- แสดงรายการบิล
- กรองตามสถานะและหมวดหมู่
- ดูรายละเอียดบิล (Modal)
- แสดงรายการและยอดเงิน
- สถิติสรุป

### ✅ Dashboard
- สถิติลูกค้าทั้งหมด
- จำนวนต่อภาษีเดือนนี้
- รถใกล้ครบกำหนด
- รถเกินกำหนด
- กราฟแสดงผล

### ✅ Cache System
- เร็วขึ้น 20-30 เท่า
- Auto cache invalidation
- Manual refresh

---

## 📄 License

Private Project

---

## 👨‍💻 Developer

ระบบจัดการข้อมูลลูกค้าและบิล  
Version 2.0 - พร้อม Cache System + Billing

---

**🎊 พร้อมใช้งาน!** อ่านคู่มือเพิ่มเติมที่ `วิธีติดตั้ง-เพิ่มความเร็ว.md`
