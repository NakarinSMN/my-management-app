// src/app/cash-bill/forms/CarBillForm.tsx
"use client";

import { motion } from "framer-motion"; // *** เพิ่มบรรทัดนี้เข้ามา ***
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faSave, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CarBillForm({ onBack }: { onBack: () => void }) {
  return (
    <motion.div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          aria-label="ย้อนหลัง"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FontAwesomeIcon icon={faCar} className="mr-3 text-blue-600" /> ออกบิลเงินสด: บิลรถยนต์
        </h1>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-6">
        กรุณากรอกข้อมูลสำหรับการออกบิลเงินสดสำหรับรถยนต์
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ข้อมูลลูกค้า */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">ข้อมูลลูกค้า</h2>
          <div className="mb-4">
            <label htmlFor="customerName" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              ชื่อ-นามสกุล ลูกค้า
            </label>
            <input
              type="text"
              id="customerName"
              placeholder="ชื่อ-นามสกุล"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="customerTel" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              id="customerTel"
              placeholder="เบอร์โทรศัพท์"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
        </div>

        {/* ข้อมูลรถยนต์ */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">ข้อมูลรถยนต์</h2>
          <div className="mb-4">
            <label htmlFor="licensePlate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              ทะเบียนรถ
            </label>
            <input
              type="text"
              id="licensePlate"
              placeholder="ทะเบียนรถ"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="chassisNumber" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              เลขตัวถัง
            </label>
            <input
              type="text"
              id="chassisNumber"
              placeholder="เลขตัวถัง"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="engineNumber" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              เลขเครื่องยนต์
            </label>
            <input
              type="text"
              id="engineNumber"
              placeholder="เลขเครื่องยนต์"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* รายละเอียดบิล */}
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">รายละเอียดบิล</h2>
        <div className="mb-4">
          <label htmlFor="billDate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            วันที่ออกบิล
          </label>
          <input
            type="date"
            id="billDate"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="billAmount" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            ยอดเงิน
          </label>
          <input
            type="number"
            id="billAmount"
            placeholder="จำนวนเงิน"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="billDescription" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            รายละเอียด/รายการ
          </label>
          <textarea
            id="billDescription"
            rows={3}
            placeholder="เช่น ค่าต่อ พ.ร.บ. ค่าประกันภัยชั้น 1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          ></textarea>
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[120px]">
        <FontAwesomeIcon icon={faSave} className="mr-2" /> บันทึกบิล
      </button>
    </motion.div>
  );
}