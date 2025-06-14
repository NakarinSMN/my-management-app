// src/app/billing-main/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faMotorcycle,
  faFileAlt,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react"; // เพิ่ม useRef และ useEffect

import CarBillForm from "../cash-bill/forms/CarBillForm";
import MotorcycleBillForm from "../cash-bill/forms/MotorcycleBillForm";
import OtherBillForm from "../cash-bill/forms/OtherBillForm";

const latestBills = [
  { id: 'B001', type: 'รถยนต์', customer: 'สมชาย รักไทย', amount: '1,500.00', date: '2025-06-12', detail: 'ค่าต่อ พ.ร.b.' },
  { id: 'B002', type: 'จักรยานยนต์', customer: 'สุมาลี มีสุข', amount: '600.00', date: '2025-06-11', detail: 'ค่าประกันภาคสมัครใจ' },
  { id: 'B003', type: 'อื่นๆ', customer: 'ประยุทธ์ จันทร์โอชา', amount: '2,500.00', date: '2025-06-10', detail: 'ค่าทำทะเบียนใหม่' },
  { id: 'B004', type: 'รถยนต์', customer: 'อรุณี แจ่มใส', amount: '1,200.00', date: '2025-06-09', detail: 'ค่าธรรมเนียมโอนรถ' },
];

export default function BillingMainPage() {
  const [activeBillType, setActiveBillType] = useState<
    "main" | "car" | "motorcycle" | "other"
  >("main");

  // ใช้ useRef เพื่ออ้างอิงถึง Header และวัดความสูงของมัน
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      // เมื่อ Component Mount หรือเมื่อขนาดเปลี่ยน ให้วัดความสูง
      setHeaderHeight(headerRef.current.offsetHeight);
      // หรือใช้ ResizeObserver เพื่อจับการเปลี่ยนแปลงขนาดที่แม่นยำยิ่งขึ้น
      // const resizeObserver = new ResizeObserver(entries => {
      //   for (let entry of entries) {
      //     setHeaderHeight(entry.contentRect.height);
      //   }
      // });
      // resizeObserver.observe(headerRef.current);
      // return () => resizeObserver.disconnect();
    }
  }, []); // [] หมายถึงทำงานแค่ครั้งเดียวตอน Mount

  const renderBillForm = () => {
    switch (activeBillType) {
      case "car":
        return <CarBillForm onBack={() => setActiveBillType("main")} />;
      case "motorcycle":
        return <MotorcycleBillForm onBack={() => setActiveBillType("main")} />;
      case "other":
        return <OtherBillForm onBack={() => setActiveBillType("main")} />;
      default:
        return null;
    }
  };

  // ***** ส่วนสำคัญ: กำหนดความกว้างของ Sidebar ที่นี่ *****
  // จากภาพที่แนบมา Sidebar ดูเหมือนจะมี width ประมาณ w-64 หรือ 256px
  // คุณต้องตรวจสอบค่านี้ให้ตรงกับ Sidebar ในโปรเจกต์ของคุณ
  const SIDEBAR_WIDTH_PX = 256; // เช่น ถ้าใช้ Tailwind 'w-64' = 256px

  return (
    // นี่คือ Main Content Wrapper สำหรับหน้า BillingMainPage เท่านั้น
    // ไม่ใช่ Layout หลักของทั้งแอป ถ้าคุณมี Sidebar ที่อยู่คนละ Component กับ BillingMainPage
    // การจัดการ Layout ควรทำใน layout.tsx หรือ Component ที่ครอบทั้งคู่
    <div className="flex bg-gray-50 dark:bg-gray-900">
      {/*
        หาก Sidebar ไม่ได้ถูกจัดการใน Layout.tsx
        และอยู่ในระดับเดียวกันกับ BillingMainPage
        คุณจะต้องนำ Sidebar Component มาวางไว้ที่นี่ (นอก BillingMainPage)
        หรือถ้า BillingMainPage เป็นเนื้อหาหลักที่อยู่ภายใน Layout ที่มี Sidebar อยู่แล้ว
        คุณไม่จำเป็นต้องเพิ่ม Sidebar เข้ามาในไฟล์นี้
      */}
      {/* ตัวอย่าง: ถ้า BillingMainPage อยู่ภายใน layout.tsx ที่มี sidebar อยู่แล้ว
        ดังนั้น BillingMainPage นี้จะครอบคลุมแค่ส่วนเนื้อหาหลักเท่านั้น
      */}

      {/* เนื่องจาก BillingMainPage น่าจะเป็นส่วนของ Content หลัก ไม่ใช่ Layout หลักของทั้งแอป
        เราจะใช้ประโยชน์จาก `layout.tsx` ของ Next.js ในการสร้าง Fixed Sidebar และ Fixed Header
        และปล่อยให้ `page.tsx` นี้เป็นแค่ส่วน Content ที่เหมาะสม
      */}

      {/* ส่วนเนื้อหาหลักของหน้า ซึ่งจะถูกดันไปทางขวาของ Sidebar (ถ้ามี) */}
      <div className="flex-1 flex flex-col"> {/* flex-1 ทำให้ div นี้ขยายเต็มพื้นที่ที่เหลือ */}
        {/* ส่วนหัวและปุ่มที่ตรึงอยู่ด้านบนสุดของ viewport */}
        <div
          ref={headerRef} // อ้างอิงถึง Header Element
          className={`fixed top-0 z-50 bg-white dark:bg-gray-800 p-6 shadow-md`}
          style={{ left: `${SIDEBAR_WIDTH_PX}px`, right: 0 }} // ตรึงจากขอบซ้ายเท่ากับความกว้าง Sidebar
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            ออกบิลเงินสด
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveBillType("car")}
              // ปรับลดขนาดที่นี่: p-x (padding), text-x (text size), text-x (icon size)
              className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faCar} className="text-1xl mb-1" /> {/* ลดจาก text-4xl เป็น text-3xl, ลด mb-3 เป็น mb-2 */}
              <span className="text-lg">บิลรถยนต์</span> {/* ลดจาก text-xl เป็น text-lg */}
            </button>

            <button
              onClick={() => setActiveBillType("motorcycle")}
              // ปรับลดขนาดที่นี่
              className="flex flex-col items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faMotorcycle} className="text-1xl mb-1" />
              <span className="text-lg">บิลจักรยานยนต์</span>
            </button>

            <button 
              onClick={() => setActiveBillType("other")}
              // ปรับลดขนาดที่นี่
              className="flex flex-col items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faFileAlt} className="text-1xl mb-1" />
              <span className="text-lg">บิลอื่นๆ</span>
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหาหลักที่เลื่อนได้ จะถูกดันลงมาให้พ้น Header และ Sidebar */}
        <div
          className="flex-grow overflow-y-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
          style={{ paddingTop: `${headerHeight + 24}px` }} // ใช้ headerHeight + margin-top (24px = mb-6 + mt-6)
        >
          {/* ไม่ต้องมี placeholder div เปล่าๆ แล้ว ใช้ padding-top แทน */}

          <hr className="my-1 border-none" />

          <AnimatePresence mode="wait">
            {activeBillType !== "main" && (
              <motion.div
                key={activeBillType}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                {renderBillForm()}
              </motion.div>
            )}
            {activeBillType === "main" && (
              <motion.div
                key="main-content"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
          
                {/* ส่วนแสดงรายการบิลล่าสุด */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faHistory} className="mr-3 text-blue-500" /> รายการบิลล่าสุด
                  </h2>
                  {latestBills.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <thead className="bg-gray-200 dark:bg-gray-600">
                          <tr>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">เลขที่บิล</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ประเภท</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ลูกค้า</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ยอดเงิน</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">วันที่</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">รายละเอียด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestBills.map((bill) => (
                            <tr key={bill.id} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.id}</td>
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.type}</td>
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.customer}</td>
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.amount}</td>
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.date}</td>
                              <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.detail}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">ยังไม่มีรายการบิลล่าสุด</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}