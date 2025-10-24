// src/app/test-mongodb/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faSpinner, faDatabase, faUsers, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: unknown;
  count?: number;
}

export default function TestMongoDBPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'MongoDB Connection',
      endpoint: '/api/customers',
      icon: faDatabase,
      description: 'ทดสอบการเชื่อมต่อ MongoDB Atlas'
    },
    {
      name: 'Customers Collection',
      endpoint: '/api/customers',
      icon: faUsers,
      description: 'ทดสอบดึงข้อมูลลูกค้าจาก MongoDB'
    },
    {
      name: 'Billing Collection',
      endpoint: '/api/billing',
      icon: faFileInvoice,
      description: 'ทดสอบดึงข้อมูลบิลจาก MongoDB'
    }
  ];

  const runTest = async (test: typeof tests[0]) => {
    try {
      const startTime = Date.now();
      const response = await fetch(test.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // เพิ่ม timeout
        signal: AbortSignal.timeout(10000) // 10 วินาที timeout
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          name: test.name,
          status: 'success' as const,
          message: `✅ เชื่อมต่อสำเร็จ! (${duration}ms)`,
          data: data.data,
          count: data.count || data.data?.length || 0
        };
      } else {
        return {
          name: test.name,
          status: 'error' as const,
          message: `❌ เกิดข้อผิดพลาด: ${data.error || 'Unknown error'}`,
          data: null
        };
      }
    } catch (error) {
      return {
        name: test.name,
        status: 'error' as const,
        message: `❌ เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const test of tests) {
      // ตั้งค่า loading
      setTestResults(prev => [...prev, {
        name: test.name,
        status: 'loading',
        message: '🔄 กำลังทดสอบ...'
      }]);

      // รัน test
      const result = await runTest(test);
      
      // อัพเดทผลลัพธ์
      setTestResults(prev => prev.map(r => 
        r.name === test.name ? result : r
      ));

      // รอ 1 วินาที
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🚀 ทดสอบการเชื่อมต่อ MongoDB Atlas
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ตรวจสอบการเชื่อมต่อและดึงข้อมูลจาก MongoDB Atlas
          </motion.p>
        </div>

        {/* Test Button */}
        <div className="mb-8">
          <motion.button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
          >
            {isRunning ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faDatabase} className="mr-2" />
                เริ่มทดสอบการเชื่อมต่อ
              </>
            )}
          </motion.button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => {
            const result = testResults.find(r => r.name === test.name);
            const status = result?.status || 'loading';
            const message = result?.message || 'รอการทดสอบ...';
            const count = result?.count || 0;

            return (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(status)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon 
                      icon={test.icon} 
                      className="text-2xl text-gray-600 dark:text-gray-400" 
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {status === 'loading' ? 'กำลังทดสอบ...' : 
                       status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {message}
                  </p>
                  
                  {status === 'success' && count > 0 && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                        📊 จำนวน: {count} รายการ
                      </span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        🚀 MongoDB Atlas
                      </span>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="text-red-600 dark:text-red-400 text-sm">
                      💡 ตรวจสอบ: MongoDB URI, Network Access, Database Access
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        {testResults.length > 0 && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 สรุปผลการทดสอบ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">สำเร็จ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ล้มเหลว</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.reduce((sum, r) => sum + (r.count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">รายการทั้งหมด</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 วิธีแก้ไขปัญหา
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• ตรวจสอบ MongoDB URI ในไฟล์ .env.local</li>
            <li>• ตรวจสอบ Network Access ใน MongoDB Atlas</li>
            <li>• ตรวจสอบ Database Access ใน MongoDB Atlas</li>
            <li>• ตรวจสอบว่า Cluster ทำงานอยู่</li>
            <li>• ตรวจสอบ Internet Connection</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
