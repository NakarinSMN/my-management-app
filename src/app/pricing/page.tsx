// src/app/pricing/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { JSX } from 'react/jsx-runtime';

import {
  FaPlus, FaSpinner, FaExclamationTriangle, FaCar, FaPencilAlt
} from 'react-icons/fa';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
// ถ้า Card component ของคุณไม่ได้ถูกใช้แล้วจริงๆ ก็สามารถลบ import นี้ได้
// import { Card } from '../components/ui/Card'; 

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

// กำหนด Interface สำหรับข้อมูลดิบที่มาจาก Google Sheet
interface RawServiceData {
  categoryName: string;
  categoryDescription: string;
  serviceName: string;
  servicePrice: string | number; // สามารถเป็น string ได้ถ้าเป็น "ขึ้นอยู่กับกรณี" หรือ number
  serviceDetails: string;
  rowIndex: number;
}

// กำหนด Interface สำหรับโครงสร้างข้อมูลบริการ (หลังจากจัดรูปแบบ)
interface Service {
  serviceName: string;
  servicePrice: string | number;
  serviceDetails: string;
  rowIndex: number;
  categoryName: string;
  categoryDescription: string;
}

// กำหนด Interface สำหรับโครงสร้างข้อมูลหมวดหมู่บริการ (หลังจากจัดรูปแบบ)
interface ServiceCategory {
  name: string;
  description: string;
  services: Service[];
}

const getCategoryIcon = (): JSX.Element => {
  return <FaCar className="inline mr-2" />;
};

const formatPrice = (price: string | number | null | undefined): string | number | null | undefined => {
  if (price === null || price === undefined || (typeof price === 'string' && isNaN(parseFloat(price)))) {
    return price;
  }
  const numericPrice = parseFloat(price as string);
  return numericPrice.toLocaleString('en-US');
};

export default function PricingPage() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: RawServiceData[] = await response.json();

      const formattedData: ServiceCategory[] = data.reduce((acc: ServiceCategory[], current: RawServiceData) => {
        let category = acc.find(cat => cat.name === current.categoryName);
        if (!category) {
          category = { name: current.categoryName, description: current.categoryDescription, services: [] };
          acc.push(category);
        }
        if (current.serviceName && current.servicePrice) {
          const newService: Service = {
            serviceName: current.serviceName,
            servicePrice: current.servicePrice,
            serviceDetails: current.serviceDetails,
            rowIndex: current.rowIndex,
            categoryName: current.categoryName,
            categoryDescription: current.categoryDescription
          };
          category.services.push(newService);
        }
        return acc;
      }, []);
      
      setServiceCategories(formattedData);
    } catch (e: unknown) {
      console.error("Failed to fetch pricing data:", e);
      if (e instanceof Error) {
        setError("ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้: " + e.message);
      } else {
        setError("ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingService(null);
    fetchData();
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };
  
  const handleAddClick = () => {
    setEditingService(null);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingService(null);
  }

  return (
    <>
      <AnimatedPage>
        <main className="flex flex-col gap-8 items-center text-center w-full">
          <div className="w-full flex justify-center items-center relative max-w-3xl">
            <motion.h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white" variants={itemVariants}>
              ราคางานบริการ
            </motion.h1>
            <motion.button onClick={handleAddClick} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200" aria-label="เพิ่มบริการใหม่" variants={itemVariants} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.95 }}>
              <FaPlus size={20} />
            </motion.button>
          </div>
          
          {isLoading && <div className="flex items-center justify-center text-lg mt-8 gap-3"><FaSpinner className="animate-spin" /> กำลังโหลดข้อมูล...</div>}
          {error && <div className="flex items-center justify-center text-lg mt-8 text-red-500 gap-3"><FaExclamationTriangle /> {error}</div>}

          {!isLoading && !error && (
            // Grid Container: items-stretch ทำให้ motion.div มีความสูงเท่ากัน
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 items-stretch">
              {serviceCategories.map((category: ServiceCategory, catIndex: number) => (
                // motion.div เป็น container หลักของการ์ด กำหนดความสูงคงที่และ flex
                <motion.div 
                  key={catIndex} 
                  variants={itemVariants} 
                  className="h-[450px] flex flex-col rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden" // เปลี่ยน overflow-y-auto เป็น overflow-hidden
                >
                  {/* ส่วนหัวของการ์ด: Fixed ไม่ไหลตามการ scroll */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 sticky top-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {getCategoryIcon()} {category.name}
                    </h3>
                  </div>
                  {/* ส่วนรายละเอียด (description) ของการ์ด: ยังคงอยู่กับที่ */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 px-4 py-2"> {/* ปรับ padding */}
                      {category.description}
                  </p>

                  {/* Container สำหรับเนื้อหาที่สามารถ Scroll ได้ */}
                  {/* flex-grow เพื่อให้ใช้พื้นที่ที่เหลือทั้งหมด และ overflow-y-auto เพื่อให้ scroll ได้ */}
                  <div className="flex-grow overflow-y-auto custom-scrollable-area px-4"> {/* เพิ่ม class และ padding-x ที่นี่ */}
                    <ul className="space-y-3 pb-4"> {/* ลบ p-4 pt-0 และเพิ่ม pb-4 */}
                      {category.services.map((service: Service, svcIndex: number) => (
                        <li key={svcIndex} className="relative group flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 last:pb-0 pr-8"> {/* pr-8 ยังคงอยู่ */}
                          <div className="flex items-start text-left gap-2">
                            <FaCar className="text-blue-500 mt-1 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800 dark:text-gray-200">{service.serviceName}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{service.serviceDetails}</span>
                            </div>
                          </div>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg ml-4 flex-shrink-0">
                            {formatPrice(service.servicePrice)} บาท
                          </span>
                          <button onClick={() => handleEditClick(service)} className="absolute right-0 top-0 text-gray-400 hover:text-yellow-500 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                <FaPencilAlt />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div> {/* ปิด div สำหรับเนื้อหาที่ Scroll ได้ */}
                </motion.div>
              ))}
            </div>
          )}

          <motion.div variants={itemVariants} className="mt-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <FaCar /> กลับหน้าหลัก
            </Link>
          </motion.div>
        </main>
      </AnimatedPage>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ServiceForm onSuccess={handleSuccess} onCancel={handleCloseModal} initialData={editingService} />
      </Modal>
    </>
  );
}
