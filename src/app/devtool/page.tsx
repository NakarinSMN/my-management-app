// src/app/devtool/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faDatabase, faCode, faCheckCircle, faTimesCircle, faSpinner, faBell, faTrash, faSync, faLock } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useDialog } from '../contexts/DialogContext';

interface DevTool {
  id: string;
  name: string;
  description: string;
  icon: IconDefinition;
  path: string;
  status: 'active' | 'inactive';
}

interface DbUsage {
  dbName: string;
  collections: number;
  objects: number;
  dataSize: number;
  storageSize: number;
  indexSize: number;
  avgObjSize: number;
}

export default function DevToolPage() {
  const [devtoolPin, setDevtoolPin] = useState(["", "", "", "", "", ""]);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const pinInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string>('');
  const [isClearingStatus, setIsClearingStatus] = useState(false);
  const [clearStatusResult, setClearStatusResult] = useState<string>('');
  const [importText, setImportText] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string>('');

  const [dbUsage, setDbUsage] = useState<DbUsage | null>(null);
  const [isLoadingDbUsage, setIsLoadingDbUsage] = useState(false);
  const [dbUsageError, setDbUsageError] = useState<string | null>(null);

  // ⚡ ใช้ Dialog Hook
  const { showConfirm, showSuccess, showError } = useDialog();

  // ตรวจสอบ PIN สำหรับ DevTool (ใช้ PIN แยก)
  const DEVTOOL_PIN = "240444";

  // ตรวจสอบว่าได้ verify PIN แล้วหรือยัง (ไม่เก็บใน sessionStorage - ให้ใส่ PIN ทุกครั้ง)
  // ให้ใส่ PIN ทุกครั้งที่เข้าหน้า devtool
  // useEffect(() => {
  //   // ไม่ใช้ sessionStorage - ให้ใส่ PIN ทุกครั้ง
  // }, []);

  // Handle PIN input change
  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }
    const newPin = [...devtoolPin];
    newPin[index] = value;
    setDevtoolPin(newPin);
    setPinError("");

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // Auto verify เมื่อกรอกครบ 6 หลัก
    if (value && index === 5) {
      const pinString = newPin.join("");
      if (pinString.length === 6) {
        setTimeout(() => {
          handleVerifyPin();
        }, 100);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !devtoolPin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.match(/\d/g) || [];
    
    if (digits.length === 6) {
      setDevtoolPin(digits as string[]);
      pinInputRefs.current[5]?.focus();
    }
  };

  // Verify DevTool PIN - เช็คแบบเป๊ะๆ
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const pinString = devtoolPin.join("");
    if (pinString.length !== 6) {
      return;
    }

    setIsCheckingPin(true);
    
    // เช็ค PIN แบบตรงๆ
    if (pinString === DEVTOOL_PIN) {
      setIsPinVerified(true);
      setDevtoolPin(["", "", "", "", "", ""]);
    } else {
      setPinError("PIN ไม่ถูกต้อง");
      setDevtoolPin(["", "", "", "", "", ""]);
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
    
    setIsCheckingPin(false);
  };

  // ฟังก์ชัน Import รายการที่ส่งแล้ว
  const importSentNotifications = () => {
    if (!importText.trim()) {
      showError('ข้อมูลไม่ครบ', 'กรุณาวางข้อความที่ต้องการ import');
      return;
    }

    showConfirm(
      'Import รายการที่ส่งแล้ว',
      'ต้องการ import รายการที่ส่งแล้วใช่หรือไม่?\n\nระบบจะบันทึกข้อมูลลง MongoDB เพื่อป้องกันการส่งซ้ำ',
      async () => {
        setIsImporting(true);
        setImportResult('');
        
        try {
          const response = await fetch('/api/notification-status/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textData: importText })
          });
          
          const result = await response.json();
          
          if (result.success) {
            setImportResult(`✅ Import สำเร็จ! นำเข้า ${result.imported} รายการ${result.errors > 0 ? ` (มีข้อผิดพลาด ${result.errors} รายการ)` : ''}`);
            setImportText(''); // ล้างข้อความหลัง import สำเร็จ
            
            showSuccess(
              'Import สำเร็จ!',
              `นำเข้าข้อมูลเรียบร้อยแล้ว ${result.imported} รายการ`,
              () => {
                // รีเฟรชหน้าหลัง 1 วินาที
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            );
          } else {
            setImportResult(`❌ เกิดข้อผิดพลาด: ${result.error || 'Unknown error'}${result.details ? '\n' + result.details : ''}`);
            showError(
              'Import ไม่สำเร็จ',
              `${result.error || 'Unknown error'}`
            );
          }
        } catch (error) {
          console.error('Error importing notifications:', error);
          setImportResult(`❌ เกิดข้อผิดพลาดในการ import: ${error instanceof Error ? error.message : String(error)}`);
          showError(
            'เกิดข้อผิดพลาด',
            `เกิดข้อผิดพลาดในการ import: ${error instanceof Error ? error.message : String(error)}`
          );
        } finally {
          setIsImporting(false);
        }
      }
    );
  };

  // ฟังก์ชันล้างสถานะการแจ้งเตือนทั้งหมด (localStorage)
  const clearNotificationStatus = () => {
    showConfirm(
      'ล้างสถานะการแจ้งเตือน',
      'ต้องการล้างสถานะการแจ้งเตือนทั้งหมดใช่หรือไม่?\n\n(จะลบข้อมูลจาก localStorage)',
      async () => {
        try {
          setIsClearingStatus(true);
          setClearStatusResult('');

          // ลบข้อมูลจาก localStorage
          localStorage.removeItem('notificationStatus');

          setClearStatusResult('✅ ล้างสถานะการแจ้งเตือนทั้งหมดสำเร็จ');
          
          showSuccess(
            'ล้างสถานะสำเร็จ!',
            'ล้างสถานะการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว',
            () => {
              // รีเฟรชหน้าหลัง 1 วินาที
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          );
        } catch (error) {
          console.error('Error clearing notification status:', error);
          setClearStatusResult('❌ เกิดข้อผิดพลาดในการล้างสถานะ');
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการล้างสถานะ กรุณาลองใหม่อีกครั้ง'
          );
        } finally {
          setIsClearingStatus(false);
        }
      }
    );
  };

  // ฟังก์ชันโหลดรายการแจ้งเตือนใหม่
  const refreshDailyNotifications = async () => {
    setIsRefreshing(true);
    setRefreshResult('');
    
    try {
      console.log('🔄 Starting refresh...');
      
      // ลบรายการเก่า (Force Refresh)
      const response = await fetch('/api/daily-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        setRefreshResult('✅ ลบรายการเก่าสำเร็จ! กรุณารีเฟรชหน้าเพื่อโหลดรายการใหม่ 50 คัน');
        
        // รีเฟรชหน้าอัตโนมัติหลัง 2 วินาที
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRefreshResult(`❌ เกิดข้อผิดพลาด: ${result.error || 'Unknown error'}${result.details ? '\n' + result.details : ''}`);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setRefreshResult(`❌ เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ฟังก์ชันลบรายการทั้งหมด
  const deleteAllNotifications = () => {
    showConfirm(
      'ลบรายการทั้งหมด',
      'คุณต้องการลบรายการแจ้งเตือนทั้งหมดใช่หรือไม่?',
      async () => {
        setIsDeleting(true);
        setDeleteResult('');
        
        try {
          const response = await fetch('/api/daily-notifications/delete-all', {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            setDeleteResult(`✅ ลบรายการทั้งหมดสำเร็จ (${result.deletedCount || 0} รายการ)`);
            showSuccess(
              'ลบรายการสำเร็จ!',
              `ลบรายการแจ้งเตือนทั้งหมดแล้ว (${result.deletedCount || 0} รายการ)`
            );
          } else {
            setDeleteResult(`❌ เกิดข้อผิดพลาด: ${result.error || 'Unknown error'}${result.details ? '\n' + result.details : ''}`);
            showError(
              'เกิดข้อผิดพลาด',
              `${result.error || 'Unknown error'}`
            );
          }
        } catch (error) {
          console.error('Error deleting all notifications:', error);
          setDeleteResult(`❌ เกิดข้อผิดพลาดในการลบข้อมูล: ${error instanceof Error ? error.message : String(error)}`);
          showError(
            'เกิดข้อผิดพลาด',
            `เกิดข้อผิดพลาดในการลบข้อมูล: ${error instanceof Error ? error.message : String(error)}`
          );
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  useEffect(() => {
    if (!isPinVerified) return;

    const fetchDbUsage = async () => {
      try {
        setIsLoadingDbUsage(true);
        setDbUsageError(null);

        const res = await fetch('/api/db-usage');
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'ไม่สามารถดึงข้อมูลการใช้พื้นที่ฐานข้อมูลได้');
        }

        setDbUsage(result.data);
      } catch (error) {
        console.error('Error fetching DB usage:', error);
        setDbUsageError(
          error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลการใช้พื้นที่ฐานข้อมูลได้',
        );
      } finally {
        setIsLoadingDbUsage(false);
      }
    };

    fetchDbUsage();
  }, [isPinVerified]);

  const devTools: DevTool[] = [
    {
      id: 'mongodb-debug',
      name: 'MongoDB Debug',
      description: 'ตรวจสอบและแก้ไขปัญหา MongoDB Atlas Connection',
      icon: faDatabase,
      path: '/devtool/mongodb-debug',
      status: 'active'
    },
    {
      id: 'api-tester',
      name: 'API Tester',
      description: 'ทดสอบ API endpoints ต่างๆ',
      icon: faCode,
      path: '/devtool/api-tester',
      status: 'active'
    },
    {
      id: 'data-migration',
      name: 'Data Migration',
      description: 'ย้ายข้อมูลระหว่างระบบ',
      icon: faDatabase,
      path: '/devtool/data-migration',
      status: 'active'
    },
    {
      id: 'filter-sent',
      name: 'กรองรายการที่ยังไม่ส่ง',
      description: 'แยกรายการที่ยังไม่ส่งออกจากข้อมูลทั้งหมด',
      icon: faBell,
      path: '/devtool/filter-sent',
      status: 'active'
    },
    {
      id: 'system-health',
      name: 'System Health',
      description: 'ตรวจสอบสถานะระบบทั้งหมด',
      icon: faCheckCircle,
      path: '/devtool/system-health',
      status: 'active'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'inactive':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faSpinner} className="text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'inactive':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  // ถ้ายังไม่ได้ verify DevTool PIN ให้แสดงหน้า PIN
  if (!isPinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mb-4"
            >
              <FontAwesomeIcon icon={faLock} className="text-white text-2xl" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              DevTool Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              กรุณากรอก PIN 6 หลักเพื่อเข้าถึง DevTool
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleVerifyPin}>
            {pinError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center"
              >
                {pinError}
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                  PIN 6 หลัก
                </label>
                <div className="flex justify-center gap-3">
                  {devtoolPin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        pinInputRefs.current[index] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={isCheckingPin}
                      className="w-12 h-14 text-center text-3xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      style={{
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
            <div>
              <motion.button
                type="submit"
                disabled={isCheckingPin || devtoolPin.join("").length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCheckingPin ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLock} />
                    ตรวจสอบ PIN
                  </>
                )}
              </motion.button>
            </div>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FontAwesomeIcon icon={faTools} className="mr-3 text-blue-600" />
            DevTool Dashboard
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            เครื่องมือสำหรับพัฒนาและแก้ไขปัญหา
          </motion.p>
        </div>

        {/* Database Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faDatabase} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  การใช้พื้นที่ฐานข้อมูล MongoDB (รวมทั้งโปรเจกต์)
                </h2>
              </div>
              {isLoadingDbUsage && (
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  กำลังโหลดข้อมูลการใช้พื้นที่...
                </p>
              )}
              {dbUsageError && !isLoadingDbUsage && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {dbUsageError}
                </p>
              )}
              {dbUsage && !isLoadingDbUsage && (
                <div className="text-xs text-gray-800 dark:text-gray-200 space-y-2">
                  {(() => {
                    const CAPACITY_BYTES = 512 * 1024 * 1024; // 512 MB สำหรับ MongoDB Atlas Free Tier
                    // ใช้ storageSize เป็นหลัก (พื้นที่ที่ใช้จริงในดิสก์)
                    const usedBytes = Number(dbUsage.storageSize) || 0;
                    const usedPercent = Math.min(
                      100,
                      CAPACITY_BYTES > 0 ? (usedBytes / CAPACITY_BYTES) * 100 : 0
                    );
                    
                    // คำนวณค่าที่ใช้จริง (ให้แน่ใจว่าเป็นตัวเลข)
                    const formattedUsed = formatBytes(usedBytes);
                    const percentValue = usedPercent.toFixed(1);

                    return (
                      <>
                        <p>
                          <span className="font-medium">ฐานข้อมูล:</span> {dbUsage.dbName}
                        </p>
                        <p>
                          ใช้ไป{' '}
                          <span className="font-semibold">
                            {formattedUsed}
                          </span>{' '}
                          จาก{' '}
                          <span className="font-semibold">
                            512 MB
                          </span>{' '}
                          ({percentValue}%)
                        </p>

                        {/* หลอดแสดงสัดส่วนการใช้พื้นที่จาก 512 MB */}
                        <div className="mt-1 space-y-1">
                          <div className="w-full h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden relative">
                            <div
                              className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                              style={{ width: `${usedPercent}%`, minWidth: usedPercent > 0 ? '2px' : '0' }}
                              title={`ใช้ไป ${formattedUsed} จาก 512 MB (${percentValue}%)`}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-300">
                            <span>0 MB</span>
                            <span className="font-medium">{formattedUsed}</span>
                            <span>512 MB</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          เอกสารทั้งหมดประมาณ {Number(dbUsage.objects || 0).toLocaleString('th-TH')} รายการ ใน {Number(dbUsage.collections || 0)} collections
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* DevTools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${getStatusColor(tool.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon 
                    icon={tool.icon} 
                    className="text-2xl text-gray-600 dark:text-gray-400" 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(tool.status)}
                  <span className="text-sm font-medium">
                    {tool.status === 'active' ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href={tool.path}>
                  <motion.button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    เปิดใช้งาน
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🚀 Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/devtool/mongodb-debug">
              <motion.button
                className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FontAwesomeIcon icon={faDatabase} className="mr-2" />
                Debug MongoDB Connection
              </motion.button>
            </Link>
            <Link href="/devtool/api-tester">
              <motion.button
                className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FontAwesomeIcon icon={faCode} className="mr-2" />
                Test API Endpoints
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Daily Notifications Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔔 จัดการรายการแจ้งเตือนวันนี้
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ปุ่มโหลดข้อมูลใหม่ */}
              <motion.button
                onClick={refreshDailyNotifications}
                disabled={isRefreshing}
                className="w-full p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isRefreshing ? 1 : 1.02 }}
                whileTap={{ scale: isRefreshing ? 1 : 0.98 }}
              >
                <FontAwesomeIcon 
                  icon={isRefreshing ? faSync : faBell} 
                  className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                {isRefreshing ? 'กำลังโหลด...' : 'โหลดรายการใหม่ (50 คัน)'}
              </motion.button>

              {/* ปุ่มลบทั้งหมด */}
              <motion.button
                onClick={deleteAllNotifications}
                disabled={isDeleting}
                className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                whileTap={{ scale: isDeleting ? 1 : 0.98 }}
              >
                <FontAwesomeIcon 
                  icon={isDeleting ? faSync : faTrash} 
                  className={`mr-2 ${isDeleting ? 'animate-spin' : ''}`} 
                />
                {isDeleting ? 'กำลังลบ...' : 'ลบรายการทั้งหมด'}
              </motion.button>

              {/* ปุ่มล้างสถานะการแจ้งเตือน */}
              <motion.button
                onClick={clearNotificationStatus}
                disabled={isClearingStatus}
                className="w-full p-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isClearingStatus ? 1 : 1.02 }}
                whileTap={{ scale: isClearingStatus ? 1 : 0.98 }}
              >
                <FontAwesomeIcon 
                  icon={isClearingStatus ? faSync : faTrash} 
                  className={`mr-2 ${isClearingStatus ? 'animate-spin' : ''}`} 
                />
                {isClearingStatus ? 'กำลังล้าง...' : 'ล้างสถานะการส่งทั้งหมด'}
              </motion.button>
            </div>

            {/* แสดงผลลัพธ์ */}
            {refreshResult && (
              <div className={`p-4 rounded-lg ${
                refreshResult.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  refreshResult.includes('✅') 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {refreshResult}
                </p>
              </div>
            )}

            {deleteResult && (
              <div className={`p-4 rounded-lg ${
                deleteResult.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  deleteResult.includes('✅') 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {deleteResult}
                </p>
              </div>
            )}

            {clearStatusResult && (
              <div className={`p-4 rounded-lg ${
                clearStatusResult.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  clearStatusResult.includes('✅') 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {clearStatusResult}
                </p>
              </div>
            )}

            {/* คำอธิบาย */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>โหลดรายการใหม่:</strong> ลบรายการเก่าและสร้างรายการใหม่ 50 คันสำหรับวันนี้
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                🗑️ <strong>ลบรายการทั้งหมด:</strong> ลบรายการแจ้งเตือนทั้งหมดออกจาก MongoDB
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                🔄 <strong>ล้างสถานะการส่ง:</strong> ลบสถานะ &quot;ส่งแล้ว&quot; ทั้งหมดจาก localStorage (ทำให้ทุกรายการกลับเป็น &quot;ยังไม่ส่ง&quot;)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Import Sent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📥 Import รายการที่ส่งแล้ว
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วางข้อความรายการที่ส่งแล้วที่นี่:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`ตัวอย่าง:\n9กก3222กท\tปรีชา ผาดาสิทธิ์\t0890069676\t07/12/2567\t07/12/2568\t33 วัน\tกำลังจะครบกำหนด\tส่งแล้ว\n(03/11 10:34)\n\nวางข้อความที่คัดลอกมาจากไฟล์ข้อความที่นี่...`}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <motion.button
              onClick={importSentNotifications}
              disabled={isImporting || !importText.trim()}
              className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isImporting || !importText.trim() ? 1 : 1.02 }}
              whileTap={{ scale: isImporting || !importText.trim() ? 1 : 0.98 }}
            >
              <FontAwesomeIcon 
                icon={isImporting ? faSync : faDatabase} 
                className={`mr-2 ${isImporting ? 'animate-spin' : ''}`} 
              />
              {isImporting ? 'กำลัง Import...' : 'Import ข้อมูลลง MongoDB'}
            </motion.button>

            {importResult && (
              <div className={`p-4 rounded-lg ${
                importResult.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm whitespace-pre-wrap ${
                  importResult.includes('✅') 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {importResult}
                </p>
              </div>
            )}

            {/* คำอธิบาย */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                💡 วิธีใช้งาน:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>คัดลอกข้อความรายการที่ส่งแล้วจากไฟล์ของคุณ</li>
                <li>วางข้อความลงในช่องด้านบน</li>
                <li>กดปุ่ม &quot;Import ข้อมูลลง MongoDB&quot;</li>
                <li>ระบบจะบันทึกรายการที่ส่งแล้วลง MongoDB</li>
                <li>รถที่ส่งแล้วจะไม่แสดงในรายการแจ้งเตือนอีก</li>
              </ol>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-3">
                📋 <strong>รูปแบบข้อมูล:</strong> ต้องมีคอลัมน์ที่ 8 เป็น &quot;ส่งแล้ว&quot; และบรรทัดถัดไปเป็นวันเวลา (DD/MM HH:MM)
              </p>
            </div>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ หมายเหตุ
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• DevTool นี้ใช้สำหรับการพัฒนาและแก้ไขปัญหาเท่านั้น</li>
            <li>• ไม่ควรใช้ใน Production Environment</li>
            <li>• ตรวจสอบ Environment Variables ก่อนใช้งาน</li>
            <li>• ใช้ MongoDB Debug เพื่อตรวจสอบการเชื่อมต่อ</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
