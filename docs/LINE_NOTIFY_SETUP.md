# 📱 คู่มือการตั้งค่า LINE Notify สำหรับแจ้งเตือนภาษีรถ

## 🎯 ฟีเจอร์ที่เพิ่มเข้ามา

✅ **ส่งการแจ้งเตือนผ่าน LINE** เมื่อภาษีรถใกล้ครบกำหนด  
✅ **บันทึกประวัติการแจ้งเตือน** ลง Sheet "sentnotify"  
✅ **ตรวจสอบอัตโนมัติทุกวัน** ด้วย Time-based Trigger  
✅ **ทำงานร่วมกับ Cache** เพื่อความเร็วสูงสุด

---

## 📋 ข้อมูล Configuration ที่ตั้งค่าแล้ว

```javascript
// ใน GOOGLE_APPS_SCRIPT_OPTIMIZED.js
const SHEET_ID = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
const ACCESS_TOKEN = '7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU';
const SHEET_NAME_DATA = "data"; // Sheet สำหรับข้อมูลลูกค้า
const SHEET_NAME_NOTIFY = "sentnotify"; // Sheet สำหรับบันทึกการแจ้งเตือน
```

---

## 🔧 ขั้นตอนที่ 1: ตรวจสอบ Google Sheet

### 1.1 ตรวจสอบว่ามี Sheet "data"
- เปิด Google Sheet: https://docs.google.com/spreadsheets/d/110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU
- ต้องมี Sheet ชื่อ **"data"**
- คอลัมน์ต้องเรียงตามนี้:
  - A: ทะเบียนรถ
  - B: ชื่อลูกค้า
  - C: เบอร์ติดต่อ
  - D: วันที่ชำระภาษีล่าสุด
  - E: สถานะ
  - F: ยี่ห้อ/รุ่น
  - G: หมายเหตุ

### 1.2 สร้าง Sheet "sentnotify" (ถ้ายังไม่มี)

1. คลิกปุ่ม **"+"** ที่มุมล่างซ้าย
2. เปลี่ยนชื่อ Sheet เป็น **"sentnotify"**
3. ตั้งค่าคอลัมน์แถวแรก (A1-F1):
   - A1: **วันที่**
   - B1: **เวลา**
   - C1: **ทะเบียนรถ**
   - D1: **ชื่อลูกค้า**
   - E1: **ข้อความ**
   - F1: **สถานะ**

---

## 🧪 ขั้นตอนที่ 2: ทดสอบการส่ง LINE Notify

### 2.1 Deploy Google Apps Script

1. ไปที่ [Google Apps Script](https://script.google.com)
2. เปิดโปรเจคของคุณ
3. **ลบโค้ดเก่าทั้งหมด**
4. วางโค้ดจาก `GOOGLE_APPS_SCRIPT_OPTIMIZED.js`
5. บันทึก (Ctrl+S)
6. Deploy (ดูขั้นตอนใน `วิธีติดตั้ง-เพิ่มความเร็ว.md`)

### 2.2 ทดสอบส่งข้อความ LINE

1. ในหน้า Google Apps Script Editor
2. เลือกฟังก์ชัน **`testLineNotify`** จาก dropdown
3. คลิก **"Run"**
4. รอสักครู่ แล้วเช็ค LINE ของคุณ
5. ควรเห็นข้อความ:
   ```
   🧪 ทดสอบการส่งข้อความจาก Google Apps Script
   ระบบจัดการข้อมูลลูกค้า
   ```

### ผลลัพธ์ที่คาดหวัง:

✅ **สำเร็จ:**
```
=== ทดสอบ LINE Notify ===
✅ ส่งการแจ้งเตือน LINE สำเร็จ
✅ ส่งข้อความทดสอบสำเร็จ
```

❌ **ล้มเหลว:**
```
❌ Error sending LINE notification: ...
❌ ส่งข้อความทดสอบล้มเหลว
```

**วิธีแก้:** 
- ตรวจสอบว่า ACCESS_TOKEN ถูกต้อง
- ตรวจสอบว่า LINE Notify token ยังใช้งานได้

---

## 🔔 ขั้นตอนที่ 3: ทดสอบการแจ้งเตือนภาษี

### 3.1 เตรียมข้อมูลทดสอบ

ใน Sheet "data" เพิ่มข้อมูลทดสอบ:
- **สถานะ:** ใกล้ครบกำหนด หรือ กำลังจะครบกำหนด

### 3.2 รันฟังก์ชันทดสอบ

1. เลือกฟังก์ชัน **`testCheckTaxExpiry`**
2. คลิก **"Run"**
3. ดู Execution log (Ctrl+Enter)

### ผลลัพธ์:

```
=== ทดสอบการตรวจสอบภาษีครบกำหนด ===
✅ ส่งการแจ้งเตือน LINE สำเร็จ
✅ บันทึกการแจ้งเตือนสำเร็จ: กข-1234
✅ ส่งการแจ้งเตือนทั้งหมด 2 รายการ
ส่งการแจ้งเตือนทั้งหมด 2 รายการ
```

### 3.3 ตรวจสอบผลลัพธ์

1. **เช็ค LINE:** ควรได้รับข้อความแจ้งเตือน
   ```
   🚗 แจ้งเตือนต่อภาษี
   ทะเบียนรถ: กข-1234
   ชื่อลูกค้า: นายทดสอบ
   สถานะ: ใกล้ครบกำหนด
   กรุณาติดต่อลูกค้าเพื่อต่อภาษี
   ```

2. **เช็ค Sheet "sentnotify":** ควรมีข้อมูลใหม่
   | วันที่ | เวลา | ทะเบียนรถ | ชื่อลูกค้า | ข้อความ | สถานะ |
   |--------|------|-----------|-----------|---------|--------|
   | 22/10/2025 | 14:30:45 | กข-1234 | นายทดสอบ | 🚗 แจ้งเตือน... | sent |

---

## ⏰ ขั้นตอนที่ 4: ตั้งค่าการแจ้งเตือนอัตโนมัติ (Time-based Trigger)

### 4.1 สร้าง Trigger

1. ในหน้า Google Apps Script Editor
2. คลิกไอคอน **"นาฬิกา"** (Triggers) ด้านซ้าย
3. คลิก **"+ Add Trigger"** (มุมขวาล่าง)

### 4.2 ตั้งค่า Trigger

```
Choose which function to run: checkAndNotifyTaxExpiry
Choose which deployment should run: Head
Select event source: Time-driven
Select type of time based trigger: Day timer
Select time of day: 9am to 10am (หรือเวลาที่ต้องการ)
```

### 4.3 บันทึก

- คลิก **"Save"**
- อนุญาตสิทธิ์ที่ขึ้นมา (Allow)

### 4.4 ผลลัพธ์

✅ ระบบจะ:
- ตรวจสอบภาษีที่ใกล้ครบกำหนดอัตโนมัติทุกวัน
- ส่งการแจ้งเตือนผ่าน LINE
- บันทึกประวัติลง Sheet "sentnotify"

---

## 📊 ฟังก์ชันที่สามารถใช้ได้

### 1. `sendLineNotify(message)`
ส่งข้อความผ่าน LINE Notify

**ตัวอย่าง:**
```javascript
sendLineNotify('ทดสอบส่งข้อความ');
```

### 2. `logNotification(licensePlate, customerName, message, status)`
บันทึกประวัติการแจ้งเตือน

**ตัวอย่าง:**
```javascript
logNotification('กข-1234', 'นายทดสอบ', 'ทดสอบ', 'sent');
```

### 3. `getNotificationHistory(licensePlate)`
ดึงประวัติการแจ้งเตือน

**ตัวอย่าง:**
```javascript
// ดึงทั้งหมด
const all = getNotificationHistory();

// ดึงเฉพาะทะเบียน
const specific = getNotificationHistory('กข-1234');
```

### 4. `checkAndNotifyTaxExpiry()`
ตรวจสอบและส่งการแจ้งเตือนภาษีที่ใกล้ครบกำหนด

**ตัวอย่าง:**
```javascript
const count = checkAndNotifyTaxExpiry();
console.log(`ส่งแจ้งเตือน ${count} รายการ`);
```

### 5. `testLineNotify()`
ทดสอบส่งข้อความ LINE

### 6. `testCheckTaxExpiry()`
ทดสอบการตรวจสอบภาษีครบกำหนด

---

## 🔍 การแก้ปัญหา

### ปัญหา 1: ส่ง LINE ไม่ได้

**สาเหตุ:**
- ACCESS_TOKEN ผิด หรือหมดอายุ
- LINE Notify token ถูกยกเลิก

**วิธีแก้:**
1. ไปที่ [LINE Notify](https://notify-bot.line.me/my/)
2. สร้าง Token ใหม่
3. แทนที่ ACCESS_TOKEN ในโค้ด
4. Deploy ใหม่

### ปัญหา 2: ไม่มี Sheet "sentnotify"

**ข้อผิดพลาด:**
```
Error: ไม่พบ Sheet ชื่อ "sentnotify" ใน Spreadsheet
```

**วิธีแก้:**
1. สร้าง Sheet ใหม่
2. เปลี่ยนชื่อเป็น "sentnotify"
3. ตั้งค่าคอลัมน์ตามที่ระบุ

### ปัญหา 3: ไม่มี Sheet "data"

**ข้อผิดพลาด:**
```
Error: ไม่พบ Sheet ชื่อ "data" ใน Spreadsheet
```

**วิธีแก้:**
1. เปลี่ยนชื่อ Sheet เดิมเป็น "data"
2. หรือแก้ไข SHEET_NAME_DATA ในโค้ด

### ปัญหา 4: Trigger ไม่ทำงาน

**วิธีตรวจสอบ:**
1. ไปที่ Triggers (ไอคอนนาฬิกา)
2. ดู "Executions" ว่ามี error หรือไม่
3. ตรวจสอบว่า Trigger ยังเปิดอยู่

---

## 📝 โครงสร้าง Sheet "sentnotify"

| คอลัมน์ | ชื่อ | ตัวอย่าง | คำอธิบาย |
|---------|------|---------|----------|
| A | วันที่ | 22/10/2025 | วันที่ส่งการแจ้งเตือน |
| B | เวลา | 14:30:45 | เวลาที่ส่ง |
| C | ทะเบียนรถ | กข-1234 | ทะเบียนรถที่แจ้งเตือน |
| D | ชื่อลูกค้า | นายทดสอบ | ชื่อลูกค้า |
| E | ข้อความ | 🚗 แจ้งเตือน... | ข้อความที่ส่ง |
| F | สถานะ | sent/failed | สถานะการส่ง |

---

## 🎁 คุณสมบัติเพิ่มเติม

### 1. การแจ้งเตือนอัตโนมัติ
- ✅ ทำงานทุกวันตามเวลาที่ตั้งไว้
- ✅ ตรวจสอบเฉพาะสถานะ "ใกล้ครบกำหนด" และ "กำลังจะครบกำหนด"
- ✅ บันทึกประวัติทุกครั้ง

### 2. ประวัติการแจ้งเตือน
- ✅ ดูได้จาก Sheet "sentnotify"
- ✅ มีวันที่ เวลา และสถานะ
- ✅ สามารถดึงข้อมูลผ่าน API

### 3. Cache System
- ✅ ทำงานร่วมกับ Cache
- ✅ ไม่กระทบความเร็วของระบบ

---

## ✅ Checklist การติดตั้ง

- [ ] อัปเดต Google Apps Script ด้วยโค้ดใหม่
- [ ] ตรวจสอบว่ามี Sheet "data"
- [ ] สร้าง Sheet "sentnotify" พร้อมคอลัมน์
- [ ] ตรวจสอบ ACCESS_TOKEN
- [ ] Deploy เวอร์ชันใหม่
- [ ] รันฟังก์ชัน `testLineNotify()` และได้รับข้อความใน LINE
- [ ] รันฟังก์ชัน `testCheckTaxExpiry()` และตรวจสอบผลลัพธ์
- [ ] ตั้งค่า Time-based Trigger
- [ ] ตรวจสอบว่า Trigger ทำงาน

---

## 🎉 เสร็จสิ้น!

ระบบการแจ้งเตือนผ่าน LINE พร้อมใช้งานแล้ว! 🚀

**คุณสมบัติที่ได้:**
- ✅ แจ้งเตือนอัตโนมัติทุกวัน
- ✅ บันทึกประวัติการแจ้งเตือน
- ✅ ทำงานร่วมกับ Cache System
- ✅ เร็วและประหยัด

---

**หมายเหตุ:** ถ้าต้องการเปลี่ยน ACCESS_TOKEN ให้แก้ไขที่บรรทัดที่ 7 ในไฟล์ `GOOGLE_APPS_SCRIPT_OPTIMIZED.js` แล้ว Deploy ใหม่


