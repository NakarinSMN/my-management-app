// src/app/tax-expiry-next-year/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

import {
  faSearch, faCalendarAlt, faClock, faCheckCircle, faExclamationTriangle,
  faTimesCircle, faChevronLeft, faChevronRight, faInfoCircle,
  faBell, faCheck, faTrash, faSync, faFilter, faArrowRight, faPlus, faTimes
} from '@fortawesome/free-solid-svg-icons';

import { useCustomerData } from '@/lib/useCustomerData';
import { useDebounce } from '@/lib/useDebounce';
import FilterDropdown from '../components/FilterDropdown';
import { useDialog } from '../contexts/DialogContext';
import AdvancedFilterModal, { AdvancedFilters } from '../components/AdvancedFilterModal';
import TaxExpiryCard from '../components/TaxExpiryCard';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';

import {
  MONTH_OPTIONS,
  STATUS_FILTER_OPTIONS,
  STATUS_COLOR,
  STATUS_ICON,
  formatDateFlexible,
  calculateDaysUntilExpiry,
  calculateStatus,
  isValidPhone,
  getPageNumbers
} from '@/utils/customerHelpersNext';

import {
  StatCard,
  NotificationItemCard,
  TaxExpiryRow,
  TaxExpiryData,
  NotificationStatus
} from './components';

export default function TaxExpiryNextYearPage() {
  const [search, setSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [data, setData] = useState<TaxExpiryData[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({});
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string>('');
  const [copiedPhoneIds, setCopiedPhoneIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [dailySnapshotList, setDailySnapshotList] = useState<string[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);
  const [sendingLicensePlates, setSendingLicensePlates] = useState<Set<string>>(new Set());
  const [showSentHistoryModal, setShowSentHistoryModal] = useState<boolean>(false);
  const [isClearingBoard, setIsClearingBoard] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ dateFrom: '', dateTo: '', inspectionDateFrom: '', inspectionDateTo: '', selectedBrands: [], selectedVehicleTypes: [] });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: customerData, error: swrError, isLoading, refreshData } = useCustomerData();
  const { showSuccess, showError, showConfirm } = useDialog();
  const debouncedSearch = useDebounce(search, 300);

  // --- Logic & Effects ---
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tax-expiry-favorites');
    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
  }, []);

  const toggleFavorite = (licensePlate: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      newFavorites.has(licensePlate) ? newFavorites.delete(licensePlate) : newFavorites.add(licensePlate);
      localStorage.setItem('tax-expiry-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const loadNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notification-status');
      const result = await response.json();
      if (result.success && result.data) setNotificationStatus(result.data);
    } catch (error) { console.error(error); }
  };
  useEffect(() => { loadNotificationStatus(); }, []);

  // ✅ เพิ่มฟังก์ชัน: ตรวจสอบและรีเซ็ตสถานะ ถ้ารถต่อภาษีแล้ว
  const checkAndResetRenewedVehicles = useCallback(async (currentData: TaxExpiryData[]) => {
    // หาคันที่ "ต่อภาษีแล้ว" แต่ยังมีประวัติว่า "ส่งแล้ว" (sent: true)
    const renewedButSent = currentData.filter(item =>
      item.status === 'ต่อภาษีแล้ว' && notificationStatus[item.licensePlate]?.sent
    );

    if (renewedButSent.length > 0) {
      console.log(`♻️ Auto-resetting notification for ${renewedButSent.length} renewed vehicles...`);

      // วนลูปเพื่อรีเซ็ต (ลบออกจาก DB และ State)
      for (const item of renewedButSent) {
        try {
          // 1. ลบจาก MongoDB
          await fetch('/api/notification-status', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licensePlate: item.licensePlate })
          });

          // 2. อัปเดต Local State ทันที
          setNotificationStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[item.licensePlate];
            return newStatus;
          });
        } catch (err) {
          console.error(`Failed to auto-reset ${item.licensePlate}`, err);
        }
      }
    }
  }, [notificationStatus]);

  // ✅ Effect: เรียกใช้ฟังก์ชันรีเซ็ตเมื่อข้อมูล data หรือ notificationStatus เปลี่ยนแปลง
  useEffect(() => {
    if (data.length > 0 && Object.keys(notificationStatus).length > 0) {
      checkAndResetRenewedVehicles(data);
    }
  }, [data, notificationStatus, checkAndResetRenewedVehicles]);


  const clearDailyBoard = () => {
    showConfirm('ล้างกระดาน', 'ต้องการล้างกระดานแจ้งเตือนวันนี้ใช่หรือไม่?', async () => {
      setIsClearingBoard(true);
      try {
        await fetch('/api/daily-notifications/delete-all', { method: 'DELETE' });
        setDailySnapshotList([]);
        setCopiedIds(new Set());
        showSuccess('สำเร็จ', 'ล้างกระดานเรียบร้อยแล้ว');
      } catch { showError('ผิดพลาด', 'ไม่สามารถล้างกระดานได้'); }
      finally { setIsClearingBoard(false); }
    });
  };

  const loadDailyNotifications = async () => {
    setIsLoadingDaily(true);
    try {
      const res = await fetch('/api/daily-notifications');
      const json = await res.json();
      if (json.success && json.data) setDailySnapshotList(json.data.licensePlates || []);
      else setDailySnapshotList([]);
    } catch { setDailySnapshotList([]); }
    finally { setIsLoadingDaily(false); }
  };

  const createNewDailyNotifications = () => {
    showConfirm('สร้างรายการใหม่', 'ต้องการสร้างรายการใหม่ 50 คัน?', async () => {
      setIsCreatingNew(true);
      try {
        if (dailySnapshotList.length > 0) await fetch('/api/daily-notifications/delete-all', { method: 'DELETE' });
        await createDailyNotifications(true);
        await loadDailyNotifications();
        showSuccess('สำเร็จ', 'สร้างรายการใหม่แล้ว');
      } catch { showError('ผิดพลาด', 'สร้างรายการไม่สำเร็จ'); }
      finally { setIsCreatingNew(false); }
    });
  };

  const createDailyNotifications = async (force = false) => {
    if (!force && dailySnapshotList.length > 0) return;
    try {
      const urgentItems = data.filter(item => isValidPhone(item.phone) && item.daysUntilExpiry <= 90 && !notificationStatus[item.licensePlate]?.sent).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry).slice(0, 50);
      const licensePlates = urgentItems.map(item => item.licensePlate);
      if (licensePlates.length === 0) { setDailySnapshotList([]); return; }
      const res = await fetch('/api/daily-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlates }) });
      const json = await res.json();
      if (json.success) setDailySnapshotList(licensePlates);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (data.length > 0 && dailySnapshotList.length === 0) loadDailyNotifications();
  }, [data.length]);

  const saveNotificationStatus = useCallback(async (licensePlate: string, sent: boolean, sentAt: string) => {
    const res = await fetch('/api/notification-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlate, sent, sentAt }) });
    const json = await res.json();
    if (json.success) setNotificationStatus(prev => ({ ...prev, [licensePlate]: { sent, sentAt } }));
  }, []);

  const generateNotificationMessage = useCallback((item: TaxExpiryData) => {
    const msgType = item.daysUntilExpiry < 0 ? '🚨 เกินกำหนด! ภาษีรถหมดอายุแล้ว' : item.daysUntilExpiry === 0 ? '🔔 ด่วน! ภาษีรถจะหมดอายุวันนี้' : `🔔 แจ้งเตือน! ภาษีรถจะหมดอายุในอีก ${item.daysUntilExpiry} วัน`;
    return `${msgType}\n\n🚗 ทะเบียน: ${item.licensePlate}\n👤 ชื่อเจ้าของ: ${item.customerName}\n📅 ครบกำหนดชำระ: ${formatDateFlexible(item.expiryDate)}\n\nกรุณารีบต่อภาษีเพื่อเลี่ยงค่าปรับสะสมครับ\n---------------------------------------\n⚠️ หากข้อมูลไม่ถูกต้อง หรือต้องการสอบถามเพิ่มเติม \nสามารถติดต่อเจ้าหน้าที่เพื่อตรวจสอบได้ทันที\n\n📞 โทร: 095-841-0423\n📱 Line: เพิ่มเพื่อนด้วยเบอร์โทรนี้\n📍 ตรอ.บังรีท่าอิฐ ยินดีให้บริการครับ`;
  }, []);

  const copyPhoneToClipboard = useCallback(async (phone: string, licensePlate: string) => {
    await navigator.clipboard.writeText(phone);
    setCopiedPhoneIds(prev => new Set([...prev, licensePlate]));
    setTimeout(() => setCopiedPhoneIds(prev => { const n = new Set(prev); n.delete(licensePlate); return n; }), 2000);
  }, []);

  const copyToClipboard = useCallback(async (item: TaxExpiryData) => {
    const msg = generateNotificationMessage(item);
    await navigator.clipboard.writeText(msg);
    setCopiedId(item.licensePlate);
    setCopiedIds(prev => new Set([...prev, item.licensePlate]));
    setTimeout(() => setCopiedId(''), 2000);
  }, [generateNotificationMessage]);

  const toggleSelection = useCallback((licensePlate: string) => {
    setSelectedItems(prev => { const n = new Set(prev); n.has(licensePlate) ? n.delete(licensePlate) : n.add(licensePlate); return n; });
  }, []);

  const startSelectionMode = () => { setIsSelectionMode(true); setSelectedItems(new Set()); };
  const cancelSelection = () => { setIsSelectionMode(false); setSelectedItems(new Set()); };
  const toggleSelectAll = () => { selectedItems.size === notificationList.length ? setSelectedItems(new Set()) : setSelectedItems(new Set(notificationList.map(i => i.licensePlate))); };

  const deleteMultipleNotifications = async () => {
    if (selectedItems.size === 0) return;
    const arr = Array.from(selectedItems);
    showConfirm('ลบหลายรายการ', `ต้องการลบ ${selectedItems.size} รายการ?`, async () => {
      try {
        await Promise.all(arr.map(lp => fetch('/api/daily-notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlate: lp }) })));
        setDailySnapshotList(prev => prev.filter(p => !selectedItems.has(p)));
        setSelectedItems(new Set()); setIsSelectionMode(false);
        showSuccess('สำเร็จ', 'ลบรายการเรียบร้อย');
      } catch { showError('ผิดพลาด', 'ลบไม่สำเร็จ'); }
    });
  };

  const deleteNotification = useCallback((licensePlate: string) => {
    if (sendingLicensePlates.has(licensePlate)) return;
    showConfirm('ลบรายการ', `ลบ ${licensePlate} ออกจากแจ้งเตือน?`, async () => {
      setSendingLicensePlates(prev => new Set([...prev, licensePlate]));
      try {
        await fetch('/api/daily-notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlate }) });
        setDailySnapshotList(prev => prev.filter(p => p !== licensePlate));
      } catch { showError('ผิดพลาด', 'ลบไม่สำเร็จ'); }
      finally { setSendingLicensePlates(prev => { const n = new Set(prev); n.delete(licensePlate); return n; }); }
    });
  }, [sendingLicensePlates, showConfirm, showError]);

  const resetNotificationStatus = (licensePlate: string) => {
    showConfirm('รีเซ็ตสถานะ', `รีเซ็ตสถานะของ ${licensePlate}?`, async () => {
      try {
        await fetch('/api/notification-status', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlate }) });
        setNotificationStatus(prev => { const n = { ...prev }; delete n[licensePlate]; return n; });
        showSuccess('สำเร็จ', 'รีเซ็ตเรียบร้อย');
      } catch { showError('ผิดพลาด', 'รีเซ็ตไม่สำเร็จ'); }
    });
  };

  const markAsSent = useCallback(async (licensePlate: string) => {
    if (sendingLicensePlates.has(licensePlate) || notificationStatus[licensePlate]?.sent) return;
    try {
      setSendingLicensePlates(prev => new Set([...prev, licensePlate]));
      const sentAt = new Date().toISOString();
      await saveNotificationStatus(licensePlate, true, sentAt);
      await fetch('/api/daily-notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ licensePlate }) });
      setDailySnapshotList(prev => prev.filter(p => p !== licensePlate));
    } catch { showError('ผิดพลาด', 'บันทึกไม่สำเร็จ'); }
    finally { setSendingLicensePlates(prev => { const n = new Set(prev); n.delete(licensePlate); return n; }); }
  }, [sendingLicensePlates, notificationStatus, saveNotificationStatus, showError]);

  const notificationList = useMemo(() => {
    if (dailySnapshotList.length === 0) return [];
    return data.filter(item => isValidPhone(item.phone) && dailySnapshotList.includes(item.licensePlate));
  }, [data, dailySnapshotList]);

  const sentThisMonth = useMemo(() => {
    const now = new Date();
    return Object.values(notificationStatus).filter(s => s.sent && s.sentAt && new Date(s.sentAt).getMonth() === now.getMonth() && new Date(s.sentAt).getFullYear() === now.getFullYear()).length;
  }, [notificationStatus]);

  useEffect(() => {
    if (customerData && customerData.length > 0) {
      const formatted = customerData.map((item): TaxExpiryData | null => {
        let expiryDate = item.expiryDate || item.nextTaxDate || '';
        if (!expiryDate) {
          const lastTaxDate = item.lastTaxDate || item.registerDate || '';
          if (lastTaxDate) {
            let dObj: Date | null = null;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) { const [dd, mm, yyyy] = lastTaxDate.split('/'); dObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd)); }
            else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) dObj = new Date(lastTaxDate);
            if (dObj && !isNaN(dObj.getTime())) { dObj.setDate(dObj.getDate() + 365); expiryDate = dObj.toISOString().split('T')[0]; }
          }
        }
        if (!expiryDate) return null;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate)) { const [dd, mm, yyyy] = expiryDate.split('/'); expiryDate = `${yyyy}-${mm}-${dd}`; }
        const rawPhone = (item.phone || '').toString();
        const phone = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
        return {
          sequenceNumber: item.sequenceNumber || 0,
          licensePlate: item.licensePlate || '',
          customerName: item.customerName || '',
          phone,
          lastTaxDate: item.lastTaxDate || item.registerDate || '',
          expiryDate,
          daysUntilExpiry: calculateDaysUntilExpiry(expiryDate),
          status: calculateStatus(item.lastTaxDate || item.registerDate || ''),
          brand: item.brand,
          vehicleType: item.vehicleType,
          tags: item.tags || []
        };
      }).filter((item): item is TaxExpiryData => item !== null).sort((a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0));
      setData(formatted);
    }
  }, [customerData]);

const resetAllFilters = () => { setSearch(''); setFilterMonth(''); setFilterStatus(''); setAdvancedFilters({ dateFrom: '', dateTo: '', inspectionDateFrom: '', inspectionDateTo: '', selectedBrands: [], selectedVehicleTypes: [] }); setCurrentPage(1); };

  const uniqueBrands = useMemo(() => {
    if (!customerData) return [];
    return Array.from(new Set(
      customerData.map(c => c.brand || '').filter(b => b !== '')
    )).sort();
  }, [customerData]);

  const uniqueVehicleTypes = useMemo(() => {
    if (!customerData) return [];
    return Array.from(new Set(
      customerData.map(c => c.vehicleType || '').filter(t => t !== '')
    )).sort();
  }, [customerData]);

  const filteredData = useMemo(() => data.filter(item => {
    const searchLower = debouncedSearch.toLowerCase();
    const matchSearch = !debouncedSearch || item.licensePlate.toLowerCase().includes(searchLower) || item.customerName.toLowerCase().includes(searchLower) || item.phone.includes(debouncedSearch);
    const matchMonth = !filterMonth || String(new Date(item.expiryDate).getMonth() + 1) === filterMonth;
    const matchStatus = !filterStatus || item.status === filterStatus;

    let matchDateRange = true;
    if (advancedFilters.dateFrom || advancedFilters.dateTo) {
      const d = new Date(item.lastTaxDate);
      if (advancedFilters.dateFrom) matchDateRange = matchDateRange && d >= new Date(advancedFilters.dateFrom);
      if (advancedFilters.dateTo) matchDateRange = matchDateRange && d <= new Date(advancedFilters.dateTo);
    }
    return matchSearch && matchMonth && matchStatus && matchDateRange;
  }), [data, debouncedSearch, filterMonth, filterStatus, advancedFilters]);

  const activeFiltersCount = useMemo(() => (advancedFilters.dateFrom ? 1 : 0) + (advancedFilters.dateTo ? 1 : 0) + advancedFilters.selectedBrands.length + advancedFilters.selectedVehicleTypes.length, [advancedFilters]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIndex, startIndex + itemsPerPage), [filteredData, itemsPerPage, startIndex]);
  const handleJumpToPage = () => { const p = parseInt(jumpToPage); if (!isNaN(p) && p >= 1 && p <= totalPages) { setCurrentPage(p); setJumpToPage(''); } };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || showNotificationModal || showSentHistoryModal) return;
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
      else if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage(p => p + 1);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, showNotificationModal, showSentHistoryModal]);

  const monthOptions = MONTH_OPTIONS;
  const statusOptions = STATUS_FILTER_OPTIONS;

  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">ภาษีครั้งถัดไป</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">จัดการรายการแจ้งเตือนและวันหมดอายุภาษี</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowNotificationModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className={isLoadingDaily ? 'animate-pulse text-amber-500' : 'text-gray-400'} />
                แจ้งเตือนวันนี้
                <span className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[20px] text-center">{dailySnapshotList.length}</span>
              </button>
              <button onClick={() => setShowSentHistoryModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faCheck} className="text-emerald-500" />
                ประวัติการส่ง
              </button>
              <Link href="/customer-info" className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm text-sm font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faArrowRight} className="text-xs rotate-180" /> กลับหน้าหลัก
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={faInfoCircle} color="gray" title="รายการทั้งหมด" value={filteredData.length} />
            <StatCard icon={faExclamationTriangle} color="amber" title="ใกล้ครบกำหนด" value={filteredData.filter(i => i.status === 'กำลังจะครบกำหนด').length} />
            <StatCard icon={faTimesCircle} color="rose" title="เกินกำหนด" value={filteredData.filter(i => i.status === 'เกินกำหนด').length} />
            <StatCard icon={faCheckCircle} color="emerald" title="ส่งแจ้งเตือนแล้ว (เดือนนี้)" value={sentThisMonth} />
          </div>

{/* Filters Bar - Clean & Compact Style (Fixed Dropdown Overflow) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 mb-6 shadow-sm relative z-20">
            <div className="flex flex-col lg:flex-row gap-3">
              
              {/* 1. ส่วนค้นหาและ Dropdown (ซ้าย) */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px]">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm" />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, ทะเบียน, เบอร์โทร..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* ✅ แก้ไขจุดนี้: เปลี่ยนจาก overflow-x-auto เป็น flex-wrap และลบ overflow ออก */}
                {/* Dropdowns Group */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap relative z-30"> 
                   <div className="min-w-[140px] relative">
                      <FilterDropdown value={filterMonth} onChange={val => { setFilterMonth(val); setCurrentPage(1); }} icon={faCalendarAlt} placeholder="เดือน" options={monthOptions} />
                   </div>
                   <div className="min-w-[160px] relative">
                      <FilterDropdown value={filterStatus} onChange={val => { setFilterStatus(val); setCurrentPage(1); }} icon={faClock} placeholder="สถานะ" options={statusOptions} />
                   </div>
                </div>
              </div>

              {/* 2. ส่วนปุ่มจัดการ (ขวา) */}
              <div className="flex items-center justify-end gap-3 pt-2 lg:pt-0 border-t border-gray-100 lg:border-t-0 lg:border-l lg:pl-3 dark:border-gray-700 relative z-10">
                 {/* ปุ่มรีเซ็ต */}
                 <button 
                    onClick={resetAllFilters} 
                    className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors px-2 whitespace-nowrap"
                 >
                    ล้างค่า
                 </button>

                 {/* ปุ่มตัวกรองขั้นสูง */}
                 <button 
                    onClick={() => setShowAdvancedFilter(true)} 
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium whitespace-nowrap ${
                      activeFiltersCount > 0 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                 >
                  <FontAwesomeIcon icon={faFilter} className="text-xs" /> 
                  <span>ตัวกรองขั้นสูง</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 bg-white text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                        {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>{['ลำดับ', 'ทะเบียนรถ', 'ชื่อลูกค้า', 'เบอร์โทร', 'วันที่ชำระล่าสุด', 'ภาษีครั้งถัดไป', 'วันที่เหลือ', 'สถานะ', 'แจ้งเตือน'].map(h => (<th key={h} className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {currentData.length === 0 ? (<tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">ไม่พบข้อมูล</td></tr>) :
                    currentData.map((item, idx) => (
                      <TaxExpiryRow key={item.licensePlate + idx} item={item} rowNumber={startIndex + idx + 1} notificationStatus={notificationStatus} isFavorite={favorites.has(item.licensePlate)} onToggleFavorite={toggleFavorite} />
                    ))}
                </tbody>
              </table>
            </div>
            {/* Footer Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 flex items-center justify-between">
              <p className="text-xs text-gray-500">แสดง {currentData.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"><FontAwesomeIcon icon={faArrowRight} className="rotate-180 text-xs" /></button>
                  <div className="flex gap-1">{getPageNumbers(currentPage, totalPages).map((p, i) => (<button key={i} onClick={() => typeof p === 'number' && setCurrentPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium ${currentPage === p ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`} disabled={typeof p !== 'number'}>{p}</button>))}</div>
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"><FontAwesomeIcon icon={faArrowRight} className="text-xs" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-3">
            {currentData.map((item, idx) => (
              <TaxExpiryCard
                key={item.licensePlate + idx}
                item={item}
                rowNumber={startIndex + idx + 1}
                notificationStatus={notificationStatus}
                isFavorite={favorites.has(item.licensePlate)}
                onToggleFavorite={toggleFavorite}
                statusColor={STATUS_COLOR}
                statusIcon={STATUS_ICON}
                formatDate={formatDateFlexible}
              />
            ))}
          </div>

        </div>
      </motion.div>

      {/* Notification Modal (Clean & White) */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">แจ้งเตือนวันนี้</h2>
                <p className="text-sm text-gray-500">จัดการรายการที่ต้องส่งข้อความ</p>
              </div>
              <div className="flex gap-2">
                <button onClick={createNewDailyNotifications} disabled={isCreatingNew} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors" title="สร้างใหม่"><FontAwesomeIcon icon={faPlus} /></button>
                <button onClick={clearDailyBoard} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors" title="ล้างกระดาน"><FontAwesomeIcon icon={faTrash} /></button>
                <button onClick={() => setShowNotificationModal(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><FontAwesomeIcon icon={faTimesCircle} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-3">
              {/* Toolbar */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button onClick={startSelectionMode} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isSelectionMode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>{isSelectionMode ? 'ยกเลิกเลือก' : 'เลือกรายการ'}</button>
                  {selectedItems.size > 0 && <button onClick={deleteMultipleNotifications} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-colors">ลบ ({selectedItems.size})</button>}
                </div>
                <span className="text-xs text-gray-500">ทั้งหมด {notificationList.length} รายการ</span>
              </div>
              {notificationList.length === 0 ? <div className="text-center py-10 text-gray-400">ไม่มีรายการแจ้งเตือน</div> :
                notificationList.map((item, idx) => (
                  <NotificationItemCard key={item.licensePlate} item={item} idx={idx} isSelectionMode={isSelectionMode} isSelected={selectedItems.has(item.licensePlate)} isCopied={copiedId === item.licensePlate} hasCopied={copiedIds.has(item.licensePlate)} isSending={sendingLicensePlates.has(item.licensePlate)} copiedPhoneIds={copiedPhoneIds} onToggleSelection={toggleSelection} onCopyPhone={copyPhoneToClipboard} onCopyMessage={copyToClipboard} onMarkAsSent={markAsSent} onDelete={deleteNotification} formatDate={formatDateFlexible} />
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* History Modal (Fixed Crash Bug) */}
      {showSentHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowSentHistoryModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">ประวัติการส่ง</h2>
                <p className="text-sm text-gray-500">รายการที่ส่งข้อความแล้ว</p>
              </div>
              <button onClick={() => setShowSentHistoryModal(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"><FontAwesomeIcon icon={faTimesCircle} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-3">
              {Object.keys(notificationStatus).length === 0 ? <div className="text-center py-10 text-gray-400">ไม่มีประวัติการส่ง</div> :
                Object.entries(notificationStatus).sort((a, b) => new Date(b[1].sentAt).getTime() - new Date(a[1].sentAt).getTime()).map(([plate, status], idx) => {
                  const carData = data.find(d => d.licensePlate === plate);
                  return (
                    <div key={plate} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{plate}</span>
                            <span className="text-sm text-gray-500">{carData?.customerName || '(ไม่พบข้อมูล)'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">ส่งเมื่อ: {new Date(status.sentAt).toLocaleString('th-TH')}</div>
                        </div>
                      </div>
                      <button onClick={() => resetNotificationStatus(plate)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">รีเซ็ตสถานะ</button>
                    </div>
                  )
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal isOpen={showAdvancedFilter} onClose={() => setShowAdvancedFilter(false)} onApply={f => { setAdvancedFilters(f); setCurrentPage(1); }} brands={uniqueBrands} vehicleTypes={uniqueVehicleTypes} currentFilters={advancedFilters} />
    </AnimatedPage>
  );
}