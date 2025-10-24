# 🔧 แก้ไขหน้า "ภาษีครั้งถัดไป" ให้เชื่อมต่อ MongoDB

## ❌ ปัญหาที่พบ
หน้า "ภาษีครั้งถัดไป" ยังใช้ข้อมูลจาก Google Sheets API แทนที่จะใช้ข้อมูลจาก MongoDB

## ✅ การแก้ไข

### 1. **เปลี่ยน Data Source**
```typescript
// เดิม: ใช้ Google Sheets API
const { rawData: swrData, error: swrError, isLoading } = useCustomerData();

// ใหม่: ใช้ MongoDB ผ่าน Custom Hook
const { data: customerData, error: swrError, isLoading, refreshData } = useCustomerData();
```

### 2. **อัปเดต useEffect**
```typescript
useEffect(() => {
  if (customerData && customerData.length > 0) {
    console.log('=== DEBUG TAX EXPIRY DATA ===');
    console.log('Customer data length:', customerData.length);
    console.log('First item:', customerData[0]);
    
    const formatted: TaxExpiryData[] = customerData
      .map((item: any) => {
        // ดึงวันครบกำหนดจากข้อมูล MongoDB
        let expiryDate = item.expiryDate || item.nextTaxDate || '';
        
        // ถ้าไม่มีข้อมูลวันครบกำหนด ให้คำนวณจากวันที่ชำระล่าสุด + 365 วัน
        if (!expiryDate) {
          const lastTaxDate = item.lastTaxDate || item.registerDate || '';
          // ... การคำนวณวันที่
        }
        
        return {
          licensePlate: item.licensePlate || '',
          customerName: item.customerName || '',
          phone: item.phone || '',
          lastTaxDate: item.lastTaxDate || item.registerDate || '',
          expiryDate,
          daysUntilExpiry,
          status
        };
      })
      .filter((item: TaxExpiryData | null): item is TaxExpiryData => item !== null);
    
    setData(formatted.reverse());
  }
}, [customerData, swrError]);
```

### 3. **เพิ่มปุ่มรีเฟรช**
```typescript
<div className="flex gap-2">
  <button
    onClick={refreshData}
    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
    title="รีเฟรชข้อมูล"
  >
    <FontAwesomeIcon icon={faClock} className={isLoading ? 'animate-spin' : ''} />
    รีเฟรช
  </button>
  <Link href="/customer-info" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
    กลับไปหน้าข้อมูลต่อภาษี
  </Link>
</div>
```

### 4. **แก้ไข Error Handling**
```typescript
) : swrError ? (
  <div className="p-8 text-center">
    <p className="text-red-500 mb-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
    <button
      onClick={refreshData}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      ลองใหม่
    </button>
  </div>
```

### 5. **เพิ่มการแสดงข้อมูลเมื่อไม่มีข้อมูล**
```typescript
<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
  {currentData.length === 0 ? (
    <tr>
      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
        ไม่พบข้อมูลภาษีครั้งถัดไป
      </td>
    </tr>
  ) : (
    currentData.map((item, idx) => (
      <TaxExpiryRow key={item.licensePlate + item.customerName + idx} item={item} />
    ))
  )}
</tbody>
```

## 🔄 Data Flow ใหม่

### **MongoDB → Custom Hook → Component**
1. **MongoDB**: เก็บข้อมูลลูกค้า
2. **useCustomerData**: Custom Hook ดึงข้อมูลจาก MongoDB
3. **TaxExpiryPage**: แสดงข้อมูลภาษีครั้งถัดไป
4. **Real-time Updates**: อัปเดตข้อมูลทันที

### **การคำนวณวันที่**
- **expiryDate**: วันที่ครบกำหนดภาษี
- **lastTaxDate**: วันที่ชำระภาษีล่าสุด
- **daysUntilExpiry**: จำนวนวันที่เหลือ
- **status**: สถานะ (รอดำเนินการ, ใกล้ครบกำหนด, เกินกำหนด)

## 🎯 ผลลัพธ์

### ✅ **แก้ไขเสร็จแล้ว**
- หน้า "ภาษีครั้งถัดไป" เชื่อมต่อ MongoDB
- ข้อมูลอัปเดตแบบ Real-time
- เพิ่มปุ่มรีเฟรชข้อมูล
- จัดการข้อผิดพลาดได้ดี
- แสดงข้อความเมื่อไม่มีข้อมูล

### 🔧 **Features ใหม่**
- **ปุ่มรีเฟรช**: อัปเดตข้อมูลทันที
- **Error Handling**: จัดการข้อผิดพลาด
- **Empty State**: แสดงข้อความเมื่อไม่มีข้อมูล
- **Loading State**: แสดง loading ขณะโหลดข้อมูล

### 📊 **ข้อมูลที่แสดง**
- ทะเบียนรถ
- ชื่อลูกค้า
- เบอร์โทร
- วันที่ชำระล่าสุด
- ภาษีครั้งถัดไป
- วันที่เหลือ
- สถานะ

## 🚀 พร้อมใช้งาน!

ตอนนี้หน้า "ภาษีครั้งถัดไป" เชื่อมต่อกับ MongoDB แล้วครับ! 

- ✅ **ข้อมูลจาก MongoDB**
- ✅ **Real-time Updates**
- ✅ **ปุ่มรีเฟรช**
- ✅ **Error Handling**
- ✅ **Empty State**

🎯 **Perfect for tracking tax renewals!** 📅🚗💰
