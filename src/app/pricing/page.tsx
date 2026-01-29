
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCar, faPlus, faSearch, faFilter, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import AnimatedPage from '../components/AnimatedPage';
import Modal from '../components/Modal';
import CategoryForm from '../components/CategoryForm';
import ServiceForm from '../components/ServiceForm';
import FilterDropdown from '../components/FilterDropdown';
import ConfirmModal from '../components/ConfirmModal';
import { useServiceData, ServiceData } from '@/lib/useServiceData';
import { useCategoryData } from '@/lib/useCategoryData';
import { useNotification } from '../contexts/NotificationContext';



export default function PricingPage() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Record<string, unknown> | null>(null);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [selectedCategoryForService, setSelectedCategoryForService] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  
  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [requireTyping, setRequireTyping] = useState(false);
  const [expectedText, setExpectedText] = useState('');

  // ใช้ custom hook สำหรับข้อมูล MongoDB (รองรับ filter + pagination)
  const {
    rawData,
    error,
    isLoading,
    refreshData,
    addService,
    updateService,
    deleteService,
    total,
    page,
    pageSize,
    setPage,
  } = useServiceData({
    searchTerm,
    category: selectedCategory,
    minPrice: priceRange.min || undefined,
    maxPrice: priceRange.max || undefined,
    pageSize: 100,
  });
  const { data: categories, addCategory, updateCategory, deleteCategory, refreshData: refreshCategories } = useCategoryData();
  const { showSuccess, showError } = useNotification();

  // ฟังก์ชันสำหรับแสดง confirmation modal
  const showConfirmModal = (title: string, message: string, action: () => void, requireTypingFlag: boolean = false, expectedTextValue: string = '') => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setRequireTyping(requireTypingFlag);
    setExpectedText(expectedTextValue);
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    if (confirmAction) {
      setIsConfirmLoading(true);
      try {
        await confirmAction();
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
      } catch (error) {
        console.error('Error in confirm action:', error);
      } finally {
        setIsConfirmLoading(false);
      }
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
    setIsConfirmLoading(false);
  };

  // ข้อมูลตัวอย่างสำหรับทดสอบ
  const sampleData = [
    {
      _id: 'sample-1',
      categoryName: 'รถยนต์',
      categoryDescription: 'บริการรถยนต์',
      serviceName: 'ล้างรถ',
      servicePrice: 100,
      serviceDetails: 'ล้างรถยนต์',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'sample-2',
      categoryName: 'รถยนต์',
      categoryDescription: 'บริการรถยนต์',
      serviceName: 'เปลี่ยนน้ำมัน',
      servicePrice: 500,
      serviceDetails: 'เปลี่ยนน้ำมันเครื่องยนต์',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // ข้อมูลหมวดหมู่ตัวอย่าง
  const sampleCategories = [
    {
      _id: 'cat-1',
      categoryName: 'รถยนต์',
      categoryDescription: 'บริการรถยนต์',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat-2',
      categoryName: 'รถจักรยานยนต์',
      categoryDescription: 'บริการรถจักรยานยนต์',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // ใช้ข้อมูลตัวอย่างถ้าไม่มีข้อมูลจริง
  const displayData = rawData.length > 0 ? rawData : sampleData;
  const displayCategories = categories.length > 0 ? categories : sampleCategories;



  // จัดการหมวดหมู่
  const handleCategorySuccess = async (categoryData: { _id?: string; categoryName: string; categoryDescription: string }) => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    
    try {
      if (editingCategory) {
        // แก้ไขข้อมูล
        const success = await updateCategory(editingCategory._id as string, categoryData);
        if (success) {
          console.log('✅ Category updated successfully');
          showSuccess('แก้ไขหมวดหมู่สำเร็จ', `หมวดหมู่ "${categoryData.categoryName}" ถูกแก้ไขเรียบร้อยแล้ว`);
          await refreshCategories(); // รีเฟรชข้อมูลหมวดหมู่
        } else {
          console.error('❌ Failed to update category');
          showError('แก้ไขหมวดหมู่ไม่สำเร็จ', 'ไม่สามารถแก้ไขหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
        }
      } else {
        // เพิ่มข้อมูลใหม่
        const success = await addCategory(categoryData);
        if (success) {
          console.log('✅ Category added successfully');
          showSuccess('เพิ่มหมวดหมู่สำเร็จ', `หมวดหมู่ "${categoryData.categoryName}" ถูกเพิ่มเรียบร้อยแล้ว`);
          await refreshCategories(); // รีเฟรชข้อมูลหมวดหมู่
          // รีเฟรชข้อมูลบริการด้วยเพื่อให้หมวดหมู่ใหม่ปรากฏ
          await refreshData();
        } else {
          console.error('❌ Failed to add category');
          showError('เพิ่มหมวดหมู่ไม่สำเร็จ', 'ไม่สามารถเพิ่มหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
        }
      }
    } catch (error) {
      console.error('❌ Error handling category:', error);
      showError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการจัดการหมวดหมู่');
    }
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };


  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // จัดการรายการบริการ
  const handleServiceSuccess = async (serviceData: Partial<ServiceData>) => {
    setIsServiceModalOpen(false);
    setEditingService(null);
    setSelectedCategoryForService('');
    
    try {
      if (editingService) {
        // แก้ไขข้อมูล
        const success = await updateService(editingService._id, serviceData);
        if (success) {
          console.log('✅ Service updated successfully');
          showSuccess('แก้ไขรายการบริการสำเร็จ', `รายการ "${serviceData.serviceName}" ถูกแก้ไขเรียบร้อยแล้ว`);
        } else {
          console.error('❌ Failed to update service');
          showError('แก้ไขรายการบริการไม่สำเร็จ', 'ไม่สามารถแก้ไขรายการบริการได้ กรุณาลองใหม่อีกครั้ง');
        }
      } else {
        // เพิ่มข้อมูลใหม่
        const success = await addService(serviceData);
        if (success) {
          console.log('✅ Service added successfully');
          showSuccess('เพิ่มรายการบริการสำเร็จ', `รายการ "${serviceData.serviceName}" ถูกเพิ่มเรียบร้อยแล้ว`);
        } else {
          console.error('❌ Failed to add service');
          showError('เพิ่มรายการบริการไม่สำเร็จ', 'ไม่สามารถเพิ่มรายการบริการได้ กรุณาลองใหม่อีกครั้ง');
        }
      }
    } catch (error) {
      console.error('❌ Error handling service:', error);
      showError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการจัดการรายการบริการ');
    }
  };


  const handleEditServiceClick = (data: ServiceData) => {
    setEditingService(data);
    setSelectedCategoryForService(data.categoryName);
    setIsServiceModalOpen(true);
  };

  const handleDeleteServiceClick = async (id: string) => {
    try {
      const success = await deleteService(id);
      if (success) {
        console.log('✅ Service deleted successfully');
        showSuccess('ลบรายการบริการสำเร็จ', 'รายการบริการถูกลบเรียบร้อยแล้ว');
      } else {
        console.error('❌ Failed to delete service');
        showError('ลบรายการบริการไม่สำเร็จ', 'ไม่สามารถลบรายการบริการได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('❌ Error deleting service:', error);
      showError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบรายการบริการ');
    }
  };

  const handleDeleteCategoryClick = (categoryName: string) => {
    showConfirmModal(
      'ยืนยันการลบหมวดหมู่',
      `คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${categoryName}" และบริการทั้งหมดในหมวดหมู่นี้?\n\nเพื่อความปลอดภัย กรุณาพิมพ์ชื่อหมวดหมู่ "${categoryName}" ย้ำอีกครั้ง`,
      async () => {
        try {
          // หา category ID จาก categories array
          const category = categories.find(cat => cat.categoryName === categoryName);
          if (!category) {
            showError('ไม่พบหมวดหมู่', 'ไม่พบหมวดหมู่ที่ต้องการลบ');
            return;
          }

          // ลบหมวดหมู่ (API จะลบบริการทั้งหมดในหมวดหมู่นี้ด้วย)
          const success = await deleteCategory(category._id, categoryName);
          if (success) {
            console.log('✅ Category deleted successfully');
            showSuccess('ลบหมวดหมู่สำเร็จ', `หมวดหมู่ "${categoryName}" และบริการทั้งหมดถูกลบเรียบร้อยแล้ว`);
          } else {
            console.error('❌ Failed to delete category');
            showError('ลบหมวดหมู่ไม่สำเร็จ', 'ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
          }
        } catch (error) {
          console.error('❌ Error deleting category:', error);
          showError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
        }
      },
      true, // requireTyping = true
      categoryName // expectedText = categoryName
    );
  };

  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setEditingService(null);
    setSelectedCategoryForService('');
  };

  const handleFilterReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 0 });
  };


  // ฟังก์ชันกรองข้อมูล
  // ฟังก์ชันกรองข้อมูล (ตอนนี้ข้อมูลถูกกรองจาก API แล้ว การกรองฝั่ง client จะทำบนชุดข้อมูลที่ดึงมาในหน้านั้น ๆ เท่านั้น)
  const filteredData = useMemo(() => {
    return displayData;
  }, [displayData]);

  // จัดกลุ่มข้อมูลตามหมวดหมู่
  const groupedData = useMemo(() => {
    const groups: { [key: string]: ServiceData[] } = {};
    
    // เพิ่มหมวดหมู่ทั้งหมด (แม้ไม่มีบริการ)
    displayCategories.forEach(category => {
      if (!groups[category.categoryName]) {
        groups[category.categoryName] = [];
      }
    });
    
    // เพิ่มบริการที่กรองแล้ว
    filteredData.forEach(item => {
      if (!groups[item.categoryName]) {
        groups[item.categoryName] = [];
      }
      // แปลงข้อมูลให้ตรงกับ ServiceData interface
      const serviceData: ServiceData = {
        ...item,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : (item.createdAt instanceof Date ? item.createdAt.toISOString() : new Date().toISOString()),
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : (item.updatedAt instanceof Date ? item.updatedAt.toISOString() : new Date().toISOString())
      };
      groups[item.categoryName].push(serviceData);
    });
    
    return groups;
  }, [filteredData, displayCategories]);

  return (
    <AnimatedPage>
      <main className="w-full max-w-screen-2xl mx-auto bg-gray-50 dark:bg-gray-900 py-0 min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                ราคางานบริการ
              </h1>
            </div>
            <button
              onClick={handleAddCategoryClick}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {/* ฟิลเตอร์ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 mb-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2">
              {/* Search - เต็มแถวในมือถือ */}
              <div className="relative sm:col-span-2 lg:col-span-5">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="ค้นหาบริการ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
              </div>
              
              {/* Category Filter */}
              <div className="lg:col-span-3">
                <FilterDropdown
                  value={selectedCategory}
                  onChange={val => setSelectedCategory(val)}
                  icon={faCar}
                  placeholder="หมวดหมู่"
                  options={[
                    { value: '', label: 'ทุกหมวดหมู่', color: '#6B7280' },
                    ...(displayCategories || []).map(category => ({
                      value: category.categoryName,
                      label: category.categoryName,
                      color: '#3B82F6'
                    }))
                  ]}
                />
              </div>
              
              {/* Price Filter */}
              <div className="lg:col-span-2">
                <FilterDropdown
                  value={priceRange.min === 0 && priceRange.max === 0 ? '' : `${priceRange.min}-${priceRange.max}`}
                  onChange={val => {
                    if (val === '') {
                      setPriceRange({ min: 0, max: 0 });
                    } else {
                      const [min, max] = val.split('-').map(Number);
                      setPriceRange({ min, max });
                    }
                  }}
                  icon={faFilter}
                  placeholder="ช่วงราคา"
                  options={[
                    { value: '', label: 'ทุกราคา', color: '#6B7280' },
                    { value: '0-500', label: '฿0-500', color: '#10B981' },
                    { value: '500-1000', label: '฿500-1K', color: '#3B82F6' },
                    { value: '1000-2000', label: '฿1K-2K', color: '#F59E0B' },
                    { value: '2000-5000', label: '฿2K-5K', color: '#EF4444' },
                    { value: '5000-999999', label: '฿5K+', color: '#8B5CF6' },
                  ]}
                />
              </div>
              
              {/* Reset Button */}
              <div className="sm:col-span-2 lg:col-span-2 flex items-stretch">
                <button
                  onClick={handleFilterReset}
                  className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all duration-200 font-medium text-sm border border-emerald-100 dark:border-emerald-800"
                >
                  รีเซ็ตฟิลเตอร์
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
                <p className="text-red-500 text-lg">{error}</p>
                <button
                  onClick={refreshData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ลองใหม่
                </button>
              </div>
            </div>
          )}

          {/* Data Display */}
          {!isLoading && !error && (
            <div className="space-y-10">
              {Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-24">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                    <FontAwesomeIcon icon={faCar} className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                    {searchTerm || selectedCategory || priceRange.min > 0 || priceRange.max > 0
                      ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'
                      : 'ยังไม่มีข้อมูลราคาบริการ'
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {searchTerm || selectedCategory || priceRange.min > 0 || priceRange.max > 0
                      ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือรีเซ็ตตัวกรอง'
                      : 'เริ่มต้นด้วยการเพิ่มข้อมูลราคาบริการใหม่'
                    }
                  </p>
                  {!searchTerm && !selectedCategory && priceRange.min === 0 && priceRange.max === 0 && (
                    <button
                      onClick={handleAddCategoryClick}
                      className="px-6 py-2.5 bg-emerald-400 text-white rounded-2xl font-semibold hover:bg-emerald-500 transition-colors duration-200 inline-flex items-center gap-2 text-sm shadow-md"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      เพิ่มหมวดหมู่แรก
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(groupedData)
                  .filter(([, services]) => services.length > 0) // ซ่อนหมวดหมู่ที่ไม่มีรายการหลังกรอง
                  .map(([categoryName, services]) => (
                  <div key={categoryName} className="space-y-3">
                    {/* Category Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-gray-900 dark:text-white">
                            {categoryName}
                          </h2>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({services.length})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingService(null);
                              setIsServiceModalOpen(true);
                              setSelectedCategoryForService(categoryName);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                            เพิ่มบริการ
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryClick(categoryName)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-lg"
                            title="ลบหมวดหมู่"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Services Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">ชื่อบริการ</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">รายละเอียด</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">ราคา</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {services.map((service) => (
                            <tr key={service._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-left">
                                {service.serviceName}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-left">
                                {service.serviceDetails || '-'}
                              </td>
                              <td className="px-4 py-3 text-left">
                                <span className="text-lg font-bold text-emerald-500 dark:text-emerald-400">
                                  ฿{service.servicePrice.toLocaleString('th-TH')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditServiceClick(service)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                    title="แก้ไข"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      showConfirmModal(
                                        'ยืนยันการลบบริการ',
                                        `คุณแน่ใจหรือไม่ที่จะลบบริการ "${service.serviceName}"?`,
                                        () => handleDeleteServiceClick(service._id),
                                        false,
                                        ''
                                      );
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    title="ลบ"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    แสดง{' '}
                    {total === 0
                      ? 0
                      : (page - 1) * pageSize + 1}{' '}
                    -{' '}
                    {Math.min(page * pageSize, total)} จาก {total.toLocaleString('th-TH')} รายการ
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(page - 1, 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      ก่อนหน้า
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      หน้า {page} / {Math.ceil(total / pageSize) || 1}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * pageSize >= total}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors"
            >
              ← กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Modals */}
        {isCategoryModalOpen && (
          <Modal isOpen={isCategoryModalOpen}>
            <CategoryForm
              data={editingCategory as { _id?: string; categoryName: string; categoryDescription: string } | null}
              onSuccess={handleCategorySuccess}
              onCancel={handleCloseCategoryModal}
              isEdit={!!editingCategory}
            />
          </Modal>
        )}

        {isServiceModalOpen && (
          <Modal isOpen={isServiceModalOpen}>
            <ServiceForm
              data={editingService}
              categoryName={selectedCategoryForService}
              onSuccess={handleServiceSuccess}
              onCancel={handleCloseServiceModal}
              isEdit={!!editingService}
            />
          </Modal>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={handleCancelConfirm}
          onConfirm={handleConfirm}
          title={confirmTitle}
          message={confirmMessage}
          confirmText="ลบ"
          cancelText="ยกเลิก"
          type="danger"
          isLoading={isConfirmLoading}
          requireTyping={requireTyping}
          typingPrompt="กรุณาพิมพ์ชื่อหมวดหมู่เพื่อยืนยันการลบ"
          expectedText={expectedText}
        />
      </main>
    </AnimatedPage>
  );
}
