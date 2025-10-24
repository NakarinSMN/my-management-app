# 🔧 แก้ไขปุ่ม "แก้ไข" และ "เพิ่มข้อมูลลูกค้า" ให้เชื่อมต่อ MongoDB

## ❌ ปัญหาที่พบ
ปุ่ม "แก้ไข" และ "เพิ่มข้อมูลลูกค้า" ในหน้า "ข้อมูลต่อภาษี" ยังใช้ Google Sheets API แทนที่จะใช้ MongoDB API

## ✅ การแก้ไข

### 1. **AddCustomerForm.tsx - ปุ่มเพิ่มข้อมูลลูกค้า**

#### **เปลี่ยน Data Source**
```typescript
// เดิม: ใช้ Google Sheets API
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/...';

// ใหม่: ใช้ MongoDB API
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licensePlate: formData.licensePlate,
    brand: formData.brand,
    customerName: formData.customerName,
    phone: formData.phone,
    registerDate: formData.registerDate,
    status: 'รอดำเนินการ', // ตั้งค่าเริ่มต้น
    note: formData.note,
  }),
});
```

#### **อัปเดต Error Handling**
```typescript
const result = await response.json();

if (response.ok && result.success) {
  setMessage('เพิ่มข้อมูลลูกค้าสำเร็จ!');
  setTimeout(() => onSuccess(), 1500);
} else {
  throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
}
```

### 2. **EditCustomerForm.tsx - ปุ่มแก้ไขข้อมูลลูกค้า**

#### **เปลี่ยน Data Source สำหรับการแก้ไข**
```typescript
// เดิม: ใช้ Google Sheets API
const formDataToSend = new FormData();
formDataToSend.append('action', 'updateCustomer');
// ... ข้อมูลอื่นๆ

// ใหม่: ใช้ MongoDB API
const response = await fetch('/api/customers', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalLicensePlate: customerData.licensePlate,
    licensePlate: formData.licensePlate,
    customerName: formData.customerName,
    phone: formData.phone,
    registerDate: formData.registerDate,
    status: formData.status,
    brand: formData.brand,
    note: formData.note,
  }),
});
```

#### **เปลี่ยน Data Source สำหรับการลบ**
```typescript
// เดิม: ใช้ Google Sheets API
const deleteData = {
  action: 'deleteCustomer',
  licensePlate: customerData.licensePlate,
};

// ใหม่: ใช้ MongoDB API
const response = await fetch('/api/customers', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licensePlate: customerData.licensePlate,
  }),
});
```

### 3. **ลบ Google Sheets Dependencies**
```typescript
// ลบออก
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/...';

// ลบ FormData usage
const formDataToSend = new FormData();
formDataToSend.append('action', 'addCustomer');
```

## 🔄 Data Flow ใหม่

### **MongoDB API → Components → UI**
1. **MongoDB API**: `/api/customers` (GET, POST, PUT, DELETE)
2. **AddCustomerForm**: POST ข้อมูลใหม่
3. **EditCustomerForm**: PUT แก้ไขข้อมูล, DELETE ลบข้อมูล
4. **Real-time Updates**: อัปเดตข้อมูลทันทีผ่าน `mutate()`

### **API Endpoints ที่ใช้**
- **POST** `/api/customers` - เพิ่มข้อมูลลูกค้า
- **PUT** `/api/customers` - แก้ไขข้อมูลลูกค้า
- **DELETE** `/api/customers` - ลบข้อมูลลูกค้า

## 🎯 ผลลัพธ์

### ✅ **แก้ไขเสร็จแล้ว**
- ปุ่ม "เพิ่มข้อมูลลูกค้า" เชื่อมต่อ MongoDB
- ปุ่ม "แก้ไข" เชื่อมต่อ MongoDB
- ปุ่ม "ลบ" เชื่อมต่อ MongoDB
- ข้อมูลอัปเดตแบบ Real-time
- Error Handling ที่ดี

### 🔧 **Features ใหม่**
- **MongoDB Integration**: ใช้ MongoDB API แทน Google Sheets
- **Real-time Updates**: อัปเดตข้อมูลทันที
- **Better Error Handling**: จัดการข้อผิดพลาดได้ดีขึ้น
- **Consistent API**: ใช้ API เดียวกันทั้งระบบ

### 📊 **ข้อมูลที่จัดการ**
- ทะเบียนรถ
- ยี่ห้อ/รุ่น
- ชื่อลูกค้า
- เบอร์ติดต่อ
- วันที่ชำระภาษีล่าสุด
- สถานะ
- หมายเหตุ

## 🚀 พร้อมใช้งาน!

ตอนนี้ปุ่ม "แก้ไข" และ "เพิ่มข้อมูลลูกค้า" เชื่อมต่อกับ MongoDB แล้วครับ! 

- ✅ **เพิ่มข้อมูลลูกค้า** → MongoDB
- ✅ **แก้ไขข้อมูลลูกค้า** → MongoDB  
- ✅ **ลบข้อมูลลูกค้า** → MongoDB
- ✅ **Real-time Updates**
- ✅ **Error Handling**

🎯 **Perfect for customer management!** 👥🚗📝💰
