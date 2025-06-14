// src/app/cash-bill/forms/MotorcycleBillForm.tsx
"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMotorcycle, faSave, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function MotorcycleBillForm({ onBack }: { onBack: () => void }) {
  return (
    <motion.div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
          aria-label="ย้อนกลับ"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FontAwesomeIcon icon={faMotorcycle} className="mr-3 text-green-600" /> ออกบิลเงินสด: บิลจักรยานยนต์
        </h1>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-6">
        กรุณากรอกข้อมูลสำหรับการออกบิลเงินสดสำหรับจักรยานยนต์
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

        {/* ข้อมูลจักรยานยนต์ */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">ข้อมูลจักรยานยนต์</h2>
          <div className="mb-4">
            <label htmlFor="motorcycleLicensePlate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              ทะเบียนรถจักรยานยนต์
            </label>
            <input
              type="text"
              id="motorcycleLicensePlate"
              placeholder="ทะเบียนรถจักรยานยนต์"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="motorcycleChassisNumber" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              เลขตัวถัง
            </label>
            <input
              type="text"
              id="motorcycleChassisNumber"
              placeholder="เลขตัวถัง"
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
            placeholder="เช่น ค่าต่อ พ.ร.บ. จักรยานยนต์"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          ></textarea>
        </div>
      </div>

      <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[120px]">
        <FontAwesomeIcon icon={faSave} className="mr-2" /> บันทึกบิล
      </button>
    </motion.div>
  );
}