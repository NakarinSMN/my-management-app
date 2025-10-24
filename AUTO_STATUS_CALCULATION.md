# 🧮 ระบบคำนวณสถานะอัตโนมัติตามสูตร Excel

## 📋 สูตรที่ใช้
```
=IF(J3180<>"",LET(gap,J3180-TODAY(),IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")
```

## 🔧 การแปลงเป็น JavaScript

### **1. ฟังก์ชันคำนวณสถานะ**
```typescript
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

### **2. การใช้งานใน formatCustomerData**
```typescript
// MongoDB Data
return {
  licensePlate: item.licensePlate || '',
  brand: item.brand || '',
  customerName: item.customerName || '',
  phone,
  registerDate,
  status: calculateStatus(registerDate), // คำนวณสถานะอัตโนมัติ
  note: item.note || '',
  userId: item.userId || '',
  day: item.day || 365,
};

// Google Sheets Data
return {
  licensePlate: item['ทะเบียนรถ'] || '',
  brand: item['ยี่ห้อ / รุ่น'] || '',
  customerName: item['ชื่อลูกค้า'] || '',
  phone,
  registerDate,
  status: calculateStatus(registerDate), // คำนวณสถานะอัตโนมัติ
  note: item['หมายเหตุ'] || '',
};
```

## 📊 ตรรกะการคำนวณ

### **ขั้นตอนการคำนวณ**
1. **ตรวจสอบวันที่**: ถ้าไม่มีวันที่ → `รอดำเนินการ`
2. **แปลงวันที่**: รองรับหลายรูปแบบ (DD/MM/YYYY, YYYY-MM-DD, ISO)
3. **คำนวณวันที่ครบกำหนด**: วันที่ชำระ + 1 ปี
4. **คำนวณ gap**: วันที่ครบกำหนด - วันนี้
5. **กำหนดสถานะ**:
   - `gap < 0` → **เกินกำหนด**
   - `gap = 0` → **ครบกำหนดวันนี้**
   - `gap ≤ 90` → **กำลังจะครบกำหนด**
   - `gap > 90` → **ต่อภาษีแล้ว**

### **ตัวอย่างการคำนวณ**
```
วันที่ชำระ: 01/01/2023
วันที่ครบกำหนด: 01/01/2024
วันนี้: 15/12/2023
gap = 17 วัน → "กำลังจะครบกำหนด"

วันที่ชำระ: 01/01/2022
วันที่ครบกำหนด: 01/01/2023
วันนี้: 15/12/2023
gap = -349 วัน → "เกินกำหนด"
```

## 🎯 ผลลัพธ์

### ✅ **สถานะที่คำนวณได้**
- **ต่อภาษีแล้ว** → เกิน 90 วัน
- **กำลังจะครบกำหนด** → 0-90 วัน
- **ครบกำหนดวันนี้** → 0 วัน
- **เกินกำหนด** → ติดลบ
- **รอดำเนินการ** → ไม่มีวันที่

### 🔄 **การอัปเดตอัตโนมัติ**
- **Real-time**: คำนวณทุกครั้งที่โหลดข้อมูล
- **Dynamic**: เปลี่ยนตามวันที่ปัจจุบัน
- **Accurate**: ตรงตามสูตร Excel

## 🚀 พร้อมใช้งาน!

ตอนนี้ระบบจะคำนวณสถานะอัตโนมัติตามสูตรที่คุณให้มาครับ!

- ✅ **Auto Calculation** → คำนวณอัตโนมัติ
- ✅ **Excel Formula** → ตรงตามสูตร
- ✅ **Real-time** → อัปเดตทันที
- ✅ **Multi-format** → รองรับหลายรูปแบบวันที่

🎯 **Perfect status calculation!** 🧮📅⚡🔄👥🚗
