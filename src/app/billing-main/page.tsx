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
import { useState } from "react";

// ลบ import useSidebar ออก เพราะไม่จำเป็นต้องใช้แล้ว
// import { useSidebar } from '../context/SidebarContext';

import CarBillForm from "../cash-bill/forms/CarBillForm";
import MotorcycleBillForm from "../cash-bill/forms/MotorcycleBillForm";
import OtherBillForm from "../cash-bill/forms/OtherBillForm";

const latestBills = [
  { id: 'B001', type: 'รถยนต์', customer: 'สมชาย รักไทย', amount: '1,500.00', date: '2025-06-12', detail: 'ค่าต่อ พ.ร.บ.' },
  { id: 'B002', type: 'จักรยานยนต์', customer: 'สุมาลี มีสุข', amount: '600.00', date: '2025-06-11', detail: 'ค่าประกันภาคสมัครใจ' },
  { id: 'B003', type: 'อื่นๆ', customer: 'ประยุทธ์ จันทร์โอชา', amount: '2,500.00', date: '2025-06-10', detail: 'ค่าทำทะเบียนใหม่' },
  { id: 'B004', type: 'รถยนต์', customer: 'อรุณี แจ่มใส', amount: '1,200.00', date: '2025-06-09', detail: 'ค่าธรรมเนียมโอนรถ' },
];

export default function BillingMainPage() {
  const [activeBillType, setActiveBillType] = useState<
    "main" | "car" | "motorcycle" | "other"
  >("main");

  // ลบ headerRef และ headerHeight state ออกทั้งหมด

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

  return (
    // BillingMainPage เป็นแค่ส่วน Content ที่อยู่ภายใน <main> ของ Layout.tsx
    // <main> มี p-5 อยู่แล้ว ดังนั้น div หลักของ BillingMainPage จะมี padding เริ่มต้นที่ 5
    // เราจะใส่ bg-white, rounded-lg, shadow-md, และ p-6 ให้กับ div นี้
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      {/* ส่วนหัวและปุ่ม (นี่คือ Header ของ BillingMainPage, ไม่ได้ Fixed ระดับ Viewport) */}
      {/* มันจะอยู่ใน Flow ปกติของ Content Area */}
      <div className="bg-white dark:bg-gray-800 pb-6 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          ออกบิลเงินสด
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveBillType("car")}
            className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faCar} className="text-xl mb-1" />
            <span className="text-base">บิลรถยนต์</span>
          </button>

          <button
            onClick={() => setActiveBillType("motorcycle")}
            className="flex flex-col items-center justify-center p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faMotorcycle} className="text-xl mb-1" />
            <span className="text-base">บิลจักรยานยนต์</span>
          </button>

          <button
            onClick={() => setActiveBillType("other")}
            className="flex flex-col items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faFileAlt} className="text-xl mb-1" />
            <span className="text-base">บิลอื่นๆ</span>
          </button>
        </div>
      </div>

      <hr className="my-6 border-gray-200 dark:border-gray-700" />

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
    </motion.div>
  );
}