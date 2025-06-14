// src/app/report-main/page.tsx
"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // Using faSearch for the search button

export default function ReportMainPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        หน้ารายงานหลัก
      </h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        หน้านี้จะแสดงสรุปและตัวเลือกสำหรับรายงานต่างๆ ของระบบ.
      </p>

      {/* Search and Filter Section (mimicking your screenshot) */}
      <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">ค้นหารายงาน</h2>

        <div className="mb-4">
          <label htmlFor="search" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            ค้นหา
          </label>
          <input
            type="text"
            id="search"
            placeholder="เลขที่กรรมธรรม์, ชื่อ-นามสกุล, ทะเบียนรถ, เลขตัวถัง, เลขเครื่องยนต์..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">บริษัทประกัน</label>
                <select className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100">
                    <option>ทั้งหมด</option>
                    <option>บริษัท ก</option>
                    <option>บริษัท ข</option>
                </select>
            </div>
            <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ประเภท</label>
                <select className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100">
                    <option>ทั้งหมด</option>
                    <option>ต่อภาษี</option>
                    <option>พ.ร.บ.</option>
                </select>
            </div>
            <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">สาขา</label>
                <select className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100">
                    <option>ทั้งหมด</option>
                    <option>สาขา 1</option>
                    <option>สาขา 2</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">วันที่รับชำระ</label>
                <div className="flex space-x-2">
                    <input type="date" className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100" />
                    <span className="text-gray-700 dark:text-gray-300 flex items-center">ถึง</span>
                    <input type="date" className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100" />
                </div>
            </div>
            <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">ชื่อรับเงิน</label>
                <input type="text" placeholder="ชื่อผู้รับเงิน" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100" />
            </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[120px]">
            <FontAwesomeIcon icon={faSearch} className="mr-2" /> ค้นหา
        </button>
      </div>

      {/* Add your report results table here */}
      <div className="mt-8 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">ผลการค้นหา</h3>
          <p className="text-gray-700 dark:text-gray-300">ตารางแสดงข้อมูลรายงานจะปรากฏที่นี่...</p>
      </div>
    </motion.div>
  );
}