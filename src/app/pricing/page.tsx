
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCar, faPlus, faSearch, faFilter, faTh, faList, faTrash } from '@fortawesome/free-solid-svg-icons';
import AnimatedPage from '../components/AnimatedPage';
import Modal from '../components/Modal';
import CategoryForm from '../components/CategoryForm';
import ServiceForm from '../components/ServiceForm';
import FilterDropdown from '../components/FilterDropdown';
import PricingCard from '../components/PricingCard';
import PricingListItem from '../components/PricingListItem';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [requireTyping, setRequireTyping] = useState(false);
  const [expectedText, setExpectedText] = useState('');

  // ใช้ custom hook สำหรับข้อมูล MongoDB
  const { rawData, error, isLoading, refreshData, addService, updateService, deleteService } = useServiceData();
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
  const handleCategorySuccess = async (categoryData: Record<string, unknown>) => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    
    try {
      if (editingCategory) {
        // แก้ไขข้อมูล
        const success = await updateCategory(editingCategory._id, categoryData);
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
    setViewMode('grid');
  };


  // ฟังก์ชันกรองข้อมูล
  const filteredData = useMemo(() => {
    return displayData.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || item.categoryName === selectedCategory;
      
      const matchesPrice = (priceRange.min === 0 || item.servicePrice >= priceRange.min) &&
                          (priceRange.max === 0 || item.servicePrice <= priceRange.max);
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [displayData, searchTerm, selectedCategory, priceRange]);

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
      groups[item.categoryName].push(item);
    });
    
    return groups;
  }, [filteredData, displayCategories]);

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                ราคางานบริการ
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                จัดการข้อมูลราคาบริการทั้งหมด
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddCategoryClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                เพิ่มหมวดหมู่
              </button>
            </div>
          </div>

          {/* ฟิลเตอร์ */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาบริการ, รายละเอียด, หมวดหมู่..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            <FilterDropdown
              value={selectedCategory}
              onChange={val => setSelectedCategory(val)}
              icon={faCar}
              placeholder="กรองตามหมวดหมู่"
              options={[
                { value: '', label: 'ทุกหมวดหมู่', color: '#6B7280' },
                ...(displayCategories || []).map(category => ({
                  value: category.categoryName,
                  label: category.categoryName,
                  color: '#3B82F6'
                }))
              ]}
            />
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
                placeholder="กรองตามราคา"
                options={[
                  { value: '', label: 'ทุกราคา', color: '#6B7280' },
                  { value: '0-500', label: '0-500 บาท', color: '#10B981' },
                  { value: '500-1000', label: '500-1,000 บาท', color: '#3B82F6' },
                  { value: '1000-2000', label: '1,000-2,000 บาท', color: '#F59E0B' },
                  { value: '2000-5000', label: '2,000-5,000 บาท', color: '#EF4444' },
                  { value: '5000-999999', label: '5,000+ บาท', color: '#8B5CF6' },
                ]}
              />
              <FilterDropdown
                value={viewMode}
                onChange={val => setViewMode(val as 'grid' | 'list')}
                icon={viewMode === 'grid' ? faTh : faList}
                placeholder="โหมดแสดงผล"
                options={[
                  { value: 'grid', label: 'กริด', color: '#3B82F6' },
                  { value: 'list', label: 'รายการ', color: '#10B981' },
                ]}
              />
              <button
                onClick={handleFilterReset}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-medium text-sm"
              >
                รีเซ็ต
              </button>
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
            <div className="space-y-8">
              {Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faCar} className="text-gray-400 text-6xl mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {searchTerm || selectedCategory || priceRange.min > 0 || priceRange.max > 0
                      ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'
                      : 'ยังไม่มีข้อมูลราคาบริการ'
                    }
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-6">
                    {searchTerm || selectedCategory || priceRange.min > 0 || priceRange.max > 0
                      ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือรีเซ็ตตัวกรอง'
                      : 'เริ่มต้นด้วยการเพิ่มข้อมูลราคาบริการใหม่'
                    }
                  </p>
                  {!searchTerm && !selectedCategory && priceRange.min === 0 && priceRange.max === 0 && (
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleAddCategoryClick}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        เพิ่มหมวดหมู่แรก
                      </button>
                      <Link
                        href="/categories"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faCar} />
                        จัดการหมวดหมู่
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                Object.entries(groupedData).map(([categoryName, services]) => (
                  <div key={categoryName} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                          <FontAwesomeIcon icon={faCar} />
                          {categoryName}
                          <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                            {services.length} บริการ
                          </span>
                        </h2>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingService(null);
                              setIsServiceModalOpen(true);
                              setSelectedCategoryForService(categoryName);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-1"
                            title="เพิ่มรายการบริการ"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm">เพิ่ม</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryClick(categoryName)}
                            className="p-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-lg transition-colors flex items-center gap-1"
                            title="ลบหมวดหมู่"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`${viewMode === 'grid' ? 'p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'p-4 space-y-2'}`}>
                      {services.map((service) => (
                        viewMode === 'grid' ? (
            <PricingCard
              key={service._id}
              data={service}
              onEdit={handleEditServiceClick}
              onDelete={handleDeleteServiceClick}
              onDeleteConfirm={(id, name) => {
                showConfirmModal(
                  'ยืนยันการลบบริการ',
                  `คุณแน่ใจหรือไม่ที่จะลบบริการ "${name}"?`,
                  () => handleDeleteServiceClick(id),
                  false,
                  ''
                );
              }}
            />
                        ) : (
                          <PricingListItem
                            key={service._id}
                            data={service}
                            onEdit={handleEditServiceClick}
                            onDelete={handleDeleteServiceClick}
                            onDeleteConfirm={(id, name) => {
                              showConfirmModal(
                                'ยืนยันการลบบริการ',
                                `คุณแน่ใจหรือไม่ที่จะลบบริการ "${name}"?`,
                                () => handleDeleteServiceClick(id),
                                false,
                                ''
                              );
                            }}
                          />
                        )
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors"
            >
              <FontAwesomeIcon icon={faCar} />
              กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Modals */}
        {isCategoryModalOpen && (
          <Modal isOpen={isCategoryModalOpen}>
            <CategoryForm
              data={editingCategory}
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
