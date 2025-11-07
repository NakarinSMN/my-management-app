// src/app/cash-bill/forms/CarBillForm.tsx
"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faSave,
  faArrowLeft,
  faPlus,
  faTrash,
  faFilePdf,
  faExclamationCircle,
  faSearch,
  faPrint
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { ReceiptPreview } from "../../components/ReceiptPreview";
import { useNotification } from "../../contexts/NotificationContext";

// สร้าง Type สำหรับข้อมูลบิลเพื่อความชัดเจน
interface BillItem {
  id: number;
  description: string;
  amount: string; // เก็บเป็น string เพื่อความยืดหยุ่นในการกรอก
}

interface CustomerData {
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  phone: string;
  houseNo: string;
  moo: string;
  soi: string;
  road: string;
  subDistrict: string;
  district: string;
  province: string;
  zipCode: string;
  visitDate: string;
  pickupDate: string;
}

interface CarData {
  licensePlate: string;
  carBrand: string;
  carModel: string;
}

interface BillFormData {
  billId?: string;
  customer: CustomerData;
  car: CarData;
  billItems: BillItem[];
  totalAmount: string;
  billDate: string;
  paymentMethod: 'cash' | 'transfer' | '';
}

// สร้าง Type สำหรับ Form Errors เพื่อให้ระบุได้ว่า error อยู่ที่ field ไหน
interface FormErrors {
  [key: string]: string | undefined; // key เป็น string (ชื่อ field), value เป็น string (ข้อความ error) หรือ undefined
}

// *** ฟังก์ชันจัดรูปแบบตัวเลขให้มีคอมม่าและทศนิยม 2 ตำแหน่ง ***
const formatNumberWithCommas = (value: string | number): string => {
  if (typeof value === 'string') {
    value = parseFloat(value) || 0; // แปลงเป็น number ก่อน ถ้าเป็น string
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// *** ฟังก์ชันแปลงตัวเลขเป็นตัวอักษรไทย ***
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const numberToThaiText = (num: number): string => {
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  if (num === 0) return 'ศูนย์บาทถ้วน';
  
  const [intPart, decPart] = num.toFixed(2).split('.');
  let result = '';
  
  // แปลงส่วนจำนวนเต็ม
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
  
  // แปลงส่วนทศนิยม
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


export default function CarBillForm({ onBack }: { onBack: () => void }) {
  const [billId, setBillId] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [focusedItemId, setFocusedItemId] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { showSuccess, showError, showWarning } = useNotification();

  const MAX_BILL_ITEMS = 7;

  const [formData, setFormData] = useState<BillFormData>({
    customer: {
      title: "", firstName: "", lastName: "", idNumber: "", phone: "",
      houseNo: "", moo: "", soi: "", road: "", subDistrict: "",
      district: "", province: "", zipCode: "",
      visitDate: "", pickupDate: ""
    },
    car: {
      licensePlate: "", carBrand: "", carModel: ""
    },
    billItems: [{ id: 1, description: "", amount: "" }],
    totalAmount: "0.00",
    billDate: "",
    paymentMethod: "cash"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, section: 'customer' | 'car' | 'general') => {
    setIsSaved(false);

    if (section === 'general') {
      setFormData(prev => ({
        ...prev,
        [e.target.id]: e.target.value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [e.target.id]: e.target.value
        }
      }));
    }
  };

  const addBillItem = () => {
    if (formData.billItems.length < MAX_BILL_ITEMS) {
      const newId = formData.billItems.length > 0 ? Math.max(...formData.billItems.map(item => item.id)) + 1 : 1;
      setFormData(prev => {
        const newItems = [...prev.billItems, { id: newId, description: "", amount: "" }];
        // คำนวณยอดรวมใหม่
        const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        return {
          ...prev,
          billItems: newItems,
          totalAmount: total.toFixed(2)
        };
      });
      setIsSaved(false);
      setFormErrors({});
    }
  };

  const removeBillItem = (id: number) => {
    setFormData(prev => {
      const newItems = prev.billItems.filter(item => item.id !== id);
      // คำนวณยอดรวมใหม่
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        ...prev,
        billItems: newItems,
        totalAmount: total.toFixed(2)
      };
    });
    setIsSaved(false);
    setFormErrors({});
  };

  const updateBillItem = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newItems = [...prev.billItems];
      if (field === "amount") {
        // อนุญาตให้กรอกได้เฉพาะตัวเลขและจุดทศนิยม
        const cleanValue = value.replace(/[^0-9.]/g, '');
        newItems[index] = { ...newItems[index], amount: cleanValue };
      } else {
        newItems[index] = { ...newItems[index], description: value };
      }
      
      // คำนวณยอดรวมใหม่อัตโนมัติ
      const total = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalFormatted = total.toFixed(2);
      
      return { 
        ...prev, 
        billItems: newItems,
        totalAmount: totalFormatted
      };
    });
    setIsSaved(false);
  };

  const calculateTotalAmount = () => {
    const total = formData.billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    return formatNumberWithCommas(total);
  };

  const canAddMoreItems = formData.billItems.length < MAX_BILL_ITEMS;

  const validateForm = () => {
    // แก้ไข: เปลี่ยน errors จาก let any เป็น const FormErrors
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.customer.firstName.trim()) {
      errors.firstName = "กรุณากรอกชื่อ";
      isValid = false;
    }
    if (!formData.customer.lastName.trim()) {
      errors.lastName = "กรุณากรอกนามสกุล";
      isValid = false;
    }
    if (!formData.customer.idNumber.trim()) {
      errors.idNumber = "กรุณากรอกเลขบัตรประชาชน";
      isValid = false;
    } else if (formData.customer.idNumber.trim().length !== 13 || !/^\d+$/.test(formData.customer.idNumber.trim())) {
      errors.idNumber = "เลขบัตรประชาชนไม่ถูกต้อง (13 หลัก)";
      isValid = false;
    }
    if (!formData.customer.visitDate) {
      errors.visitDate = "กรุณากรอกวันที่มาทำ";
      isValid = false;
    }
    if (!formData.billDate) {
      errors.billDate = "กรุณากรอกวันที่ออกบิล";
      isValid = false;
    }

    if (!formData.car.licensePlate.trim()) {
      errors.licensePlate = "กรุณากรอกทะเบียนรถ";
      isValid = false;
    }
    if (!formData.car.carBrand.trim()) {
      errors.carBrand = "กรุณากรอกยี่ห้อรถ";
      isValid = false;
    }
    if (!formData.car.carModel.trim()) {
      errors.carModel = "กรุณากรอกรุ่นรถ";
      isValid = false;
    }

    if (formData.billItems.length === 0) {
      errors.billItems = "กรุณาเพิ่มรายการในบิลอย่างน้อย 1 รายการ";
      isValid = false;
    } else {
      formData.billItems.forEach((item) => {
        if (!item.description.trim()) {
          errors[`itemDescription-${item.id}`] = "กรุณากรอกรายละเอียด";
          isValid = false;
        }
        if (!item.amount.trim() || isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
          errors[`itemAmount-${item.id}`] = "กรุณากรอกยอดเงินให้ถูกต้อง";
          isValid = false;
        }
      });
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSearch = () => {
    if (!billId.trim()) {
      showWarning("กรุณากรอกเลขที่บิล", "กรุณากรอกเลขที่บิลที่ต้องการค้นหา");
      return;
    }

    const dummyData: BillFormData[] = [
      {
        billId: "BILL001",
        customer: {
          title: "นาย", firstName: "สมชาย", lastName: "ใจดี", idNumber: "1234567890123",
          phone: "081-234-5678",
          houseNo: "10/1", moo: "5", soi: "สุขุมวิท", road: "สุขุมวิท", subDistrict: "คลองเตย",
          district: "คลองเตย", province: "กรุงเทพมหานคร", zipCode: "10110",
          visitDate: "2024-06-01", pickupDate: "2024-06-05"
        },
        car: {
          licensePlate: "กข 1234", carBrand: "Toyota", carModel: "Camry"
        },
        billItems: [
          { id: 1, description: "เปลี่ยนถ่ายน้ำมันเครื่อง", amount: "1500.00" },
          { id: 2, description: "เปลี่ยนแบตเตอรี่", amount: "2500.00" }
        ],
        totalAmount: "4000.00",
        billDate: "2024-06-15",
        paymentMethod: "cash"
      },
      {
        billId: "BILL002",
        customer: {
          title: "นางสาว", firstName: "สมหญิง", lastName: "รักเรียน", idNumber: "9876543210987",
          phone: "092-345-6789",
          houseNo: "20", moo: "1", soi: "", road: "พหลโยธิน", subDistrict: "สามเสนใน",
          district: "พญาไท", province: "กรุงเทพมหานคร", zipCode: "10400",
          visitDate: "2024-05-10", pickupDate: "2024-05-12"
        },
        car: {
          licensePlate: "งจ 5678", carBrand: "Honda", carModel: "Civic"
        },
        billItems: [
          { id: 1, description: "ซ่อมสีรอบคัน", amount: "12000.00" }
        ],
        totalAmount: "12000.00",
        billDate: "2024-05-20",
        paymentMethod: "transfer"
      }
    ];

    const foundBill = dummyData.find(bill => bill.billId === billId.trim());

    if (foundBill) {
      setFormData({
        ...foundBill,
        // สำคัญ: เมื่อโหลดข้อมูล ควรคำนวณ totalAmount ใหม่โดยใช้ค่า amount ที่ไม่ได้จัดรูปแบบ
        // และเก็บ billItems.amount เป็น string เหมือนเดิม
        totalAmount: formatNumberWithCommas(
          foundBill.billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
        ),
      });
      setIsSaved(true);
      setFormErrors({});
      showSuccess(`พบข้อมูลบิลเลขที่ ${billId}`, `พบข้อมูลบิลเลขที่ ${billId} แล้ว!`);
    } else {
      showError(`ไม่พบข้อมูลบิลเลขที่ ${billId}`, `ไม่พบข้อมูลบิลเลขที่ ${billId} ในระบบ`);
      setFormData({
        customer: {
          title: "", firstName: "", lastName: "", idNumber: "", phone: "",
          houseNo: "", moo: "", soi: "", road: "", subDistrict: "",
          district: "", province: "", zipCode: "",
          visitDate: "", pickupDate: ""
        },
        car: {
          licensePlate: "", carBrand: "", carModel: ""
        },
        billItems: [{ id: 1, description: "", amount: "" }],
        totalAmount: "0.00",
        billDate: "",
        paymentMethod: "cash"
      });
      setIsSaved(false);
      setFormErrors({});
    }
  };

  const handleSaveBill = () => {
    if (!validateForm()) {
      showError("กรุณาแก้ไขข้อผิดพลาด", "กรุณาแก้ไขข้อผิดพลาดในฟอร์มก่อนบันทึก");
      return;
    }

    const actionType = formData.billId ? "อัปเดต" : "บันทึกใหม่";

    console.log(`${actionType}บิลแล้ว!`);
    const dataToSend = {
        ...formData,
        totalAmount: parseFloat(calculateTotalAmount().replace(/,/g, '')),
    };
    console.log("ข้อมูลที่ส่ง:", dataToSend);

    if (!formData.billId) {
        setFormData(prev => ({ ...prev, billId: `NEWBILL_${Date.now()}` }));
    }

    setIsSaved(true);
    showSuccess(`${actionType}บิลเรียบร้อยแล้ว!`, `ตอนนี้คุณสามารถส่งออก PDF ได้`);
  };

  const handleExportPdf = () => {
    if (!isSaved) {
      showWarning("กรุณาบันทึกบิลก่อน", "กรุณาบันทึกบิลก่อนส่งออกเป็น PDF");
      return;
    }
    
    // ใช้ browser's print dialog เพื่อบันทึกเป็น PDF
    window.print();
  };

  const handlePrint = () => {
    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!formData.customer.firstName || !formData.customer.lastName || 
        !formData.car.licensePlate || !formData.car.carBrand || 
        formData.billItems.some(item => !item.description || !item.amount)) {
      showWarning('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนดูใบเสร็จ');
      return;
    }
    
    // คำนวณยอดรวมอีกครั้งก่อนแสดงใบเสร็จ
    const total = formData.billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    console.log('=== DEBUG PRINT ===');
    console.log('Bill Items:', formData.billItems);
    console.log('Calculated Total:', total);
    console.log('Current totalAmount:', formData.totalAmount);
    
    // อัปเดตยอดรวมและแสดงใบเสร็จทันที
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toFixed(2)
    }));
    
    // แสดงใบเสร็จทันที
    setShowReceipt(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8 lg:p-10 bg-gray-100 dark:bg-gray-900 min-h-screen"
    >
      <div className="flex items-center mb-8 no-print">
        <button
          onClick={onBack}
          className="mr-4 p-3 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all duration-300 shadow-sm"
          aria-label="ย้อนหลัง"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
        </button>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FontAwesomeIcon icon={faCar} className="mr-4 text-blue-500" />
          ออกบิลเงินสด: บิลรถยนต์
        </h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg no-print">
        กรุณากรอกข้อมูลสำหรับการออกบิลเงินสดสำหรับรถยนต์ให้ครบถ้วน
      </p>

      {/* ส่วนค้นหาข้อมูล */}
      <div className="p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg mb-8 no-print">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">ค้นหาข้อมูลบิล</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="billIdSearch" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              เลขที่บิลที่ต้องการค้นหา (เช่น BILL001, BILL002)
            </label>
            <input
              type="text"
              id="billIdSearch"
              placeholder="กรอกเลขที่บิล"
              value={billId}
              onChange={(e) => setBillId(e.target.value)}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:shadow-outline min-w-[120px] transition-all duration-300 shadow-md"
          >
            <FontAwesomeIcon icon={faSearch} className="mr-2" /> ค้นหา
          </button>
        </div>
      </div>


      {/* ข้อมูลลูกค้า */}
      <div className="p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              คำนำหน้า
            </label>
            <select
              id="title"
              value={formData.customer.title}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <option value="">เลือก</option>
              <option value="นาย">นาย</option>
              <option value="นาง">นาง</option>
              <option value="นางสาว">นางสาว</option>
            </select>
            {formErrors.title && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.title}</p>}
          </div>
          <div>
            <label htmlFor="firstName" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              placeholder="ชื่อ"
              value={formData.customer.firstName}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.firstName && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              placeholder="นามสกุล"
              value={formData.customer.lastName}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.lastName && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.lastName}</p>}
          </div>
          <div>
            <label htmlFor="idNumber" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              เลขบัตรประชาชน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="idNumber"
              placeholder="เลขบัตรประชาชน"
              value={formData.customer.idNumber}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.idNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.idNumber && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.idNumber}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              placeholder="0XX-XXX-XXXX"
              value={formData.customer.phone}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.phone}</p>}
          </div>
          <div>
            <label htmlFor="houseNo" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              บ้านเลขที่
            </label>
            <input
              type="text"
              id="houseNo"
              placeholder="บ้านเลขที่"
              value={formData.customer.houseNo}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="moo" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              หมู่
            </label>
            <input
              type="text"
              id="moo"
              placeholder="หมู่"
              value={formData.customer.moo}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="soi" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ซอย
            </label>
            <input
              type="text"
              id="soi"
              placeholder="ซอย"
              value={formData.customer.soi}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="road" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ถนน
            </label>
            <input
              type="text"
              id="road"
              placeholder="ถนน"
              value={formData.customer.road}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="subDistrict" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ตำบล
            </label>
            <input
              type="text"
              id="subDistrict"
              placeholder="ตำบล"
              value={formData.customer.subDistrict}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="district" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              อำเภอ
            </label>
            <input
              type="text"
              id="district"
              placeholder="อำเภอ"
              value={formData.customer.district}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="province" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              จังหวัด
            </label>
            <input
              type="text"
              id="province"
              placeholder="จังหวัด"
              value={formData.customer.province}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="zipCode" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              รหัสไปรษณีย์
            </label>
            <input
              type="text"
              id="zipCode"
              placeholder="รหัสไปรษณีย์"
              value={formData.customer.zipCode}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="visitDate" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              วันที่มาทำ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="visitDate"
              value={formData.customer.visitDate}
              onChange={(e) => handleInputChange(e, 'customer')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.visitDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.visitDate && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.visitDate}</p>}
          </div>
          <div>
            <label htmlFor="pickupDate" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              วันนัดรับ
            </label>
            <input
              type="date"
              id="pickupDate"
              value={formData.customer.pickupDate}
              onChange={(e) => handleInputChange(e, 'customer')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* ข้อมูลรถยนต์ */}
      <div className="p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">ข้อมูลรถยนต์</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="licensePlate" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ทะเบียนรถ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="licensePlate"
              placeholder="ทะเบียนรถ"
              value={formData.car.licensePlate}
              onChange={(e) => handleInputChange(e, 'car')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.licensePlate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.licensePlate && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.licensePlate}</p>}
          </div>
          <div>
            <label htmlFor="carBrand" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ยี่ห้อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="carBrand"
              placeholder="ยี่ห้อรถ"
              value={formData.car.carBrand}
              onChange={(e) => handleInputChange(e, 'car')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.carBrand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.carBrand && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.carBrand}</p>}
          </div>
          <div>
            <label htmlFor="carModel" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              รุ่น <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="carModel"
              placeholder="รุ่นรถ"
              value={formData.car.carModel}
              onChange={(e) => handleInputChange(e, 'car')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.carModel ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.carModel && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.carModel}</p>}
          </div>
        </div>
      </div>

      {/* รายละเอียดบิล - New UI */}
      <div className="p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">รายการและยอดเงิน</h2>

        {/* Header สำหรับตารางรายการ */}
        <div className="grid grid-cols-10 gap-4 mb-3 font-semibold text-gray-700 dark:text-gray-300 text-base">
          <div className="col-span-7">รายละเอียด <span className="text-red-500">*</span></div>
          <div className="col-span-3 text-right">ยอดเงิน (บาท) <span className="text-red-500">*</span></div>
        </div>

        {/* ข้อความผิดพลาดสำหรับรายการบิลโดยรวม */}
        {formErrors.billItems && <p className="text-red-500 text-sm mb-4 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.billItems}</p>}

        {/* รายการบิลแต่ละรายการ */}
        {formData.billItems.map((item, index) => (
          <div key={item.id} className="grid grid-cols-10 gap-4 mb-4 items-center">
            <div className="col-span-7">
              <input
                type="text"
                placeholder="เช่น ค่าต่อ พ.ร.บ. ค่าประกันภัยชั้น 1"
                value={item.description}
                onChange={(e) => updateBillItem(index, "description", e.target.value)}
                className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                  ${formErrors[`itemDescription-${item.id}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {formErrors[`itemDescription-${item.id}`] && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors[`itemDescription-${item.id}`]}</p>}
            </div>
            <div className="col-span-2">
              <input
                type="text"
                placeholder="0.00"
                // *** เปลี่ยนการตรวจสอบ activeElement มาใช้ focusedItemId ***
                value={
                    focusedItemId === item.id || item.amount === ""
                        ? item.amount
                        : formatNumberWithCommas(item.amount)
                }
                onChange={(e) => updateBillItem(index, "amount", e.target.value)}
                onFocus={() => setFocusedItemId(item.id)} // เมื่อ input ได้รับโฟกัส
                onBlur={() => setFocusedItemId(null)}     // เมื่อ input เสียโฟกัส
                className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-right transition-all duration-200
                  ${formErrors[`itemAmount-${item.id}`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {formErrors[`itemAmount-${item.id}`] && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors[`itemAmount-${item.id}`]}</p>}
            </div>
            <div className="col-span-1 flex justify-end">
              {formData.billItems.length > 1 && (
                <button
                  onClick={() => removeBillItem(item.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-800 dark:text-red-400 transition-colors duration-200"
                  aria-label="ลบรายการ"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-lg" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* ปุ่มเพิ่มรายการ */}
        <button
          onClick={addBillItem}
          className={`flex items-center transition-colors duration-200 mt-4 mb-6 text-base font-medium ${
            canAddMoreItems
              ? "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
          disabled={!canAddMoreItems}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2 text-lg" /> เพิ่มรายการ
        </button>
        {!canAddMoreItems && (
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">
            * สามารถเพิ่มรายการได้สูงสุด {MAX_BILL_ITEMS} รายการ
          </p>
        )}

        {/* ยอดรวม */}
        <div className="flex justify-end items-center border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100 mr-4">รวมทั้งสิ้น:</span>
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {calculateTotalAmount()} บาท
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="billDate" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              วันที่ออกบิล <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="billDate"
              value={formData.billDate}
              onChange={(e) => handleInputChange(e, 'general')}
              className={`shadow-sm border rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200
                ${formErrors.billDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.billDate && <p className="text-red-500 text-xs mt-1 flex items-center"><FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />{formErrors.billDate}</p>}
          </div>
          <div>
            <label htmlFor="paymentMethod" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              ช่องทางการชำระเงิน <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange(e, 'general')}
              className="shadow-sm border border-gray-300 dark:border-gray-600 rounded-lg w-full py-2.5 px-3 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            >
              <option value="cash">เงินสด</option>
              <option value="transfer">โอนเงิน</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* ปุ่มบันทึกและส่งออก */}
      <div className="flex gap-4 mt-8 no-print">
        <button
          onClick={handleSaveBill}
          className={`py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[180px] transition-all duration-300 text-lg shadow-md
            bg-blue-600 hover:bg-blue-700 text-white`}
        >
          <FontAwesomeIcon icon={faSave} className="mr-3 text-xl" /> {formData.billId ? "อัปเดตบิล" : "บันทึกบิล"}
        </button>

        <button
          onClick={handlePrint}
          className="py-3 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[180px] transition-all duration-300 text-lg shadow-md"
        >
          <FontAwesomeIcon icon={faPrint} className="mr-3 text-xl" /> ปริ้น/บันทึก PDF
        </button>

        <button
          onClick={handleExportPdf}
          disabled={!isSaved}
          className={`py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[180px] transition-all duration-300 text-lg shadow-md
            ${isSaved
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
            }`}
        >
          <FontAwesomeIcon icon={faFilePdf} className="mr-3 text-xl" /> ดาวน์โหลด PDF
        </button>
      </div>

      {/* แสดงใบเสร็จเมื่อกดปริ้น */}
      {showReceipt && (
        <ReceiptPreview
          data={{
            billId: formData.billId || '',
            billDate: formData.billDate,
            customer: formData.customer,
            car: formData.car,
            billItems: formData.billItems,
            totalAmount: formData.totalAmount,
            paymentMethod: formData.paymentMethod
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </motion.div>
  );
}