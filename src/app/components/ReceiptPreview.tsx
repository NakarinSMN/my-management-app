// src/app/components/ReceiptPreview.tsx
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface BillItem {
  id: number;
  description: string;
  amount: string;
}

interface CustomerData {
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phone?: string;
  houseNo: string;
  moo: string;
  soi: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  zipCode: string;
  pickupDate?: string;
}

interface CarData {
  licensePlate: string;
  carBrand: string;
  carModel: string;
}

interface ReceiptData {
  billId: string;
  billDate: string;
  customer: CustomerData;
  car: CarData;
  billItems: BillItem[];
  totalAmount: string;
  paymentMethod?: 'cash' | 'transfer' | '';
}

interface ReceiptPreviewProps {
  data: ReceiptData;
  onClose: () => void;
}

// ฟังก์ชันจัดรูปแบบตัวเลข
const formatNumberWithCommas = (value: string | number): string => {
  if (typeof value === 'string') {
    value = parseFloat(value) || 0;
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ฟังก์ชันแปลงตัวเลขเป็นตัวอักษรไทย
const numberToThaiText = (num: number): string => {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  if (num === 0) return 'ศูนย์บาทถ้วน';
  
  const [intPart, decPart] = num.toFixed(2).split('.');
  let result = '';
  
  const numStr = intPart.toString();
  const len = numStr.length;
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const pos = len - i - 1;
    
    if (digit === 0) continue;
    
    if (pos === 1 && digit === 1) {
      result += 'สิบ';
    } else if (pos === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (pos === 0 && digit === 1 && len > 1) {
      result += 'เอ็ด';
    } else {
      result += digits[digit] + positions[pos];
    }
  }
  
  result += 'บาท';
  
  if (parseInt(decPart) > 0) {
    const decDigits = decPart.split('');
    let decText = '';
    
    if (decDigits[0] !== '0') {
      if (decDigits[0] === '1') {
        decText += 'สิบ';
      } else if (decDigits[0] === '2') {
        decText += 'ยี่สิบ';
      } else {
        decText += digits[parseInt(decDigits[0])] + 'สิบ';
      }
    }
    
    if (decDigits[1] !== '0') {
      if (decDigits[1] === '1' && decDigits[0] !== '0') {
        decText += 'เอ็ด';
      } else {
        decText += digits[parseInt(decDigits[1])];
      }
    }
    
    result += decText + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }
  
  return result;
};

export default function ReceiptPreview({ data, onClose }: ReceiptPreviewProps) {
  const handlePrint = () => {
    // รอให้ component render เสร็จก่อน
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Debug log เพื่อตรวจสอบข้อมูลที่ส่งมา
  console.log('=== RECEIPT PREVIEW DEBUG ===');
  console.log('Received data:', data);
  console.log('Total Amount:', data.totalAmount);
  console.log('Bill Items:', data.billItems);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto ">
      {/* ปุ่มปิดและปริ้น */}
      <div className="fixed top-4 right-4 flex gap-3 z-10 no-print">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPrint} /> ปริ้น/บันทึก PDF
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faTimes} /> ปิด
        </button>
      </div>

      {/* ฟอร์มใบเสร็จ - A4 แนวตั้ง */}

      
      
      <div className="print-area bg-white max-w-4xl w-full mx-auto my-4 scale-96">
        
     
        {/* ใบเสร็จตัวจริง */}
        <div className="receipt-copy receipt-original">
          <div className="p-1">
          {/* Header ใบเสร็จ */}
          <div className="border-b-2 border-black pb-1 mb-1">
            {/* หัวข้อหลัก */}
            <div className="text-center mb-1">
              <h1 className="text-sm font-bold mb-1">ใบเสร็จรับเงิน</h1>
            </div>

            {/* Logo และข้อมูลบริษัท */}
            <div className="flex items-start gap-6 mb-1">
              {/* Logo */}
              <div className="flex-shrink-0">
              <Image 
                src="/ToRoOo.png" 
                alt="สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ"
                width={80}
                height={80}
                className="object-contain"
              />
              </div>
              
              {/* ข้อมูลบริษัท */}
              <div className="flex-1 text-left">
                <h2 className="text-base font-bold mb-1">สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ</h2>
                <p className="text-xs">เลขที่ 91/130 หมู่ 5 ต.บางรักน้อย</p>
                <p className="text-xs">อ.เมืองนนทบุรี จ.นนทบุรี 11000</p>
                <p className="text-xs">โทร 065-893-3571, 089-013-3571</p>
                <p className="text-xs font-semibold">เลขประจำตัวผู้เสียภาษี 3-1204-00299-64-3 (นายวีระ มะเล็งลอย)</p>
              </div>

              {/* เลขที่และวันที่ - ข้างข้อมูลบริษัท */}
              <div className="flex-shrink-0 text-right text-xs">
                <p><strong>เลขที่:</strong> {data.billId || '_________________'}</p>
                <p><strong>วันที่:</strong> {data.billDate ? new Date(data.billDate).toLocaleDateString('th-TH', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : '_________________'}</p>
              </div>
            </div>
          </div>


          {/* ข้อมูลลูกค้า - Layout ใหม่ */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">ข้อมูลลูกค้า</h3>
            </div>
            <div className="p-1">
            <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex">
                  <span className="w-17 font-bold text-left">ชื่อ-นามสกุล:</span>
                  <span className="flex-1 text-left">{data.customer.title} {data.customer.firstName} {data.customer.lastName}</span>
                </div>
                <div className="flex">
                  <span className="w-12 font-bold text-left">เบอร์โทร:</span>
                  <span className="flex-1 text-left">{data.customer.phone || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-left">วันนัดรับรถ:</span>
                  <span className="flex-1 text-left">{data.customer.pickupDate ? new Date(data.customer.pickupDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}</span>
                </div>
                <div className="col-span-2 flex">
                  <span className="w-23 font-bold text-left">เลขบัตรประชาชน:</span>
                  <span className="flex-1 text-left">{data.customer.idNumber || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-18 font-bold text-left">รหัสไปรษณีย์:</span>
                  <span className="flex-1 text-left">{data.customer.zipCode || '-'}</span>
                </div>
                <div className="col-span-3 flex">
                  <span className="w-7 font-bold text-left">ที่อยู่:</span>
                  <span className="flex-1 text-left ml-1">{
                    [
                      data.customer.houseNo && `เลขที่ ${data.customer.houseNo}`,
                      data.customer.moo && `หมู่ ${data.customer.moo}`,
                      data.customer.soi && `ซอย ${data.customer.soi}`,
                      data.customer.road && `ถนน ${data.customer.road}`,
                      data.customer.subDistrict && `ตำบล ${data.customer.subDistrict}`,
                      data.customer.district && `อำเภอ ${data.customer.district}`,
                      data.customer.province && `จังหวัด ${data.customer.province}`
                    ].filter(Boolean).join(' ') || '-'
                  }</span>
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลรถยนต์ - แถวนอน */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">ข้อมูลรถยนต์</h3>
            </div>
            <div className="p-1">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex">
                  <span className="w-20 font-bold text-left">ทะเบียนรถ:</span>
                  <span className="flex-1 text-left">{data.car.licensePlate || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold text-left">ยี่ห้อ:</span>
                  <span className="flex-1 text-left">{data.car.carBrand || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold text-left">รุ่น:</span>
                  <span className="flex-1 text-left">{data.car.carModel || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* รายการค่าใช้จ่าย */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">รายการค่าใช้จ่าย</h3>
            </div>
            <div className="p-1">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-center w-12">ลำดับ</th>
                    <th className="border border-black p-1 text-left">รายการ</th>
                    <th className="border border-black p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.billItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-left">{item.description || '-'}</td>
                      <td className="border border-black p-1 text-right">
                        {item.amount ? formatNumberWithCommas(item.amount) : '0.00'}
                      </td>
                    </tr>
                  ))}
                  {/* เพิ่มแถวว่างให้ครบ 7 แถว */}
                  {data.billItems.length < 7 && Array.from({ length: 7 - data.billItems.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="border border-black p-1 text-center">{data.billItems.length + idx + 1}</td>
                      <td className="border border-black p-1 h-5 text-left">&nbsp;</td>
                      <td className="border border-black p-1 text-right">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ยอดรวมและช่องทางการชำระ - Layout ใหม่ */}
          <div className="mb-1 grid grid-cols-4 gap-3">
            {/* ช่องทางการชำระ */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ช่องทางการชำระเงิน</h3>
              </div>
              <div className="p-1">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold text-xs">
                      {(!data.paymentMethod || data.paymentMethod === 'cash') && '✓'}
                    </div>
                    <span>เงินสด</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold text-xs">
                      {data.paymentMethod === 'transfer' && '✓'}
                    </div>
                    <span>โอนเงิน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ยอดรวม */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ยอดรวม</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-sm font-bold mb-1">
                  {formatNumberWithCommas(data.totalAmount)} บาท
                </div>
                <div className="text-center text-xs border-t border-black pt-1">
                  ({numberToThaiText(parseFloat(data.totalAmount) || 0)})
                </div>
              </div>
            </div>

            {/* ลายเซ็น */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ลายเซ็น</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-xs">
                  <p className="mb-2">ผู้รับเงิน</p>
                  <p>(....................................................................)</p>
                </div>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">หมายเหตุ</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-xs">
                  <p>กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <p>..............................................................................................................................................................................................................................................................................................................</p>

        <div className="receipt-copy receipt-original">
          <div className="p-1">
          {/* Header ใบเสร็จ */}
          <div className="border-b-2 border-black pb-1 mb-1">
            {/* หัวข้อหลัก */}
            <div className="text-center mb-1">
              <h1 className="text-sm font-bold mb-1">(สำเนา)ใบเสร็จรับเงิน</h1>
            </div>

            {/* Logo และข้อมูลบริษัท */}
            <div className="flex items-start gap-6 mb-1">
              {/* Logo */}
              <div className="flex-shrink-0">
              <Image 
                src="/ToRoOo.png" 
                alt="สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ"
                width={80}
                height={80}
                className="object-contain"
              />
              </div>
              
              {/* ข้อมูลบริษัท */}
              <div className="flex-1 text-left">
                <h2 className="text-base font-bold mb-1">สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ</h2>
                <p className="text-xs">เลขที่ 91/130 หมู่ 5 ต.บางรักน้อย</p>
                <p className="text-xs">อ.เมืองนนทบุรี จ.นนทบุรี 11000</p>
                <p className="text-xs">โทร 065-893-3571, 089-013-3571</p>
                <p className="text-xs font-semibold">เลขประจำตัวผู้เสียภาษี 3-1204-00299-64-3 (นายวีระ มะเล็งลอย)</p>
              </div>

              {/* เลขที่และวันที่ - ข้างข้อมูลบริษัท */}
              <div className="flex-shrink-0 text-right text-xs">
                <p><strong>เลขที่:</strong> {data.billId || '_________________'}</p>
                <p><strong>วันที่:</strong> {data.billDate ? new Date(data.billDate).toLocaleDateString('th-TH', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : '_________________'}</p>
              </div>
            </div>
          </div>


          {/* ข้อมูลลูกค้า - Layout ใหม่ */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">ข้อมูลลูกค้า</h3>
            </div>
            <div className="p-1">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex">
                  <span className="w-17 font-bold text-left">ชื่อ-นามสกุล:</span>
                  <span className="flex-1 text-left">{data.customer.title} {data.customer.firstName} {data.customer.lastName}</span>
                </div>
                <div className="flex">
                  <span className="w-12 font-bold text-left">เบอร์โทร:</span>
                  <span className="flex-1 text-left">{data.customer.phone || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-left">วันนัดรับรถ:</span>
                  <span className="flex-1 text-left">{data.customer.pickupDate ? new Date(data.customer.pickupDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}</span>
                </div>
                <div className="col-span-2 flex">
                  <span className="w-23 font-bold text-left">เลขบัตรประชาชน:</span>
                  <span className="flex-1 text-left">{data.customer.idNumber || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-18 font-bold text-left">รหัสไปรษณีย์:</span>
                  <span className="flex-1 text-left">{data.customer.zipCode || '-'}</span>
                </div>
                <div className="col-span-3 flex">
                  <span className="w-7 font-bold text-left">ที่อยู่:</span>
                  <span className="flex-1 text-left ml-1">{
                    [
                      data.customer.houseNo && `เลขที่ ${data.customer.houseNo}`,
                      data.customer.moo && `หมู่ ${data.customer.moo}`,
                      data.customer.soi && `ซอย ${data.customer.soi}`,
                      data.customer.road && `ถนน ${data.customer.road}`,
                      data.customer.subDistrict && `ตำบล ${data.customer.subDistrict}`,
                      data.customer.district && `อำเภอ ${data.customer.district}`,
                      data.customer.province && `จังหวัด ${data.customer.province}`
                    ].filter(Boolean).join(' ') || '-'
                  }</span>
                </div>
              </div>
            </div>
          </div>

          {/* ข้อมูลรถยนต์ - แถวนอน */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">ข้อมูลรถยนต์</h3>
            </div>
            <div className="p-1">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex">
                  <span className="w-20 font-bold text-left">ทะเบียนรถ:</span>
                  <span className="flex-1 text-left">{data.car.licensePlate || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold text-left">ยี่ห้อ:</span>
                  <span className="flex-1 text-left">{data.car.carBrand || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold text-left">รุ่น:</span>
                  <span className="flex-1 text-left">{data.car.carModel || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* รายการค่าใช้จ่าย */}
          <div className="mb-1 border border-black">
            <div className="bg-gray-200 border-b border-black p-1">
              <h3 className="font-bold text-xs text-left">รายการค่าใช้จ่าย</h3>
            </div>
            <div className="p-1">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 text-center w-12">ลำดับ</th>
                    <th className="border border-black p-1 text-left">รายการ</th>
                    <th className="border border-black p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.billItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-left">{item.description || '-'}</td>
                      <td className="border border-black p-1 text-right">
                        {item.amount ? formatNumberWithCommas(item.amount) : '0.00'}
                      </td>
                    </tr>
                  ))}
                  {/* เพิ่มแถวว่างให้ครบ 7 แถว */}
                  {data.billItems.length < 7 && Array.from({ length: 7 - data.billItems.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="border border-black p-1 text-center">{data.billItems.length + idx + 1}</td>
                      <td className="border border-black p-1 h-5 text-left">&nbsp;</td>
                      <td className="border border-black p-1 text-right">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ยอดรวมและช่องทางการชำระ - Layout ใหม่ */}
          <div className="mb-1 grid grid-cols-4 gap-3">
            {/* ช่องทางการชำระ */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ช่องทางการชำระเงิน</h3>
              </div>
              <div className="p-1">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold text-xs">
                      {(!data.paymentMethod || data.paymentMethod === 'cash') && '✓'}
                    </div>
                    <span>เงินสด</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center font-bold text-xs">
                      {data.paymentMethod === 'transfer' && '✓'}
                    </div>
                    <span>โอนเงิน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ยอดรวม */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ยอดรวม</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-sm font-bold mb-1">
                  {formatNumberWithCommas(data.totalAmount)} บาท
                </div>
                <div className="text-center text-xs border-t border-black pt-1">
                  ({numberToThaiText(parseFloat(data.totalAmount) || 0)})
                </div>
              </div>
            </div>

            {/* ลายเซ็น */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">ลายเซ็น</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-xs">
                  <p className="mb-2">ผู้รับเงิน</p>
                 
                  <p>(....................................................................)</p>
                </div>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="border border-black">
              <div className="bg-gray-200 border-b border-black p-1">
                <h3 className="font-bold text-xs text-left">หมายเหตุ</h3>
              </div>
              <div className="p-1">
                <div className="text-center text-xs">
                  <p>กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export { ReceiptPreview };

