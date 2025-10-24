# 🔄 ปรับใช้ระบบคำนวณสถานะกับหน้าภาษีครั้งถัดไป

## 📋 การปรับปรุง

### **1. เพิ่มฟังก์ชันคำนวณสถานะ**
```typescript
// ฟังก์ชันคำนวณสถานะตามวันที่ชำระภาษี (ใช้สูตรเดียวกับ useCustomerData)
function calculateStatus(registerDate: string): string {
  if (!registerDate) return 'รอดำเนินการ';
  
  try {
    // แปลงวันที่เป็น Date object
    let date: Date;
    
    // ถ้าเป็น DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
      const [day, month, year] = registerDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // ถ้าเป็น YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
      date = new Date(registerDate);
    }
    // ถ้าเป็น ISO format
    else if (registerDate.includes('T')) {
      date = new Date(registerDate);
    }
    else {
      return 'รอดำเนินการ';
    }
    
    // คำนวณวันที่ครบกำหนด (1 ปีหลังจากวันที่ชำระ)
    const expiryDate = new Date(date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // คำนวณ gap (วันที่ครบกำหนด - วันนี้)
    const today = new Date();
    const gap = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // คำนวณสถานะตามสูตร
    if (gap < 0) {
      return 'เกินกำหนด';
    } else if (gap === 0) {
      return 'ครบกำหนดวันนี้';
    } else if (gap <= 90) {
      return 'กำลังจะครบกำหนด';
    } else {
      return 'ต่อภาษีแล้ว';
    }
  } catch (error) {
    console.error('Error calculating status:', error);
    return 'รอดำเนินการ';
  }
}
```

### **2. แก้ไขการคำนวณสถานะใน useEffect**
```typescript
// เดิม: คำนวณสถานะแบบเก่า
let status = 'รอดำเนินการ';
if (daysUntilExpiry < 0) {
  status = 'เกินกำหนด';
} else if (daysUntilExpiry <= 30) {
  status = 'ใกล้ครบกำหนด';
} else if (daysUntilExpiry <= 90) {
  status = 'กำลังจะครบกำหนด';
}

// ใหม่: ใช้ฟังก์ชันคำนวณสถานะเดียวกันกับ useCustomerData
const lastTaxDate = item.lastTaxDate || item.registerDate || '';
const status = calculateStatus(lastTaxDate);
```

## 🎯 ผลลัพธ์

### ✅ **สถานะที่คำนวณได้**
- **ต่อภาษีแล้ว** → เกิน 90 วัน
- **กำลังจะครบกำหนด** → 0-90 วัน
- **ครบกำหนดวันนี้** → 0 วัน
- **เกินกำหนด** → ติดลบ
- **รอดำเนินการ** → ไม่มีวันที่

### 🔄 **การทำงาน**
1. **ใช้สูตรเดียวกัน**: ตรงกับ useCustomerData
2. **คำนวณจากวันที่ชำระ**: ใช้ lastTaxDate หรือ registerDate
3. **อัปเดตอัตโนมัติ**: เปลี่ยนตามวันที่ปัจจุบัน
4. **ความสอดคล้อง**: สถานะเหมือนกันทุกหน้า

### 📊 **การเปรียบเทียบ**

#### **เดิม (หน้าภาษีครั้งถัดไป)**
```typescript
// คำนวณจาก daysUntilExpiry
if (daysUntilExpiry < 0) status = 'เกินกำหนด';
else if (daysUntilExpiry <= 30) status = 'ใกล้ครบกำหนด';
else if (daysUntilExpiry <= 90) status = 'กำลังจะครบกำหนด';
```

#### **ใหม่ (ใช้สูตรเดียวกัน)**
```typescript
// คำนวณจากวันที่ชำระ + 1 ปี
const status = calculateStatus(lastTaxDate);
// gap < 0 → 'เกินกำหนด'
// gap = 0 → 'ครบกำหนดวันนี้'
// gap ≤ 90 → 'กำลังจะครบกำหนด'
// gap > 90 → 'ต่อภาษีแล้ว'
```

## 🚀 พร้อมใช้งาน!

ตอนนี้หน้าภาษีครั้งถัดไปจะใช้ระบบคำนวณสถานะเดียวกันกับหน้าข้อมูลลูกค้าแล้วครับ!

### ✅ **Features ใหม่**
- **Consistent Status** → สถานะเหมือนกันทุกหน้า
- **Excel Formula** → ตรงตามสูตร
- **Real-time** → อัปเดตทันที
- **Unified Logic** → ตรรกะเดียวกัน

### 🎯 **ผลลัพธ์**
- ✅ **ข้อมูลลูกค้า** → ใช้ calculateStatus()
- ✅ **ภาษีครั้งถัดไป** → ใช้ calculateStatus()
- ✅ **ความสอดคล้อง** → สถานะเหมือนกัน
- ✅ **การบำรุงรักษา** → แก้ไขที่เดียว

🎯 **Perfect status consistency!** 🔄📅⚡🧮👥🚗
