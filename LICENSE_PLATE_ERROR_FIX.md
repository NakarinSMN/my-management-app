# 🔧 แก้ไขข้อผิดพลาด "License plate is required"

## ❌ ปัญหาที่พบ
เกิดข้อผิดพลาด "License plate is required" เมื่อพยายามลบข้อมูลลูกค้า

## 🔍 สาเหตุของปัญหา
ใน DELETE method ของ `/api/customers/route.ts` ต้องการ `licensePlate` ใน query parameters แต่ใน `EditCustomerForm` ส่งข้อมูลใน request body แทน

### **เดิม (ผิด)**
```typescript
// API ต้องการ query parameters
const { searchParams } = new URL(request.url);
const licensePlate = searchParams.get('licensePlate');

// แต่ Form ส่งข้อมูลใน body
const response = await fetch('/api/customers', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licensePlate: customerData.licensePlate,
  }),
});
```

## ✅ การแก้ไข

### **แก้ไข DELETE method ใน API**
```typescript
// เดิม: ใช้ query parameters
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licensePlate = searchParams.get('licensePlate');
    
    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'License plate is required' },
        { status: 400 }
      );
    }
    // ...
  }
}

// ใหม่: ใช้ request body
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { licensePlate } = body;
    
    if (!licensePlate) {
      return NextResponse.json(
        { success: false, error: 'License plate is required' },
        { status: 400 }
      );
    }
    // ...
  }
}
```

## 🔄 Data Flow ที่ถูกต้อง

### **Form → API → MongoDB**
1. **EditCustomerForm**: ส่ง `licensePlate` ใน request body
2. **API DELETE**: รับข้อมูลจาก request body
3. **MongoDB**: ลบข้อมูลตาม `licensePlate`

### **API Endpoints ที่ใช้**
- **DELETE** `/api/customers` - ลบข้อมูลลูกค้า
  - รับข้อมูล: `{ licensePlate: string }`
  - ส่งกลับ: `{ success: boolean, message: string }`

## 🎯 ผลลัพธ์

### ✅ **แก้ไขเสร็จแล้ว**
- ปุ่ม "ลบข้อมูล" ทำงานได้ปกติ
- ไม่มีข้อผิดพลาด "License plate is required"
- API รับข้อมูลจาก request body แทน query parameters
- ข้อมูลลบจาก MongoDB สำเร็จ

### 🔧 **Features ที่ทำงานได้**
- **เพิ่มข้อมูลลูกค้า** → MongoDB ✅
- **แก้ไขข้อมูลลูกค้า** → MongoDB ✅
- **ลบข้อมูลลูกค้า** → MongoDB ✅
- **Real-time Updates** → อัปเดตทันที ✅

### 📊 **ข้อมูลที่จัดการ**
- ทะเบียนรถ (licensePlate)
- ยี่ห้อ/รุ่น (brand)
- ชื่อลูกค้า (customerName)
- เบอร์ติดต่อ (phone)
- วันที่ชำระภาษีล่าสุด (registerDate)
- สถานะ (status)
- หมายเหตุ (note)

## 🚀 พร้อมใช้งาน!

ตอนนี้ปุ่ม "ลบข้อมูล" ทำงานได้ปกติแล้วครับ! 

- ✅ **เพิ่มข้อมูลลูกค้า** → MongoDB
- ✅ **แก้ไขข้อมูลลูกค้า** → MongoDB  
- ✅ **ลบข้อมูลลูกค้า** → MongoDB
- ✅ **Real-time Updates**
- ✅ **Error Handling**

🎯 **Perfect for customer management!** 👥🚗📝💰
