"use client";

import React, { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaCar, FaPencilAlt, FaPlus, FaSearch } from 'react-icons/fa';
import AnimatedPage from '../components/AnimatedPage';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';
import EditCategoryForm from '../components/EditCategoryForm';
import useSWR from 'swr';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

interface RawServiceData {
  categoryName: string;
  categoryDescription: string;
  serviceName: string;
  servicePrice: string | number;
  serviceDetails: string;
  rowIndex: number;
}

export type Service = {
  serviceName: string;
  servicePrice: string | number;
  serviceDetails: string;
  rowIndex: number;
  categoryName: string;
  categoryDescription: string;
};

export type ServiceCategory = {
  name: string;
  description: string;
  services: Service[];
};

const formatPrice = (price: string | number | null | undefined): string | number | null | undefined => {
  if (price === null || price === undefined || (typeof price === 'string' && isNaN(parseFloat(price)))) {
    return price;
  }
  const numericPrice = parseFloat(price as string);
  return numericPrice.toLocaleString('en-US');
};

const ServiceRow = memo(function ServiceRow({ service }: { service: Service }) {
  return (
    <tr className="bg-white border-b border-gray-400 dark:bg-gray-900  dark:border-gray-800 hover:bg-blue-50/60 dark:hover:bg-blue-900/40 transition-colors">
      <td className="px-4 py-2 text-sm md:text-base text-gray-900 dark:text-white font-medium">{service.serviceName}</td>
      <td className="px-4 py-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">{service.serviceDetails}</td>
      <td className="px-4 py-2 text-sm md:text-base text-blue-700 dark:text-blue-300 font-bold whitespace-nowrap">{formatPrice(service.servicePrice)}</td>
    </tr>
  );
});

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PricingPage() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // (ลบ editingService และ handleEditClick เพราะไม่ได้ใช้)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: swrData, error: swrError, isLoading: swrIsLoading, mutate } = useSWR(GOOGLE_SCRIPT_URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    // (ลบ editingService และ handleEditClick เพราะไม่ได้ใช้)
    mutate();
  };

  // (ลบ handleEditClick เพราะไม่ได้ใช้)
  const handleAddClick = () => {
    // (ลบ editingService และ handleEditClick เพราะไม่ได้ใช้)
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // (ลบ editingService และ handleEditClick เพราะไม่ได้ใช้)
  };

  const handleEditCategoryClick = (category: ServiceCategory) => {
    setEditingCategory(category);
    setIsEditCategoryOpen(true);
  };
  const handleEditCategoryClose = () => {
    setEditingCategory(null);
    setIsEditCategoryOpen(false);
  };
  const handleEditCategorySuccess = () => {
    setEditingCategory(null);
    setIsEditCategoryOpen(false);
    mutate();
  };

  useEffect(() => {
    if (swrData) {
      const formattedData: ServiceCategory[] = swrData.reduce((acc: ServiceCategory[], current: RawServiceData) => {
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
      setError(null);
    } else if (swrError) {
      setError('ไม่สามารถโหลดข้อมูลราคาได้ในขณะนี้: ' + swrError.message);
    }
  }, [swrData, swrError]);

  // สร้าง array ของหมวดหมู่ที่มีอยู่แล้ว (name, description)
  const categoryOptions = serviceCategories.map(cat => ({ name: cat.name, description: cat.description }));

  // ฟังก์ชันกรองข้อมูลตามคำค้นหา
  const filteredCategories = useMemo(() => serviceCategories.map(category => ({
    ...category,
    services: category.services.filter(service =>
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.services.length > 0), [serviceCategories, searchTerm]);

  return (
    <AnimatedPage>
      <main className="flex flex-col gap-8 items-center text-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="w-full max-w-4xl mx-auto text-center mb-8 relative">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 md:mb-4 leading-tight">ราคางานบริการ</h1>
          <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-2">เลือกบริการที่เหมาะกับคุณ</p>
          <button
            onClick={handleAddClick}
            className="absolute right-0 top-0 px-4 py-1.5 md:px-5 md:py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 text-sm md:text-base"
          >
            <FaPlus className="h-4 w-4 md:h-5 md:w-5" />
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>

        {/* ช่องค้นหา */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="ค้นหาบริการ, รายละเอียด หรือหมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {swrIsLoading && (
          <div className="flex items-center justify-center text-base md:text-lg mt-8 gap-3 w-full">
            <div className="w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 mb-4">
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/4"></div>
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/2"></div>
                  <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <div className="flex items-center justify-center text-base md:text-lg mt-8 text-red-500 gap-3"><FaExclamationTriangle /> {error}</div>}
        {!swrIsLoading && !error && (
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">
            {filteredCategories.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {searchTerm ? `ไม่พบบริการที่ตรงกับคำค้นหา "${searchTerm}"` : 'ไม่มีบริการในขณะนี้'}
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <section key={cat.name} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FaCar className="text-blue-500 text-lg md:text-xl" />
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">{cat.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">{cat.description}</span>
                      <button
                        onClick={() => handleEditCategoryClick(cat)}
                        className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-200 transition-colors flex items-center justify-center z-10"
                        title="แก้ไขหมวดหมู่นี้"
                        aria-label="แก้ไขหมวดหมู่นี้"
                      >
                        <FaPencilAlt size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr className="bg-blue-50 dark:bg-blue-900/30">
                          <th className="px-4 py-2 text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 rounded-tl-lg">ชื่อบริการ</th>
                          <th className="px-4 py-2 text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200">รายละเอียด</th>
                          <th className="px-4 py-2 text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 rounded-tr-lg">ราคา (บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.services.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center text-gray-400 dark:text-gray-500 py-4">ไม่มีบริการในหมวดหมู่นี้</td>
                          </tr>
                        ) : (
                          cat.services.map((service, i) => (
                            <ServiceRow key={service.rowIndex || i} service={service} />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link href="/" className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors text-sm md:text-base">
            <FaCar className="inline mr-2" /> กลับหน้าหลัก
          </Link>
        </div>
      </main>
      {isModalOpen && (
        <Modal isOpen={isModalOpen}>
          <ServiceForm onSuccess={handleSuccess} onCancel={handleCloseModal} categoryOptions={categoryOptions} />
        </Modal>
      )}
      {isEditCategoryOpen && editingCategory && (
        <Modal isOpen={isEditCategoryOpen}>
          <EditCategoryForm
            category={editingCategory}
            onSuccess={handleEditCategorySuccess}
            onCancel={handleEditCategoryClose}
          />
        </Modal>
      )}
    </AnimatedPage>
  );
}
