// src/app/devtool/mongodb-debug/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faSpinner, faDatabase, faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DebugResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function MongoDBDebugPage() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const debugTests = [
    {
      name: 'Environment Variables',
      description: 'ตรวจสอบ MONGODB_URI และ MONGODB_DATABASE'
    },
    {
      name: 'MongoDB URI Format',
      description: 'ตรวจสอบรูปแบบ MongoDB URI'
    },
    {
      name: 'Network Connectivity',
      description: 'ทดสอบการเชื่อมต่อ MongoDB Atlas'
    },
    {
      name: 'Authentication',
      description: 'ทดสอบการยืนยันตัวตน'
    },
    {
      name: 'Database Access',
      description: 'ทดสอบการเข้าถึง Database'
    }
  ];

  const runDebugTest = async (test: typeof debugTests[0]) => {
    try {
      const startTime = Date.now();
      
      switch (test.name) {
        case 'Environment Variables':
          const envResponse = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'environment' })
          });
          
          const envData = await envResponse.json();
          
          if (envData.success) {
            return {
              name: test.name,
              status: 'success' as const,
              message: '✅ Environment Variables พบแล้ว',
              details: envData.message
            };
          } else {
            return {
              name: test.name,
              status: 'error' as const,
              message: '❌ Environment Variables ไม่พบ',
              details: envData.error
            };
          }

        case 'MongoDB URI Format':
          const uriResponse = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'uri_format' })
          });
          
          const uriData = await uriResponse.json();
          
          if (uriData.success) {
            return {
              name: test.name,
              status: 'success' as const,
              message: '✅ MongoDB URI Format ถูกต้อง',
              details: uriData.message
            };
          } else {
            return {
              name: test.name,
              status: 'error' as const,
              message: '❌ MongoDB URI Format ไม่ถูกต้อง',
              details: uriData.error
            };
          }

        case 'Network Connectivity':
          const response = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'network' })
          });
          
          const data = await response.json();
          const duration = Date.now() - startTime;
          
          if (data.success) {
            return {
              name: test.name,
              status: 'success' as const,
              message: `✅ Network Connectivity สำเร็จ (${duration}ms)`,
              details: data.message
            };
          } else {
            return {
              name: test.name,
              status: 'error' as const,
              message: '❌ Network Connectivity ล้มเหลว',
              details: data.error
            };
          }

        case 'Authentication':
          const authResponse = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'auth' })
          });
          
          const authData = await authResponse.json();
          
          if (authData.success) {
            return {
              name: test.name,
              status: 'success' as const,
              message: '✅ Authentication สำเร็จ',
              details: authData.message
            };
          } else {
            return {
              name: test.name,
              status: 'error' as const,
              message: '❌ Authentication ล้มเหลว',
              details: authData.error
            };
          }

        case 'Database Access':
          const dbResponse = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'database' })
          });
          
          const dbData = await dbResponse.json();
          
          if (dbData.success) {
            return {
              name: test.name,
              status: 'success' as const,
              message: '✅ Database Access สำเร็จ',
              details: dbData.message
            };
          } else {
            return {
              name: test.name,
              status: 'error' as const,
              message: '❌ Database Access ล้มเหลว',
              details: dbData.error
            };
          }

        default:
          return {
            name: test.name,
            status: 'error' as const,
            message: '❌ Test ไม่รู้จัก',
            details: 'Unknown test'
          };
      }
    } catch (error) {
      return {
        name: test.name,
        status: 'error' as const,
        message: `❌ เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error ? error.stack : 'No stack trace'
      };
    }
  };

  const runAllDebugTests = async () => {
    setIsRunning(true);
    setDebugResults([]);

    for (const test of debugTests) {
      // ตั้งค่า loading
      setDebugResults(prev => [...prev, {
        name: test.name,
        status: 'loading',
        message: '🔄 กำลังทดสอบ...'
      }]);

      // รัน test
      const result = await runDebugTest(test);
      
      // อัพเดทผลลัพธ์
      setDebugResults(prev => prev.map(r => 
        r.name === test.name ? result : r
      ));

      // รอ 1 วินาที
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DebugResult['status']) => {
    switch (status) {
      case 'loading':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: DebugResult['status']) => {
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
          <div className="flex items-center mb-4">
            <Link href="/devtool">
              <motion.button
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                whileHover={{ x: -5 }}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                กลับไป DevTool
              </motion.button>
            </Link>
          </div>
          
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FontAwesomeIcon icon={faDatabase} className="mr-3 text-red-600" />
            MongoDB Debug Tool
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ตรวจสอบและแก้ไขปัญหา MongoDB Atlas Connection
          </motion.p>
        </div>

        {/* Debug Button */}
        <div className="mb-8">
          <motion.button
            onClick={runAllDebugTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            whileHover={{ scale: isRunning ? 1 : 1.02 }}
            whileTap={{ scale: isRunning ? 1 : 0.98 }}
          >
            {isRunning ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                กำลัง Debug...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                เริ่ม Debug MongoDB
              </>
            )}
          </motion.button>
        </div>

        {/* Debug Results */}
        <div className="space-y-4">
          {debugTests.map((test, index) => {
            const result = debugResults.find(r => r.name === test.name);
            const status = result?.status || 'loading';
            const message = result?.message || 'รอการทดสอบ...';
            const details = result?.details || '';

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
                      icon={faDatabase} 
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
                  
                  {details && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {details}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        {debugResults.length > 0 && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 สรุปผลการ Debug
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {debugResults.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">สำเร็จ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {debugResults.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ล้มเหลว</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {debugResults.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ทั้งหมด</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            💡 วิธีแก้ไขปัญหา
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
            <li>• ตรวจสอบ MongoDB Atlas Network Access (Allow access from anywhere)</li>
            <li>• ตรวจสอบ Database Access (Username/Password)</li>
            <li>• ตรวจสอบ MongoDB URI format</li>
            <li>• ตรวจสอบ Internet Connection</li>
            <li>• ตรวจสอบ MongoDB Atlas Cluster Status</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
