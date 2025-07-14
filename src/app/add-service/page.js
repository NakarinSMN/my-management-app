// PricingPage.js (Updated)
"use client";

import React, { useState, useEffect, useMemo, memo } from 'react'; // เพิ่ม useCallback
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa'; // Import ไอคอน

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import { Card } from '../components/ui/Card';
import Modal from '../components/Modal'; // Import Modal
import AddServiceForm from '../components/AddServiceForm'; // Import Form
import useSWR from 'swr';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function PricingPage() {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State สำหรับเปิด/ปิด Modal

  const { data: swrData, error: swrError, mutate } = useSWR(GOOGLE_SCRIPT_URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (swrData) {
      const formattedData = swrData.reduce((acc, current) => {
        let category = acc.find(cat => cat.name === current.categoryName);
        if (!category) {
          category = { name: current.categoryName, description: current.categoryDescription, services: [] };
          acc.push(category);
        }
        category.services.push({ name: current.serviceName, price: current.servicePrice, details: current.serviceDetails });
        return acc;
      }, []);
      setServiceCategories(formattedData);
      setError(null);
    } else if (swrError) {
      setError('ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้: ' + swrError.message);
    }
    setIsLoading(false);
  }, [swrData, swrError]);

  // *** ฟังก์ชันที่จะถูกเรียกเมื่อเพิ่มข้อมูลสำเร็จ ***
  const handleDataAdded = () => {
    setIsModalOpen(false); // ปิด Modal
    mutate(); // โหลดข้อมูลใหม่
  };

  const filteredCategories = useMemo(() => serviceCategories, [serviceCategories]);

  return (
    <> {/* ใช้ Fragment ครอบทั้งหมด */}
      <AnimatedPage>
        <main className="flex flex-col gap-8 items-center text-center w-full">
          {/* Header Section */}
          <div className="w-full flex justify-center items-center relative">
            <motion.h1
              className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              ราคางานบริการของเรา
            </motion.h1>

            {/* ปุ่ม Icon สำหรับเปิด Modal  */}
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              aria-label="เพิ่มบริการใหม่"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaPlus size={20} />
            </motion.button>
          </div>
          
          <motion.p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl" variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }}>
            เรามุ่งมั่นให้บริการตรวจสภาพรถและอำนวยความสะดวกในการต่อภาษีอย่างรวดเร็ว โปร่งใส และเป็นธรรม
          </motion.p>
          
          {/* เนื้อหาหลัก (เหมือนเดิม) */}
          {isLoading && (
            <div className="w-full mt-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 mb-4">
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/4"></div>
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/2"></div>
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-lg mt-8 text-red-500">{error}</p>}
          {!isLoading && !error && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {filteredCategories.map((category, catIndex) => (
                <motion.div key={catIndex} variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }}>
                  <Card title={category.name} className="h-full flex flex-col">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow">{category.description}</p>
                    <ul className="space-y-3 mt-auto">
                      {category.services.map((service, svcIndex) => (
                        <ServiceRow key={svcIndex} service={service} />
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="mt-8">
            <Link href="/" className="inline-block px-8 py-4 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              กลับหน้าหลัก
            </Link>
          </motion.div>
        </main>
      </AnimatedPage>
      
      {/* *** ส่วนที่เรียกใช้ Modal *** */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <AddServiceForm
          onSuccess={handleDataAdded}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}

const ServiceRow = memo(function ServiceRow({ service }) {
  return (
    <li className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 last:pb-0">
      <div className="flex flex-col items-start">
        <span className="font-medium text-gray-800 dark:text-gray-200">{service.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{service.details}</span>
      </div>
      <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg ml-4">{service.price}</span>
    </li>
  );
});