// src/app/devtool/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faDatabase, faCode, faCheckCircle, faTimesCircle, faSpinner, faBell, faTrash, faSync } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface DevTool {
  id: string;
  name: string;
  description: string;
  icon: IconDefinition;
  path: string;
  status: 'active' | 'inactive';
}

export default function DevToolPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string>('');
  const [isClearingStatus, setIsClearingStatus] = useState(false);
  const [clearStatusResult, setClearStatusResult] = useState<string>('');

  // ฟังก์ชันล้างสถานะการแจ้งเตือนทั้งหมด (localStorage)
  const clearNotificationStatus = () => {
    if (!confirm('ต้องการล้างสถานะการแจ้งเตือนทั้งหมดใช่หรือไม่?\n(จะลบข้อมูลจาก localStorage)')) {
      return;
    }

    try {
      setIsClearingStatus(true);
      setClearStatusResult('');

      // ลบข้อมูลจาก localStorage
      localStorage.removeItem('notificationStatus');

      setClearStatusResult('✅ ล้างสถานะการแจ้งเตือนทั้งหมดสำเร็จ');
      
      // รีเฟรชหน้าหลัง 1 วินาที
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing notification status:', error);
      setClearStatusResult('❌ เกิดข้อผิดพลาดในการล้างสถานะ');
    } finally {
      setIsClearingStatus(false);
    }
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
  const deleteAllNotifications = async () => {
    if (!confirm('คุณต้องการลบรายการแจ้งเตือนทั้งหมดใช่หรือไม่?')) {
      return;
    }

    setIsDeleting(true);
    setDeleteResult('');
    
    try {
      const response = await fetch('/api/daily-notifications/delete-all', {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDeleteResult(`✅ ลบรายการทั้งหมดสำเร็จ (${result.deletedCount || 0} รายการ)`);
      } else {
        setDeleteResult(`❌ เกิดข้อผิดพลาด: ${result.error || 'Unknown error'}${result.details ? '\n' + result.details : ''}`);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      setDeleteResult(`❌ เกิดข้อผิดพลาดในการลบข้อมูล: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDeleting(false);
    }
  };

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
                className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
