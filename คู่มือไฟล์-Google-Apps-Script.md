# 📚 คู่มือไฟล์ Google Apps Script (แยกตามระบบ)

## 📁 ไฟล์ที่สร้างให้แล้ว

ผมได้แยก Google Apps Script ออกเป็น **4 ไฟล์** เพื่อให้จัดการง่ายขึ้น:

---

## 1. 📄 `GAS_Main_Combined.js` ⭐ แนะนำใช้ไฟล์นี้

**คำอธิบาย:** รวมทุกระบบไว้ในไฟล์เดียว - พร้อม Deploy ทันที!

**ใช้เมื่อไหร่:** 
- ✅ ใช้สำหรับ Deploy จริงใน Google Apps Script
- ✅ มีทุกฟีเจอร์ครบในไฟล์เดียว
- ✅ ง่ายต่อการจัดการ

**ฟีเจอร์:**
- ✅ ระบบลูกค้า (Customer) พร้อม Cache
- ✅ ระบบบิล (Billing) พร้อม Cache
- ✅ ระบบแจ้งเตือน LINE
- ✅ ฟังก์ชันทดสอบ

**วิธีใช้:**
```
1. Copy โค้ดทั้งหมดจาก GAS_Main_Combined.js
2. วางใน Google Apps Script Editor
3. บันทึกและ Deploy
4. ✅ เสร็จสิ้น!
```

---

## 2. 👥 `GAS_Customer_System.js`

**คำอธิบาย:** เฉพาะระบบจัดการลูกค้า

**ฟีเจอร์:**
- ✅ `doGet_Customer()` - API สำหรับดึงข้อมูลลูกค้า
- ✅ `doPost_Customer()` - API สำหรับเพิ่ม/แก้ไข/ลบลูกค้า
- ✅ `getAllCustomersWithCache()` - ดึงข้อมูลพร้อม Cache
- ✅ `addCustomer()` - เพิ่มลูกค้า
- ✅ `updateCustomer()` - แก้ไขลูกค้า
- ✅ `deleteCustomer()` - ลบลูกค้า
- ✅ `normalizePlate()` - Normalize ทะเบียนรถ
- ✅ `parseDate()` - แปลงวันที่
- ✅ `testCustomerCache()` - ทดสอบ Cache

**ใช้เมื่อไหร่:**
- อ่านเพื่อศึกษาโค้ดส่วน Customer
- แก้ไขเฉพาะส่วน Customer
- Debug ปัญหาเกี่ยวกับลูกค้า

**หมายเหตุ:** ไม่ได้ใช้ Deploy จริง (ใช้ `GAS_Main_Combined.js` แทน)

---

## 3. 💰 `GAS_Billing_System.js`

**คำอธิบาย:** เฉพาะระบบจัดการบิล

**ฟีเจอร์:**
- ✅ `doGet_Billing()` - API สำหรับดึงข้อมูลบิล
- ✅ `doPost_Billing()` - API สำหรับเพิ่ม/แก้ไข/ลบบิล
- ✅ `getAllBillsWithCache()` - ดึงข้อมูลพร้อม Cache
- ✅ `addBill()` - เพิ่มบิล
- ✅ `updateBill()` - แก้ไขบิล
- ✅ `deleteBill()` - ลบบิล
- ✅ `testBillingCache()` - ทดสอบ Cache

**ใช้เมื่อไหร่:**
- อ่านเพื่อศึกษาโค้ดส่วน Billing
- แก้ไขเฉพาะส่วน Billing
- Debug ปัญหาเกี่ยวกับบิล

**หมายเหตุ:** ไม่ได้ใช้ Deploy จริง (ใช้ `GAS_Main_Combined.js` แทน)

---

## 4. 📱 `GAS_LINE_Notify_System.js`

**คำอธิบาย:** เฉพาะระบบแจ้งเตือน LINE

**ฟีเจอร์:**
- ✅ `sendLineMessage()` - ส่งข้อความผ่าน LINE Bot
- ✅ `sendAlert()` - ส่งการแจ้งเตือนภาษี
- ✅ `getNotifyStatus()` - เช็คสถานะการเตือน
- ✅ `updateNotifyStatus()` - อัปเดตสถานะ
- ✅ `checkAndNotifyTaxExpiry()` - ตรวจสอบและแจ้งเตือน
- ✅ `testSendLineMessage()` - ทดสอบส่งข้อความ
- ✅ `setupDailyTrigger()` - ตั้งค่า Auto Trigger

**ใช้เมื่อไหร่:**
- อ่านเพื่อศึกษาโค้ดส่วน LINE Notify
- แก้ไข ACCESS_TOKEN
- Debug ปัญหาเกี่ยวกับการแจ้งเตือน

**หมายเหตุ:** ไม่ได้ใช้ Deploy จริง (ใช้ `GAS_Main_Combined.js` แทน)

---

## 🚀 วิธีการใช้งาน

### สำหรับ Deploy (ใช้งานจริง)

**ใช้ไฟล์เดียว:** `GAS_Main_Combined.js`

```
1. ไปที่ https://script.google.com
2. เปิดโปรเจคของคุณ
3. ลบโค้ดเก่าทั้งหมด
4. Copy โค้ดจาก GAS_Main_Combined.js
5. Paste ใน Google Apps Script Editor
6. บันทึก (Ctrl+S)
7. Deploy เวอร์ชันใหม่
```

### สำหรับศึกษาโค้ด

**เปิดอ่านตามระบบที่สนใจ:**
- อยากดู Customer → เปิด `GAS_Customer_System.js`
- อยากดู Billing → เปิด `GAS_Billing_System.js`
- อยากดู LINE → เปิด `GAS_LINE_Notify_System.js`

### สำหรับแก้ไข

**ขั้นตอน:**
1. เปิดไฟล์ที่ต้องการแก้ (เช่น `GAS_Customer_System.js`)
2. แก้ไขโค้ดในส่วนที่ต้องการ
3. Copy ส่วนที่แก้ไปใส่ใน `GAS_Main_Combined.js`
4. Deploy `GAS_Main_Combined.js`

---

## 📊 เปรียบเทียบไฟล์

| ไฟล์ | ขนาด | จุดประสงค์ | Deploy ได้? |
|------|------|-----------|------------|
| `GAS_Main_Combined.js` | ~600 บรรทัด | **ใช้งานจริง** | ✅ **ใช่** |
| `GAS_Customer_System.js` | ~230 บรรทัด | ศึกษา/แก้ไข | ❌ ไม่ใช่ |
| `GAS_Billing_System.js` | ~350 บรรทัด | ศึกษา/แก้ไข | ❌ ไม่ใช่ |
| `GAS_LINE_Notify_System.js` | ~200 บรรทัด | ศึกษา/แก้ไข | ❌ ไม่ใช่ |

---

## 🔍 โครงสร้างโค้ด

### `GAS_Main_Combined.js`

```
========== CONFIG ==========
- SHEET_ID
- ACCESS_TOKEN
- SHEET_NAME_DATA
- SHEET_NAME_BILLING
- SHEET_NAME_FILTER
- CACHE_DURATION
- CACHE_KEY_CUSTOMERS
- CACHE_KEY_BILLING

========== MAIN ROUTING ==========
- doGet()   → รับคำขอ GET
- doPost()  → รับคำขอ POST

========== HELPER FUNCTIONS ==========
- getDataSheet()
- normalizePlate()
- parseDate()
- clearCustomerCache()
- clearBillingCache()
- clearAllCache()

========== CUSTOMER SYSTEM ==========
- getAllCustomersWithCache()
- addCustomer()
- updateCustomer()
- deleteCustomer()

========== BILLING SYSTEM ==========
- getAllBillsWithCache()
- addBill()
- updateBill()
- deleteBill()

========== LINE NOTIFY SYSTEM ==========
- sendLineMessage()
- sendAlert()
- getNotifyStatus()
- updateNotifyStatus()
- formatDate()

========== TESTING ==========
- testCache()
```

---

## 🧪 ฟังก์ชันทดสอบ

### ทดสอบ Cache
```javascript
testCache() // รันใน Google Apps Script Editor
```

**ผลลัพธ์:**
```
=== ทดสอบ Cache ===
ไม่มี cache: 2500 ms
มี cache: 150 ms
เร็วขึ้น: 16 เท่า
```

---

## 📋 Checklist การติดตั้ง

### สำหรับระบบลูกค้า
- [ ] มี Sheet "data" พร้อม header ที่ถูกต้อง
- [ ] Deploy `GAS_Main_Combined.js`
- [ ] ทดสอบ `?getAll=1`
- [ ] ทดสอบเพิ่ม/แก้ไข/ลบลูกค้า

### สำหรับระบบบิล
- [ ] สร้าง Sheet "billing" ใหม่
- [ ] ตั้งค่า header: เลขที่บิล, ลูกค้า, บริการ, หมวดหมู่, ราคา, วันที่, เบอร์ติดต่อ, สถานะ, รายการและยอดเงิน
- [ ] เพิ่มข้อมูลทดสอบ
- [ ] Deploy `GAS_Main_Combined.js`
- [ ] ทดสอบ `?getBills=1`
- [ ] เปิดหน้า `/billing`

### สำหรับระบบแจ้งเตือน LINE
- [ ] มี Sheet "sentnotify"
- [ ] ตรวจสอบ ACCESS_TOKEN
- [ ] ทดสอบส่งข้อความ LINE
- [ ] ตั้งค่า Daily Trigger (optional)

---

## 🎯 Quick Start Guide

### ถ้าต้องการใช้งานเร็วที่สุด:

```
1. Copy โค้ดจาก GAS_Main_Combined.js
2. Paste ใน Google Apps Script
3. Deploy
4. เสร็จสิ้น! ✅
```

### ถ้าต้องการเรียนรู้/แก้ไข:

```
1. เปิดอ่าน GAS_Customer_System.js (ระบบลูกค้า)
2. เปิดอ่าน GAS_Billing_System.js (ระบบบิล)
3. เปิดอ่าน GAS_LINE_Notify_System.js (ระบบแจ้งเตือน)
4. แก้ไขในไฟล์ที่เกี่ยวข้อง
5. Copy ไปใส่ใน GAS_Main_Combined.js
6. Deploy GAS_Main_Combined.js
```

---

## 📞 API Endpoints Summary

### Customer API
```
GET  ?getAll=1           → ข้อมูลลูกค้าทั้งหมด (พร้อม cache)
GET  ?getAll=1&refresh=1 → ข้อมูลลูกค้า (ไม่ใช้ cache)
GET  ?check=1&plate=xxx  → ค้นหาทะเบียน
POST action=addCustomer  → เพิ่มลูกค้า
POST action=updateCustomer → แก้ไขลูกค้า
POST action=deleteCustomer → ลบลูกค้า
```

### Billing API
```
GET  ?getBills=1           → ข้อมูลบิลทั้งหมด (พร้อม cache)
GET  ?getBills=1&refresh=1 → ข้อมูลบิล (ไม่ใช้ cache)
POST action=addBill        → เพิ่มบิล
POST action=updateBill     → แก้ไขบิล
POST action=deleteBill     → ลบบิล
```

---

## 🔧 การแก้ไขค่า Config

### แก้ไข Sheet ID
แก้ไขในบรรทัดที่ 6 ของ `GAS_Main_Combined.js`:
```javascript
const SHEET_ID = "YOUR_SHEET_ID_HERE";
```

### แก้ไข ACCESS_TOKEN
แก้ไขในบรรทัดที่ 7:
```javascript
const ACCESS_TOKEN = 'YOUR_LINE_TOKEN_HERE';
```

### แก้ไขระยะเวลา Cache
แก้ไขในบรรทัดที่ 13:
```javascript
const CACHE_DURATION = 60 * 10; // เปลี่ยนเป็น 10 นาที
```

---

## 📖 สรุปการใช้งาน

### สำหรับผู้ใช้ทั่วไป
**ใช้:** `GAS_Main_Combined.js` เท่านั้น

### สำหรับนักพัฒนา
**อ่าน:** ไฟล์แยก (`GAS_Customer_System.js`, `GAS_Billing_System.js`, `GAS_LINE_Notify_System.js`)  
**Deploy:** `GAS_Main_Combined.js`

---

## ✅ ความแตกต่างจากไฟล์เดิม

| ฟีเจอร์ | ไฟล์เดิม | ไฟล์ใหม่ (แยก) |
|---------|----------|----------------|
| จำนวนไฟล์ | 1 ไฟล์ใหญ่ | 4 ไฟล์แยก |
| Deploy | Deploy ไฟล์เดียว | Deploy `GAS_Main_Combined.js` |
| อ่านโค้ด | ยาก หาไม่เจอ | ง่าย แยกตามระบบ |
| แก้ไข | ยุ่งยาก | ง่าย แก้ไฟล์เล็ก |
| ฟีเจอร์ | เหมือนกัน | เหมือนกัน |
| Cache | ✅ มี | ✅ มี |

---

## 🎉 สรุป

✅ **แยกไฟล์แล้ว:** 4 ไฟล์ตามระบบ  
✅ **ง่ายต่อการจัดการ:** อ่านและแก้ไขง่ายขึ้น  
✅ **พร้อม Deploy:** ใช้ `GAS_Main_Combined.js`  
✅ **ครบทุกฟีเจอร์:** Customer + Billing + LINE Notify + Cache  

**แนะนำ:** ใช้ `GAS_Main_Combined.js` สำหรับ Deploy ทุกครั้ง!

---

## 📄 ไฟล์อื่นๆ ที่เกี่ยวข้อง

1. **Frontend:**
   - `src/lib/useCustomerData.ts` - Hook ลูกค้า
   - `src/lib/useBillingData.ts` - Hook บิล
   - `src/app/customer-info/page.tsx` - หน้าลูกค้า
   - `src/app/billing/page.tsx` - หน้าบิล

2. **คู่มือ:**
   - `SPEED_OPTIMIZATION_GUIDE.md` - คู่มือ Cache
   - `BILLING_SYSTEM_GUIDE.md` - คู่มือระบบบิล
   - `LINE_NOTIFY_SETUP.md` - คู่มือ LINE
   - `วิธีติดตั้ง-เพิ่มความเร็ว.md` - คู่มือติดตั้งง่ายๆ

---

**🎊 พร้อมใช้งานแล้ว!** ใช้ไฟล์ `GAS_Main_Combined.js` ใน Deploy ครับ

