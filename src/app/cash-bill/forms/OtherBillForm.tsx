// src/app/cash-bill/forms/OtherBillForm.tsx
"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faSave, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function OtherBillForm({ onBack }: { onBack: () => void }) {
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
          <FontAwesomeIcon icon={faFileAlt} className="mr-3 text-emerald-600" /> ออกบิลเงินสด: บิลอื่นๆ
        </h1>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-6">
        กรุณากรอกข้อมูลสำหรับการออกบิลเงินสดสำหรับรายการอื่นๆ
      </p>

      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-8">
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
          <label htmlFor="customerTel" className="block text-700 dark:text-gray-300 text-sm font-bold mb-2">
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
          <label htmlFor="itemDescription" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            ชื่อสินค้า/บริการ
          </label>
          <input
            type="text"
            id="itemDescription"
            placeholder="ระบุชื่อสินค้าหรือบริการ"
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
          <label htmlFor="additionalNotes" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            หมายเหตุเพิ่มเติม
          </label>
          <textarea
            id="additionalNotes"
            rows={3}
            placeholder="รายละเอียดเพิ่มเติมของบิล (ถ้ามี)"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
          ></textarea>
        </div>
      </div>

      <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center min-w-[120px]">
        <FontAwesomeIcon icon={faSave} className="mr-2" /> บันทึกบิล
      </button>
    </motion.div>
  );
}