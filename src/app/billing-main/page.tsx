// src/app/billing-main/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faMotorcycle,
  faFileAlt,
  faHistory,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import React, { useState, useMemo, memo } from "react";

import CarBillForm from "../cash-bill/forms/CarBillForm";
import MotorcycleBillForm from "../cash-bill/forms/MotorcycleBillForm";
import OtherBillForm from "../cash-bill/forms/OtherBillForm";
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';

// กำหนด Type ของ Bill เพื่อความชัดเจน
interface Bill {
  id: string;
  type: string;
  customer: string;
  amount: string;
  date: string;
  detail: string;
  status: 'paid' | 'pending' | 'cancelled';
}

const allBills: Bill[] = [
  { id: 'B001', type: 'รถยนต์', customer: 'สมชาย รักไทย', amount: '1,500.00', date: '2025-06-12', detail: 'ค่าต่อ พ.ร.บ.', status: 'paid' },
  { id: 'B002', type: 'จักรยานยนต์', customer: 'สุมาลี มีสุข', amount: '600.00', date: '2025-06-11', detail: 'ค่าประกันภาคสมัครใจ', status: 'pending' },
  { id: 'B003', type: 'อื่นๆ', customer: 'ประยุทธ์ จันทร์โอชา', amount: '2,500.00', date: '2025-06-10', detail: 'ค่าทำทะเบียนใหม่', status: 'paid' },
  { id: 'B004', type: 'รถยนต์', customer: 'อรุณี แจ่มใส', amount: '1,200.00', date: '2025-06-09', detail: 'ค่าธรรมเนียมโอนรถ', status: 'cancelled' },
  { id: 'B005', type: 'รถยนต์', customer: 'ณเดชน์ คูกิมิยะ', amount: '950.00', date: '2025-06-08', detail: 'ค่าเปลี่ยนชื่อ', status: 'pending' },
  { id: 'B006', type: 'จักรยานยนต์', customer: 'นกน้อย บินไกล', amount: '350.00', date: '2025-06-07', detail: 'ค่าต่อภาษี', status: 'paid' },
  { id: 'B007', type: 'อื่นๆ', customer: 'วิไลวรรณ เจริญสุข', amount: '700.00', date: '2025-06-06', detail: 'ค่าแจ้งย้าย', status: 'pending' },
];

export default function BillingMainPage() {
  const [activeBillType, setActiveBillType] = useState<
    "main" | "car" | "motorcycle" | "other"
  >("main");

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<keyof Bill>('id');

  const filteredBills = useMemo(() => {
    if (!searchTerm) {
      return allBills;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allBills.filter(bill => {
      const value = bill[searchCategory]?.toString().toLowerCase();
      return value && value.includes(lowerCaseSearchTerm);
    });
  }, [searchTerm, searchCategory]);

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

  const renderStatus = (status: Bill['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> จ่ายแล้ว
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100">
            <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" /> รอดำเนินการ
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> ยกเลิก
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            ไม่ทราบสถานะ
          </span>
        );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Searching for "${searchTerm}" in category "${searchCategory}"`);
  };

  const BillRow = memo(function BillRow({ bill, index }: { bill: Bill, index: number }) {
    return (
      <tr className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'} border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700`}>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.id}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.type}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.customer}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.amount}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.date}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{bill.detail}</td>
        <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{renderStatus(bill.status)}</td>
      </tr>
    );
  });

  return (
    <AnimatedPage>
      <AnimatePresence mode="wait">
        {activeBillType !== "main" && (
          <motion.div
            key={activeBillType}
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {renderBillForm()}
          </motion.div>
        )}
        {activeBillType === "main" && (
          <motion.div
            key="main-content"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* ปุ่มออกบิล */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> {/* ปรับ gap และ margin-bottom */}
              <button
                onClick={() => setActiveBillType("car")}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:bg-blue-50 dark:hover:bg-gray-600 transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <FontAwesomeIcon icon={faCar} className="text-3xl mb-3 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-semibold">บิลรถยนต์</span>
              </button>
              <button
                onClick={() => setActiveBillType("motorcycle")}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:bg-green-50 dark:hover:bg-gray-600 transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <FontAwesomeIcon icon={faMotorcycle} className="text-3xl mb-3 text-green-600 dark:text-green-400" />
                <span className="text-lg font-semibold">บิลจักรยานยนต์</span>
              </button>
              <button
                onClick={() => setActiveBillType("other")}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md hover:bg-purple-50 dark:hover:bg-gray-600 transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <FontAwesomeIcon icon={faFileAlt} className="text-3xl mb-3 text-purple-600 dark:text-purple-400" />
                <span className="text-lg font-semibold">บิลอื่นๆ</span>
              </button>
            </div>
            {/* ส่วนค้นหา */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 mb-8"> {/* ปรับ padding, rounded, shadow, border, mb */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center"> {/* ปรับ mb */}
                    <FontAwesomeIcon icon={faSearch} className="mr-3 text-indigo-600 dark:text-indigo-400" /> ค้นหารายการบิล
                </h2>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 sm:gap-6"> {/* ปรับ gap */}
                    <div className="flex-grow">
                        <label htmlFor="searchCategory" className="sr-only">เลือกหมวดหมู่</label>
                        <select
                            id="searchCategory"
                            name="searchCategory"
                            className="block w-full py-2.5 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" // ปรับ padding, rounded, border, text size
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value as keyof Bill)}
                        >
                            <option value="id">เลขที่บิล</option>
                            <option value="customer">ลูกค้า</option>
                            <option value="type">ประเภท</option>
                            <option value="status">สถานะ</option>
                            <option value="detail">รายละเอียด</option>
                        </select>
                    </div>
                    <div className="flex-grow-[2]">
                        <label htmlFor="searchTerm" className="sr-only">พิมพ์ข้อมูลที่ต้องการค้นหา</label>
                        <input
                            type="text"
                            id="searchTerm"
                            name="searchTerm"
                            className="block w-full py-2.5 px-4 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" // ปรับ padding, rounded, border, text size, placeholder
                            placeholder={`ค้นหาด้วย ${
                                searchCategory === 'id' ? 'เลขที่บิล' :
                                searchCategory === 'customer' ? 'ชื่อลูกค้า' :
                                searchCategory === 'type' ? 'ประเภท' :
                                searchCategory === 'status' ? 'สถานะ (เช่น paid, pending)' :
                                'รายละเอียด'
                            }...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out" // ปรับ padding, font size, rounded
                    >
                        <FontAwesomeIcon icon={faSearch} className="mr-2" /> ค้นหา
                    </button>
                </form>
            </div>

            {/* ส่วนแสดงรายการบิลล่าสุด */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"> {/* ปรับ padding, rounded, shadow, border */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center"> {/* ปรับ mb */}
                <FontAwesomeIcon icon={faHistory} className="mr-3 text-blue-600 dark:text-blue-400" /> รายการบิลล่าสุด
              </h2>
              {filteredBills.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">เลขที่บิล</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ประเภท</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ลูกค้า</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ยอดเงิน</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">วันที่</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">รายละเอียด</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill, index) => (
                        <BillRow key={bill.id} bill={bill} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center text-base md:text-lg py-8 gap-3 w-full">
                  <div className="w-full">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4 mb-4">
                        <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                        <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/4"></div>
                        <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/5"></div>
                        <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/5"></div>
                        <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}