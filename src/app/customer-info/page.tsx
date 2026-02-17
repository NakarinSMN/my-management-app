// src/app/customer-info/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useMemo, memo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

// Icons
import {
  faSearch, faCalendarAlt, faClock, faCheckCircle, faExclamationTriangle,
  faTimesCircle, faInfoCircle, faFilter, faStar, faTag, faPlus, faArrowRight
} from '@fortawesome/free-solid-svg-icons';

// Components
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import Modal from '../components/Modal';
import AddCustomerForm from '../components/AddCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm';
import FilterDropdown from '../components/FilterDropdown';
import AdvancedFilterModal, { AdvancedFilters } from '../components/AdvancedFilterModal';
import CustomerCard from '../components/CustomerCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import RippleButton from '../components/RippleButton';
import { ToastContainer } from '../components/Toast';
import CustomerDetailModal from '../components/CustomerDetailModal';

// Hooks & Libs
import { useToast } from '../hooks/useToast';
import { useCustomerData, CustomerData } from '@/lib/useCustomerData';
import { useDebounce } from '@/lib/useDebounce';

// Utils
import {
  STATUS_COLOR,
  STATUS_ICON,
  MONTH_OPTIONS,
  STATUS_FILTER_OPTIONS,
  getPageNumbers,
  formatDateFlexible
} from '@/utils/customerHelpers';

export default function CustomerInfoPage() {
  // --- State ---
  const [search, setSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateFrom: '',
    dateTo: '',
    inspectionDateFrom: '',
    inspectionDateTo: '',
    selectedBrands: [],
    selectedVehicleTypes: []
  });

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // --- Hooks ---
  const { data, error, isLoading, refreshData } = useCustomerData();
  const toast = useToast();
  const debouncedSearch = useDebounce(search, 300);

  // --- Helpers ---
  const toggleFavorite = (licensePlate: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      newFavorites.has(licensePlate) ? newFavorites.delete(licensePlate) : newFavorites.add(licensePlate);
      localStorage.setItem('customer-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const resetFilters = () => {
    setSearch(''); setFilterMonth(''); setFilterStatus(''); setCurrentPage(1);
  };

  const resetAllFilters = () => {
    resetFilters();
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      inspectionDateFrom: '',
      inspectionDateTo: '',
      selectedBrands: [],
      selectedVehicleTypes: []
    });
  };

  // --- Data Processing ---
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(
      data.map(item => item.brand || '').filter(b => b !== '')
    )).sort();
  }, [data]);
  const uniqueVehicleTypes = useMemo(() => {
    return Array.from(new Set(
      data.map(item => item.vehicleType || '').filter(t => t !== '')
    )).sort();
  }, [data]);

  const filteredData: CustomerData[] = useMemo(() => {
    return data.filter(item => {
      const dateStr = formatDateFlexible(item.registerDate);
      const [dd, mm, yyyy] = dateStr.split('/');
      if (!dd || !mm || !yyyy) return false;

      const searchLower = debouncedSearch.toLowerCase();
      const sequenceStr = item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : '';

      const matchSearch = !debouncedSearch ||
        item.licensePlate.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.phone.includes(debouncedSearch) ||
        sequenceStr.includes(debouncedSearch);

      const matchMonth = !filterMonth || mm === filterMonth.padStart(2, '0');
      const matchStatus = !filterStatus || item.status === filterStatus;

      let matchDateRange = true;
      if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        const itemDate = new Date(`${yyyy}-${mm}-${dd}`);
        if (advancedFilters.dateFrom) matchDateRange = matchDateRange && itemDate >= new Date(advancedFilters.dateFrom);
        if (advancedFilters.dateTo) matchDateRange = matchDateRange && itemDate <= new Date(advancedFilters.dateTo);
      }

      let matchInspectionDateRange = true;
      if (advancedFilters.inspectionDateFrom || advancedFilters.inspectionDateTo) {
        if (!item.inspectionDate) {
          matchInspectionDateRange = false;
        } else {
          const inspectDate = new Date(item.inspectionDate);
          if (advancedFilters.inspectionDateFrom) {
            matchInspectionDateRange = matchInspectionDateRange && inspectDate >= new Date(advancedFilters.inspectionDateFrom);
          }
          if (advancedFilters.inspectionDateTo) {
            matchInspectionDateRange = matchInspectionDateRange && inspectDate <= new Date(advancedFilters.inspectionDateTo);
          }
        }
      }

      const matchBrand = advancedFilters.selectedBrands.length === 0 || advancedFilters.selectedBrands.includes(item.brand || '');
      const matchVehicleType = advancedFilters.selectedVehicleTypes.length === 0 || advancedFilters.selectedVehicleTypes.includes(item.vehicleType || '');

      return matchSearch && matchMonth && matchStatus && matchDateRange && matchInspectionDateRange && matchBrand && matchVehicleType;
    });
  }, [data, debouncedSearch, filterMonth, filterStatus, advancedFilters]);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIdx, startIdx + itemsPerPage), [filteredData, itemsPerPage, startIdx]);
  const totalPages = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.dateFrom) count++;
    if (advancedFilters.dateTo) count++;
    if (advancedFilters.inspectionDateFrom) count++;
    if (advancedFilters.inspectionDateTo) count++;
    count += advancedFilters.selectedBrands.length + advancedFilters.selectedVehicleTypes.length;
    return count;
  }, [advancedFilters]);

  // --- Effects ---
  useEffect(() => {
    const savedFavorites = localStorage.getItem('customer-favorites');
    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || isAddModalOpen || isEditModalOpen || isViewModalOpen) return;
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
      else if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage(p => p + 1);
      else if (e.key === 'Home') setCurrentPage(1);
      else if (e.key === 'End') setCurrentPage(totalPages);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, isAddModalOpen, isEditModalOpen, isViewModalOpen]);

  // --- Render ---
  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
          
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                ทะเบียนข้อมูล
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                จัดการข้อมูลลูกค้าและสถานะการต่อภาษี
              </p>
            </div>
            <div className="flex gap-3">
               <Link 
                href="/tax-expiry-next-year" 
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm"
              >
                ภาษีครั้งถัดไป
              </Link>
              <RippleButton 
                onClick={() => setIsAddModalOpen(true)} 
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm text-sm font-semibold flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                เพิ่มข้อมูล
              </RippleButton>
            </div>
          </div>

          {/* Stats Grid - Minimal Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={faInfoCircle} color="gray" title="รายการทั้งหมด" value={filteredData.length} />
            <StatCard icon={faCheckCircle} color="emerald" title="ต่อภาษีแล้ว" value={filteredData.filter(i => i.status === 'ต่อภาษีแล้ว').length} />
            <StatCard icon={faExclamationTriangle} color="amber" title="ใกล้ครบกำหนด" value={filteredData.filter(i => i.status === 'กำลังจะครบกำหนด').length} />
            <StatCard icon={faTimesCircle} color="rose" title="เกินกำหนด" value={filteredData.filter(i => i.status === 'เกินกำหนด').length} />
          </div>

          {/* Filters Bar - Clean Style */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, ทะเบียน, เบอร์โทร..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all placeholder:text-gray-400"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <FilterDropdown value={filterMonth} onChange={val => { setFilterMonth(val); setCurrentPage(1); }} icon={faCalendarAlt} placeholder="เดือน" options={MONTH_OPTIONS} />
                    <FilterDropdown value={filterStatus} onChange={val => { setFilterStatus(val); setCurrentPage(1); }} icon={faClock} placeholder="สถานะ" options={STATUS_FILTER_OPTIONS} />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                 <button onClick={resetAllFilters} className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2">
                    รีเซ็ตตัวกรอง
                 </button>
                 <div className="h-4 w-px bg-gray-200 hidden lg:block"></div>
                <button 
                    onClick={() => setShowAdvancedFilter(true)} 
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${activeFiltersCount > 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  <FontAwesomeIcon icon={faFilter} className="text-xs" />
                  ตัวกรองขั้นสูง
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-white text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><LoadingSkeleton variant="list" count={8} /></div>
          ) : error ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-2xl" />
                </div>
                <p className="text-gray-900 font-medium mb-2">ไม่สามารถโหลดข้อมูลได้</p>
                <p className="text-gray-500 text-sm mb-6">กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
                <RippleButton onClick={refreshData} className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm">ลองใหม่</RippleButton>
            </div>
          ) : (
            <>
              {/* Desktop Table - Minimal */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                        {['ลำดับ', 'ทะเบียนรถ', 'ประเภท', 'ยี่ห้อ', 'ชื่อลูกค้า', 'เบอร์โทร', 'วันที่ชำระล่าสุด', 'วันที่ตรวจ', 'แท็ก', 'สถานะ', ''].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paginatedData.length === 0 ? (
                             <tr>
                                <td colSpan={11} className="px-6 py-12 text-center text-gray-500 text-sm">ไม่พบข้อมูลที่ค้นหา</td>
                             </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                            <CustomerRow
                                key={idx} item={item} rowNumber={startIdx + idx + 1}
                                onView={c => { setSelectedCustomer(c); setIsViewModalOpen(true); }}
                                isFavorite={favorites.has(item.licensePlate)} onToggleFavorite={toggleFavorite}
                            />
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
                
                {/* Footer Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        แสดง {paginatedData.length > 0 ? startIdx + 1 : 0} - {Math.min(startIdx + itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                                disabled={currentPage === 1} 
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="rotate-180 text-xs" />
                            </button>
                            <div className="flex gap-1">
                                {getPageNumbers(currentPage, totalPages).map((page, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                            currentPage === page 
                                            ? 'bg-gray-900 text-white shadow-sm' 
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`} 
                                        disabled={typeof page !== 'number'}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                                disabled={currentPage === totalPages} 
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </button>
                        </div>
                    )}
                </div>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-3">
                {paginatedData.map((item, idx) => (
                  <CustomerCard
                    key={idx} item={item} rowNumber={startIdx + idx + 1}
                    onView={c => { setSelectedCustomer(c); setIsViewModalOpen(true); }}
                    isFavorite={favorites.has(item.licensePlate)} onToggleFavorite={toggleFavorite}
                    statusColor={STATUS_COLOR} statusIcon={STATUS_ICON} formatDate={formatDateFlexible}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen}><AddCustomerForm onSuccess={() => { setIsAddModalOpen(false); setCurrentPage(1); refreshData(); toast.success('เพิ่มข้อมูลเรียบร้อย'); }} onCancel={() => setIsAddModalOpen(false)} /></Modal>
      <Modal isOpen={isEditModalOpen}><EditCustomerForm customerData={selectedCustomer || {} as any} onSuccess={() => { setIsEditModalOpen(false); setSelectedCustomer(null); refreshData(); toast.success('บันทึกการแก้ไขแล้ว'); }} onCancel={() => setIsEditModalOpen(false)} /></Modal>
      <AdvancedFilterModal isOpen={showAdvancedFilter} onClose={() => setShowAdvancedFilter(false)} onApply={f => { setAdvancedFilters(f); setCurrentPage(1); }} brands={uniqueBrands} vehicleTypes={uniqueVehicleTypes} currentFilters={advancedFilters} />
      <CustomerDetailModal isOpen={isViewModalOpen} customer={selectedCustomer} onClose={() => { setIsViewModalOpen(false); setSelectedCustomer(null); }} onEdit={() => { setIsViewModalOpen(false); setIsEditModalOpen(true); }} />
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </AnimatedPage>
  );
}

// --- Minimal Stat Card ---
const StatCard = ({ icon, color, title, value }: any) => {
    // Mapping color names to Tailwind classes for minimal look (pastel backgrounds)
    const colorMap: {[key: string]: string} = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        gray: 'bg-gray-50 text-gray-600 border-gray-100',
    };
    
    const styleClass = colorMap[color] || colorMap['gray'];

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${styleClass.split(' ')[2]} ${styleClass.split(' ')[0]}`}>
                <FontAwesomeIcon icon={icon} className={`text-sm ${styleClass.split(' ')[1]}`} />
            </div>
        </div>
    );
};

// --- Minimal Row ---
const CustomerRow = memo(function CustomerRow({ item, rowNumber, onView, isFavorite, onToggleFavorite }: any) {
  return (
    <tr className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.licensePlate); }} className="text-gray-300 hover:text-amber-400 transition-colors focus:outline-none">
             <FontAwesomeIcon icon={faStar} className={isFavorite ? 'text-amber-400' : ''} />
          </button>
          <span className="text-xs font-mono text-gray-400">#{String(item.sequenceNumber || rowNumber).padStart(6, '0')}</span>
        </div>
      </td>
      <td className="px-6 py-4">
          <span className="text-sm font-semibold text-gray-900 dark:text-white block">{item.licensePlate}</span>
      </td>
      <td className="px-6 py-4">
        {item.vehicleType && <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">{item.vehicleType}</span>}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.brand || '-'}</td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.customerName}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.phone}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{formatDateFlexible(item.registerDate)}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{item.inspectionDate ? formatDateFlexible(item.inspectionDate) : '-'}</td>
      <td className="px-6 py-4">
        <div className="flex gap-1 flex-wrap max-w-[120px]">
          {item.tags?.slice(0, 2).map((tag: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded border border-gray-100 text-[10px] whitespace-nowrap">{tag}</span>
          ))}
          {item.tags?.length > 2 && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded">+{item.tags.length - 2}</span>}
        </div>
      </td>
      <td className="px-6 py-4">
         {/* Custom Minimal Status Badge */}
         <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            item.status === 'ต่อภาษีแล้ว' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            item.status === 'กำลังจะครบกำหนด' ? 'bg-amber-50 text-amber-700 border-amber-100' :
            item.status === 'เกินกำหนด' ? 'bg-rose-50 text-rose-700 border-rose-100' :
            'bg-gray-50 text-gray-700 border-gray-200'
         }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
                item.status === 'ต่อภาษีแล้ว' ? 'bg-emerald-500' :
                item.status === 'กำลังจะครบกำหนด' ? 'bg-amber-500' :
                item.status === 'เกินกำหนด' ? 'bg-rose-500' : 'bg-gray-400'
            }`}></div>
            {item.status}
         </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button onClick={() => onView(item)} className="text-gray-400 hover:text-gray-900 transition-colors p-2">
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
        </button>
      </td>
    </tr>
  );
});