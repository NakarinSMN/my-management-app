# คู่มือการปริ้นและบันทึกเป็น PDF

## ฟีเจอร์ที่เพิ่ม

### 1. ปุ่มปริ้น/บันทึก PDF
- ปุ่มสีม่วง "🖨️ ปริ้น/บันทึก PDF"
- ใช้ browser's print dialog
- สามารถบันทึกเป็น PDF ได้โดยตรง

### 2. ปรับแต่งการแสดงผลสำหรับการปริ้น
- ซ่อนปุ่มต่างๆ เมื่อปริ้น
- ซ่อน navigation
- ปรับสีให้เหมาะกับการปริ้น
- กำหนดขนาดกระดาษ A4

## การใช้งาน

### วิธีการปริ้นบิล:

1. **กรอกข้อมูลบิล:**
   - ข้อมูลลูกค้า
   - ข้อมูลรถยนต์
   - รายการค่าใช้จ่าย

2. **คลิกปุ่ม "ปริ้น/บันทึก PDF":**
   - จะเปิด Print Dialog ของ browser
   - แสดงเฉพาะส่วนบิล (ซ่อนปุ่มและ navigation)

3. **เลือกการบันทึก:**
   
   **บันทึกเป็น PDF:**
   - Destination: "Save as PDF" หรือ "Microsoft Print to PDF"
   - คลิก "Save" หรือ "Print"
   - เลือกที่เก็บไฟล์
   - ตั้งชื่อไฟล์ (เช่น `บิลรถยนต์-001.pdf`)
   - กด "Save"
   
   **ปริ้นกระดาษ:**
   - Destination: เลือกเครื่องปริ้นเตอร์
   - คลิก "Print"

## การตั้งค่าการปริ้น

### ขนาดกระดาษ:
- **A4** (210 x 297 mm)
- Margin: 1 cm

### การจัดวาง:
- **Portrait** (แนวตั้ง)
- สำหรับบิลทั่วไป

### สี:
- **พื้นหลัง:** ขาว
- **ตัวอักษร:** ดำ
- **Border:** ดำ

## เทคนิคที่ใช้

### 1. CSS @media print

**ไฟล์: `src/app/globals.css`**

```css
@media print {
  /* ซ่อนองค์ประกอบที่ไม่ต้องการปริ้น */
  body * {
    visibility: hidden;
  }
  
  /* แสดงเฉพาะส่วนที่ต้องการปริ้น */
  .print-area,
  .print-area * {
    visibility: visible;
  }
  
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  
  /* ซ่อนปุ่มและ navigation */
  button,
  nav,
  .no-print {
    display: none !important;
  }
  
  /* ปรับการแสดงผล */
  @page {
    size: A4;
    margin: 1cm;
  }
  
  body {
    background: white;
    color: black;
  }
  
  /* ปรับสีให้เหมาะกับการปริ้น */
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  /* เก็บ border และ structure */
  table,
  th,
  td {
    border: 1px solid #000 !important;
  }
  
  /* ป้องกันการแบ่งหน้า */
  .print-area {
    page-break-inside: avoid;
  }
}
```

### 2. JavaScript window.print()

**ไฟล์: `src/app/cash-bill/forms/CarBillForm.tsx`**

```typescript
const handlePrint = () => {
  window.print();
};
```

### 3. CSS Classes

**`.print-area`**
- ส่วนที่ต้องการให้แสดงเมื่อปริ้น
- ใช้กับข้อมูลลูกค้า, ข้อมูลรถ, รายการค่าใช้จ่าย

**`.no-print`**
- ส่วนที่ไม่ต้องการให้แสดงเมื่อปริ้น
- ใช้กับปุ่ม, navigation, คำแนะนำ

## การปรับแต่ง

### เพิ่มส่วนที่ต้องการปริ้น:
```tsx
<div className="print-area">
  {/* เนื้อหาที่ต้องการปริ้น */}
</div>
```

### ซ่อนส่วนที่ไม่ต้องการปริ้น:
```tsx
<div className="no-print">
  {/* ส่วนที่ไม่ต้องการปริ้น */}
</div>
```

### เปลี่ยนขนาดกระดาษ:
```css
@page {
  size: A4;        /* A4, Letter, Legal */
  margin: 1cm;     /* ขอบกระดาษ */
  orientation: portrait; /* portrait, landscape */
}
```

## ตัวอย่างการใช้งาน

### ขั้นตอนที่ 1: กรอกข้อมูล
```
ข้อมูลลูกค้า: นายสมชาย ใจดี
ทะเบียนรถ: กก-1234
รายการ: ค่าต่อภาษี 1,500.00 บาท
```

### ขั้นตอนที่ 2: คลิกปริ้น
```
[🖨️ ปริ้น/บันทึก PDF]
```

### ขั้นตอนที่ 3: เลือก Save as PDF
```
┌──────────────────────────────┐
│ Print                        │
├──────────────────────────────┤
│ Destination:                 │
│ ▼ Save as PDF                │
│                              │
│ Pages: All                   │
│ Layout: Portrait             │
│ Color: Color                 │
│                              │
│        [Cancel]  [Save]      │
└──────────────────────────────┘
```

### ขั้นตอนที่ 4: บันทึกไฟล์
```
ชื่อไฟล์: บิลรถยนต์-กก1234-20241121.pdf
ที่เก็บ: เอกสาร/บิล/
```

## ข้อดีของวิธีนี้

### ✅ ไม่ต้องติดตั้ง Library
- ไม่ต้องใช้ jsPDF, html2canvas
- ไม่เพิ่มขนาด bundle
- ใช้ browser API มาตรฐาน

### ✅ ใช้งานง่าย
- คลิกปุ่มเดียว
- เลือก "Save as PDF"
- บันทึกได้ทันที

### ✅ รองรับทุก Browser
- Chrome: ✅
- Edge: ✅
- Firefox: ✅
- Safari: ✅

### ✅ ปรับแต่งได้
- เลือกขนาดกระดาษ
- เลือก orientation
- เลือกหน้าที่ต้องการปริ้น
- ปรับ margin

## การแก้ไขปัญหา

### ปัญหา 1: ปริ้นออกมาว่างเปล่า

**วิธีแก้:**
1. ตรวจสอบว่ามี class `print-area` หรือไม่
2. ตรวจสอบว่า CSS `@media print` ถูกโหลดหรือไม่
3. ลองปริ้นใน browser อื่น

### ปัญหา 2: ปุ่มยังแสดงเมื่อปริ้น

**วิธีแก้:**
1. เพิ่ม class `no-print` ให้กับปุ่ม
2. ตรวจสอบ CSS ว่า `button { display: none !important; }` อยู่ใน `@media print`

### ปัญหา 3: สีไม่ถูกต้อง

**วิธีแก้:**
1. ตรวจสอบ CSS ใน `@media print`
2. เพิ่ม `!important` ถ้าจำเป็น
3. ตั้งค่า "Print backgrounds" ใน print dialog

### ปัญหา 4: Layout ไม่สวย

**วิธีแก้:**
1. ปรับ margin ใน `@page`
2. ปรับ width ของ `.print-area`
3. ใช้ `page-break-before` หรือ `page-break-after`

## คำแนะนำ

### 💡 Tips:
1. **ทดสอบการปริ้น** ก่อนส่งให้ลูกค้า
2. **ใช้ Print Preview** เพื่อดูผลลัพธ์ก่อน
3. **บันทึกเป็น PDF** เพื่อเก็บหลักฐาน
4. **ตั้งชื่อไฟล์** ให้มีความหมาย (เช่น รวมทะเบียนรถและวันที่)

### 🎨 การปรับแต่งเพิ่มเติม:
1. เพิ่มโลโก้ของร้าน
2. เพิ่ม header/footer
3. เพิ่มเลขที่บิล
4. เพิ่ม barcode/QR code

## สรุป

✅ **เพิ่มปุ่ม "ปริ้น/บันทึก PDF"**
- คลิกเพื่อเปิด Print Dialog
- บันทึกเป็น PDF ได้ทันที
- ไม่ต้องติดตั้ง library เพิ่ม

✅ **CSS สำหรับ Print**
- ซ่อนปุ่มและ navigation
- ปรับสีให้เหมาะกับการปริ้น
- กำหนดขนาดกระดาษ A4

✅ **ใช้งานง่าย**
- คลิกปุ่มเดียว
- เลือก "Save as PDF"
- บันทึกไฟล์

🚀 **พร้อมใช้งานแล้ว!**

