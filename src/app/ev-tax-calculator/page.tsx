"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaCalculator } from 'react-icons/fa';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';

interface TaxRate {
  weightRange: string;
  taxRate: number;
  reducedTaxRate: number;
}

const EV_TAX_RATES_7_SEATS: TaxRate[] = [
  { weightRange: "500", taxRate: 150, reducedTaxRate: 30 },
  { weightRange: "501-750", taxRate: 300, reducedTaxRate: 60 },
  { weightRange: "751-1,000", taxRate: 450, reducedTaxRate: 90 },
  { weightRange: "1,001-1,250", taxRate: 800, reducedTaxRate: 160 },
  { weightRange: "1,250-1,500", taxRate: 1000, reducedTaxRate: 200 },
  { weightRange: "1,501-1,750", taxRate: 1300, reducedTaxRate: 260 },
  { weightRange: "1,751-2,000", taxRate: 1600, reducedTaxRate: 320 },
  { weightRange: "2,001-2,500", taxRate: 1900, reducedTaxRate: 380 },
  { weightRange: "2,501-3,000", taxRate: 2200, reducedTaxRate: 440 },
  { weightRange: "3,001-3,500", taxRate: 2400, reducedTaxRate: 480 },
  { weightRange: "3,501-4,000", taxRate: 2600, reducedTaxRate: 520 },
  { weightRange: "4,001-4,500", taxRate: 2800, reducedTaxRate: 560 },
  { weightRange: "4,501-5,000", taxRate: 3000, reducedTaxRate: 600 },
  { weightRange: "5,001-6,000", taxRate: 3200, reducedTaxRate: 640 },
  { weightRange: "6,001-7,000", taxRate: 3400, reducedTaxRate: 680 },
  { weightRange: "7,001 ขึ้นไป", taxRate: 3600, reducedTaxRate: 720 }
];

const EV_TAX_RATES_OVER_7_SEATS: TaxRate[] = [
  { weightRange: "500", taxRate: 75, reducedTaxRate: 15 },
  { weightRange: "501-750", taxRate: 150, reducedTaxRate: 30 },
  { weightRange: "751-1,000", taxRate: 225, reducedTaxRate: 45 },
  { weightRange: "1,001-1,250", taxRate: 400, reducedTaxRate: 80 },
  { weightRange: "1,250-1,500", taxRate: 500, reducedTaxRate: 100 },
  { weightRange: "1,501-1,750", taxRate: 650, reducedTaxRate: 130 },
  { weightRange: "1,751-2,000", taxRate: 800, reducedTaxRate: 160 },
  { weightRange: "2,001-2,500", taxRate: 950, reducedTaxRate: 190 },
  { weightRange: "2,501-3,000", taxRate: 1100, reducedTaxRate: 220 },
  { weightRange: "3,001-3,500", taxRate: 1200, reducedTaxRate: 240 },
  { weightRange: "3,501-4,000", taxRate: 1300, reducedTaxRate: 260 },
  { weightRange: "4,001-4,500", taxRate: 1400, reducedTaxRate: 280 },
  { weightRange: "4,501-5,000", taxRate: 1500, reducedTaxRate: 300 },
  { weightRange: "5,001-6,000", taxRate: 1600, reducedTaxRate: 320 },
  { weightRange: "6,001-7,000", taxRate: 1700, reducedTaxRate: 340 },
  { weightRange: "7,001 ขึ้นไป", taxRate: 1800, reducedTaxRate: 360 }
];

export default function EVTaxCalculator() {

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full mb-4"
              variants={itemVariants}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaCalculator className="text-2xl text-white" />
            </motion.div>
            <motion.h1
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4"
              variants={itemVariants}
            >
              คำนวณภาษีรถยนต์ไฟฟ้า EV
            </motion.h1>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
              variants={itemVariants}
            >
              คำนวณภาษีรถยนต์ไฟฟ้าตามน้ำหนักรถและจำนวนที่นั่ง พร้อมส่วนลด 80%
            </motion.p>
          </motion.div>


          {/* Tax Rate Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7 Seats Table */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <FaCar className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg font-bold">
                    รถยนต์นั่งส่วนบุคคล ไม่เกิน 7 คน
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300">น้ำหนัก (กก.)</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300">อัตราภาษี (บาท)</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-green-600 dark:text-green-400">หลังลด 80% (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {EV_TAX_RATES_7_SEATS.map((rate, index) => (
                      <motion.tr
                        key={index}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium text-sm">{rate.weightRange}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white text-sm">
                          {rate.taxRate.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold text-sm">
                          {rate.reducedTaxRate.toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Over 7 Seats Table */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <FaCar className="text-white text-sm" />
                  </div>
                  <h3 className="text-lg font-bold">
                    รถยนต์นั่งส่วนบุคคล เกิน 7 คน
                  </h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300">น้ำหนัก (กก.)</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300">อัตราภาษี (บาท)</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-green-600 dark:text-green-400">หลังลด 80% (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {EV_TAX_RATES_OVER_7_SEATS.map((rate, index) => (
                      <motion.tr
                        key={index}
                        className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium text-sm">{rate.weightRange}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white text-sm">
                          {rate.taxRate.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-bold text-sm">
                          {rate.reducedTaxRate.toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
