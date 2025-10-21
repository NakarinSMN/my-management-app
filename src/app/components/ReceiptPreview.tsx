// src/app/components/ReceiptPreview.tsx
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* ปุ่มปิดและปริ้น */}
      <div className="fixed top-4 right-4 flex gap-3 z-10 no-print">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2"
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

      {/* ฟอร์มใบเสร็จ - A5 หน้าเดียว */}
      <div className="print-area bg-white max-w-md w-full mx-auto my-4 shadow-2xl">
        {/* ใบเสร็จตัวจริง */}
        <div className="receipt-copy receipt-original">
          <div className="p-3">
          {/* Header ใบเสร็จ */}
          <div className="text-center border-b-2 border-black pb-2 mb-3">
            <h1 className="text-base font-bold mb-0.5">สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ</h1>
            <p className="text-xs mt-0.5">เลขที่ 91/130 หมู่ 5 ต.บางรักน้อย</p>
            <p className="text-xs">อ.เมืองนนทบุรี จ.นนทบุรี 11000</p>
            <p className="text-xs">โทร 065-893-3571, 089-013-3571</p>
            <p className="text-xs mt-1 font-semibold">เลขประจำตัวผู้เสียภาษี 3-1204-00299-64-3 (นายวีระ มะเล็งลอย)</p>
            <h2 className="text-sm font-bold mt-2 border-t border-black pt-2">ใบเสร็จรับเงิน</h2>
          </div>

          {/* เลขที่และวันที่ */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <p><strong>เลขที่:</strong> {data.billId || '_________________'}</p>
            </div>
            <div className="text-right">
              <p><strong>วันที่:</strong> {data.billDate ? new Date(data.billDate).toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : '_________________'}</p>
            </div>
          </div>

          {/* ข้อมูลลูกค้า */}
          <div className="mb-2 border border-black p-2">
            <h3 className="font-bold text-xs bg-gray-200 -m-2 p-1 mb-2 text-left">ข้อมูลลูกค้า</h3>
            <div className="space-y-0.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <p className="text-left"><strong>ชื่อ-นามสกุล:</strong> {data.customer.title} {data.customer.firstName} {data.customer.lastName}</p>
                <p className="text-left"><strong>เบอร์โทร:</strong> {data.customer.phone || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-left"><strong>เลขบัตรประชาชน:</strong> {data.customer.idNumber || '-'}</p>
                <p className="text-left"><strong>วันนัดรับรถ:</strong> {data.customer.pickupDate ? new Date(data.customer.pickupDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}</p>
              </div>
              <div>
                <p className="text-left"><strong>ที่อยู่:</strong> {
                  [
                    data.customer.houseNo && `เลขที่ ${data.customer.houseNo}`,
                    data.customer.moo && `หมู่ ${data.customer.moo}`,
                    data.customer.soi && `ซอย ${data.customer.soi}`,
                    data.customer.road && `ถนน ${data.customer.road}`,
                    data.customer.subDistrict && `ตำบล ${data.customer.subDistrict}`,
                    data.customer.district && `อำเภอ ${data.customer.district}`,
                    data.customer.province && `จังหวัด ${data.customer.province}`,
                    data.customer.zipCode
                  ].filter(Boolean).join(' ') || '-'
                }</p>
              </div>
            </div>
          </div>

          {/* ข้อมูลรถยนต์ */}
          <div className="mb-2 border border-black p-2">
            <h3 className="font-bold text-xs bg-gray-200 -m-2 p-1 mb-2 text-left">ข้อมูลรถยนต์</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <p className="text-left"><strong>ทะเบียนรถ:</strong> {data.car.licensePlate || '-'}</p>
              <p className="text-left"><strong>ยี่ห้อ:</strong> {data.car.carBrand || '-'}</p>
              <p className="text-left"><strong>รุ่น:</strong> {data.car.carModel || '-'}</p>
            </div>
          </div>

          {/* รายการค่าใช้จ่าย */}
          <div className="mb-2">
            <h3 className="font-bold text-xs mb-1 text-left">รายการค่าใช้จ่าย</h3>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1 text-center w-10">ลำดับ</th>
                  <th className="border border-black p-1 text-left">รายการ</th>
                  <th className="border border-black p-1 text-right w-28">จำนวนเงิน (บาท)</th>
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

          {/* ยอดรวมและช่องทางการชำระ */}
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2">
              {/* ช่องทางการชำระ */}
              <div className="border border-black p-2">
                <h4 className="font-bold text-xs mb-1.5 text-left">ช่องทางการชำระเงิน</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-xs">
                      {(!data.paymentMethod || data.paymentMethod === 'cash') && '✓'}
                    </div>
                    <span className="text-left">เงินสด</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-xs">
                      {data.paymentMethod === 'transfer' && '✓'}
                    </div>
                    <span className="text-left">โอนเงิน</span>
                  </div>
                </div>
              </div>

              {/* ยอดรวม */}
              <div className="border border-black p-2">
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span className="text-left">ยอดรวมทั้งสิ้น:</span>
                  <span className="text-right">{formatNumberWithCommas(data.totalAmount)} บาท</span>
                </div>
                <div className="text-center text-xs border-t border-black pt-1 mt-1">
                  ({numberToThaiText(parseFloat(data.totalAmount) || 0)})
                </div>
              </div>
            </div>
          </div>

          {/* ลายเซ็นผู้รับเงิน */}
          <div className="mt-6 mb-3">
            <div className="text-center max-w-xs mx-auto">
              <p className="mb-8 text-xs">ผู้รับเงิน</p>
              <div className="border-b border-dotted border-black mb-1"></div>
              <p className="text-xs">(.......................................)</p>
              <p className="text-xs mt-1">วันที่ ........./........./.........</p>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="mt-3 text-xs text-center border-t border-black pt-2">
            <p>หมายเหตุ: กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน</p>
          </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export { ReceiptPreview };

