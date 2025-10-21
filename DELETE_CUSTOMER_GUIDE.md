# คู่มือ: เพิ่มฟีเจอร์ลบข้อมูลลูกค้า

## สิ่งที่เพิ่มเข้ามา

เพิ่มปุ่ม **"ลบข้อมูล"** ใน pop-up แก้ไขข้อมูลลูกค้า เมื่อกดลบจะลบทั้งแถวออกจาก Google Sheet

## การเปลี่ยนแปลง

### 1. Frontend - EditCustomerForm.tsx

#### เพิ่ม Icon
```typescript
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash } from 'react-icons/fa';
```

#### เพิ่มฟังก์ชันลบข้อมูล
```typescript
const handleDelete = async () => {
  // ยืนยันการลบ
  const confirmed = window.confirm(
    `คุณแน่ใจหรือไม่ที่จะลบข้อมูล?\n\nทะเบียนรถ: ${customerData.licensePlate}\nชื่อลูกค้า: ${customerData.customerName}\n\n⚠️ การลบข้อมูลไม่สามารถย้อนกลับได้`
  );
  
  if (!confirmed) return;
  
  setIsSubmitting(true);
  setMessage('');
  setError('');
  
  try {
    const deleteData = {
      action: 'deleteCustomer',
      licensePlate: customerData.licensePlate,
    };
    
    console.log('=== DEBUG DELETE ===');
    console.log('Deleting customer:', deleteData);
    
    const formDataToSend = new FormData();
    Object.keys(deleteData).forEach(key => {
      formDataToSend.append(key, deleteData[key]);
    });

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formDataToSend,
    });
    
    const text = await response.text();
    console.log('DEBUG: Response text:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('Response is not valid JSON: ' + text);
    }
    
    if (result.result === 'success') {
      setMessage('ลบข้อมูลลูกค้าสำเร็จ!');
      setTimeout(() => onSuccess(), 1500);
    } else {
      throw new Error(result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  } catch (err) {
    let msg = '';
    if (err instanceof Error) {
      msg = err.message;
    } else {
      msg = String(err);
    }
    setError(`เกิดข้อผิดพลาด: ${msg}`);
  } finally {
    setIsSubmitting(false);
  }
};
```

#### เพิ่มปุ่มลบใน UI
```typescript
<div className="flex justify-between items-center gap-4 mt-2">
  {/* ปุ่มลบ (ซ้ายสุด) */}
  <button 
    type="button" 
    onClick={handleDelete} 
    disabled={isSubmitting}
    className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 font-semibold text-base"
  >
    <FaTrash /> ลบข้อมูล
  </button>
  
  {/* ปุ่มยกเลิกและบันทึก (ขวาสุด) */}
  <div className="flex gap-4">
    <button 
      type="button" 
      onClick={onCancel} 
      className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-base"
    >
      <FaTimes /> ยกเลิก
    </button>
    <button 
      type="submit" 
      disabled={isSubmitting} 
      className="flex items-center gap-2 px-7 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 text-base"
    >
      <FaSave /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
    </button>
  </div>
</div>
```

### 2. Backend - Google Apps Script

#### ปรับปรุงฟังก์ชัน deleteCustomer
```javascript
function deleteCustomer(data) {
  try {
    console.log('=== DELETE CUSTOMER ===');
    console.log('Deleting customer:', data);
    console.log('licensePlate:', data.licensePlate);
    
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    console.log('Total rows:', allData.length);
    console.log('Looking for licensePlate:', data.licensePlate);
    
    // หาแถวที่มีทะเบียนรถที่ต้องการลบ (normalize ทั้งสองฝั่ง)
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const sheetPlate = normalizePlate(allData[i][1]);
      const searchPlate = normalizePlate(data.licensePlate);
      
      console.log(`Row ${i}: comparing "${sheetPlate}" with "${searchPlate}"`);
      
      if (sheetPlate === searchPlate) {
        targetRow = i + 1; // +1 เพราะ Google Sheets เริ่มจาก 1
        console.log('Found matching row:', targetRow);
        break;
      }
    }
    
    console.log('Final targetRow:', targetRow);
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ลบแถว
    console.log('Deleting row:', targetRow);
    sheet.deleteRow(targetRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'ลบข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**สิ่งที่ปรับปรุง:**
- ✅ ใช้ `normalizePlate` เพื่อ normalize ทะเบียนรถ
- ✅ เพิ่ม debug logs เพื่อตรวจสอบการทำงาน
- ✅ ใช้ `sheet.deleteRow(targetRow)` เพื่อลบทั้งแถว

## ขั้นตอนการใช้งาน

### 1. อัปเดต Google Apps Script

1. เปิด Google Apps Script Editor
2. คัดลอกโค้ดทั้งหมดจากไฟล์ `GOOGLE_APPS_SCRIPT_FINAL_FIX.js`
3. วางทับโค้ดเก่า
4. บันทึก (Ctrl+S)
5. **Deploy ใหม่:**
   - คลิก "Deploy" → "Manage deployments"
   - คลิก "Edit" (ไอคอนดินสอ)
   - เลือก "New version"
   - คลิก "Deploy"
6. รอ 1-2 นาที

### 2. ทดสอบการลบข้อมูล

1. เปิดหน้าข้อมูลต่อภาษี
2. คลิกปุ่ม "แก้ไข" ที่แถวใดแถวหนึ่ง
3. ดูที่มุมล่างซ้ายของ pop-up จะมีปุ่ม **"ลบข้อมูล"** สีแดง
4. คลิกปุ่ม "ลบข้อมูล"
5. จะมี confirmation dialog แสดงขึ้น:
   ```
   คุณแน่ใจหรือไม่ที่จะลบข้อมูล?
   
   ทะเบียนรถ: กก-1234
   ชื่อลูกค้า: นายทดสอบ
   
   ⚠️ การลบข้อมูลไม่สามารถย้อนกลับได้
   ```
6. คลิก "OK" เพื่อยืนยันการลบ
7. ระบบจะแสดงข้อความ "ลบข้อมูลลูกค้าสำเร็จ!"
8. Pop-up จะปิดอัตโนมัติ
9. ข้อมูลในตารางจะอัปเดตและแถวนั้นจะหายไป
10. ตรวจสอบใน Google Sheet ว่าแถวถูกลบจริง

### 3. ตรวจสอบ Debug Logs

**ใน Browser Console (F12):**
```
=== DEBUG DELETE ===
Deleting customer: {action: "deleteCustomer", licensePlate: "กก-1234"}
DEBUG: Response text: {"result":"success","message":"ลบข้อมูลลูกค้าสำเร็จ"}
```

**ใน Google Apps Script Executions:**
```
=== DELETE CUSTOMER ===
Deleting customer: {action=deleteCustomer, licensePlate=กก-1234}
licensePlate: กก-1234
Total rows: 10
Looking for licensePlate: กก-1234
Row 1: comparing "กก1234" with "กก1234"
Found matching row: 2
Final targetRow: 2
Deleting row: 2
```

## คุณสมบัติ

### ✅ การยืนยันการลบ
- แสดง confirmation dialog ก่อนลบ
- แสดงทะเบียนรถและชื่อลูกค้าที่จะลบ
- แสดงคำเตือนว่าไม่สามารถย้อนกลับได้

### ✅ การค้นหาแถว
- ใช้ `normalizePlate` เพื่อ normalize ทะเบียนรถ
- ตัดช่องว่างและแปลงเป็นตัวพิมพ์ใหญ่
- ค้นหาแบบแม่นยำ

### ✅ การลบแถว
- ใช้ `sheet.deleteRow(targetRow)` เพื่อลบทั้งแถว
- ลบทั้งข้อมูลและสูตรในแถว
- อัปเดตข้อมูลอัตโนมัติ

### ✅ การแสดงผล
- แสดงข้อความสำเร็จ "ลบข้อมูลลูกค้าสำเร็จ!"
- ปิด pop-up อัตโนมัติหลังจาก 1.5 วินาที
- รีเฟรชข้อมูลในตารางอัตโนมัติ

### ✅ การจัดการข้อผิดพลาด
- แสดงข้อความ error ถ้าเกิดข้อผิดพลาด
- ตรวจสอบว่าพบข้อมูลหรือไม่
- แสดง debug logs เพื่อตรวจสอบ

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│              แก้ไขข้อมูลลูกค้า                      │
├─────────────────────────────────────────────────────┤
│  [ฟอร์มแก้ไขข้อมูล]                                 │
├─────────────────────────────────────────────────────┤
│  [🗑️ ลบข้อมูล]           [❌ ยกเลิก] [💾 บันทึก] │
└─────────────────────────────────────────────────────┘
```

**จัดวาง:**
- ปุ่ม "ลบข้อมูล" (สีแดง) อยู่ซ้ายสุด
- ปุ่ม "ยกเลิก" และ "บันทึกการแก้ไข" อยู่ขวาสุด
- ใช้ `justify-between` เพื่อแยกปุ่มออกจากกัน

## การแก้ไขปัญหา

### ปัญหา 1: ไม่พบข้อมูลที่ต้องการลบ

**วิธีแก้:**
1. ตรวจสอบ debug logs ใน Google Apps Script Executions
2. ดูว่า `normalizePlate` ทำงานถูกต้องหรือไม่
3. ตรวจสอบว่าทะเบียนรถในชีตและที่ส่งมาตรงกันหรือไม่

### ปัญหา 2: ลบผิดแถว

**วิธีแก้:**
1. ตรวจสอบว่า `targetRow` ถูกต้องหรือไม่
2. ตรวจสอบว่าใช้ `i + 1` เพื่อแปลง index เป็น row number
3. ตรวจสอบว่าไม่มีแถวซ้ำใน Google Sheet

### ปัญหา 3: ข้อมูลไม่อัปเดตในตาราง

**วิธีแก้:**
1. ตรวจสอบว่า `onSuccess()` ถูกเรียกหรือไม่
2. ตรวจสอบว่า `mutate()` ทำงานในหน้า customer-info
3. รีเฟรชหน้าเว็บ (Ctrl+Shift+R)

### ปัญหา 4: ปุ่มไม่ทำงาน

**วิธีแก้:**
1. เปิด Browser Console (F12) ดู error
2. ตรวจสอบว่า Deploy Google Apps Script ใหม่แล้วหรือยัง
3. ตรวจสอบว่า URL ถูกต้องหรือไม่

## ความปลอดภัย

### ⚠️ คำเตือน
- การลบข้อมูลไม่สามารถย้อนกลับได้
- ควรสำรองข้อมูลใน Google Sheet เป็นประจำ
- ควรมีการยืนยันการลบอย่างชัดเจน

### 🔒 มาตรการป้องกัน
- ✅ มี confirmation dialog ก่อนลบ
- ✅ แสดงข้อมูลที่จะลบให้เห็นชัดเจน
- ✅ ปิดปุ่มเมื่อกำลังดำเนินการ (disabled)
- ✅ ตรวจสอบว่าพบข้อมูลก่อนลบ

## สรุป

✅ **เพิ่มปุ่มลบ:**
- ปุ่มสีแดงอยู่ซ้ายสุด
- มีไอคอนถังขยะ
- แสดงข้อความ "ลบข้อมูล"

✅ **การทำงาน:**
- แสดง confirmation dialog
- ส่ง request ไปยัง Google Apps Script
- ลบทั้งแถวใน Google Sheet
- รีเฟรชข้อมูลในตาราง

✅ **UX ที่ดี:**
- มีการยืนยันก่อนลบ
- แสดงข้อความสำเร็จ/ผิดพลาด
- ปิด pop-up อัตโนมัติ
- อัปเดตข้อมูลทันที

🚀 **พร้อมใช้งานแล้ว!**

