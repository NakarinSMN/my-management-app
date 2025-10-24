// src/app/devtool/api-tester/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPlay, faCheckCircle, faTimesCircle, faSpinner, faArrowLeft, faCopy } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ApiTest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: Record<string, unknown>;
  error?: string;
}

export default function ApiTesterPage() {
  const [tests, setTests] = useState<ApiTest[]>([
    {
      id: 'customers-get',
      name: 'Get Customers',
      method: 'GET',
      endpoint: '/api/customers',
      description: 'ดึงข้อมูลลูกค้าทั้งหมด',
      status: 'pending'
    },
    {
      id: 'billing-get',
      name: 'Get Billing',
      method: 'GET',
      endpoint: '/api/billing',
      description: 'ดึงข้อมูลบิลทั้งหมด',
      status: 'pending'
    },
    {
      id: 'debug-mongodb',
      name: 'Debug MongoDB',
      method: 'POST',
      endpoint: '/api/debug-mongodb',
      description: 'ทดสอบการเชื่อมต่อ MongoDB',
      status: 'pending'
    }
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const runTest = async (test: ApiTest) => {
    setTests(prev => prev.map(t => 
      t.id === test.id ? { ...t, status: 'running' } : t
    ));

    try {
      const startTime = Date.now();
      let response;
      
      if (test.method === 'GET') {
        response = await fetch(test.endpoint);
      } else {
        response = await fetch(test.endpoint, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'network' })
        });
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      setTests(prev => prev.map(t => 
        t.id === test.id ? {
          ...t,
          status: response.ok ? 'success' : 'error',
          result: {
            status: response.status,
            statusText: response.statusText,
            data: data,
            duration: duration
          },
          error: response.ok ? undefined : data.error || 'Unknown error'
        } : t
      ));
    } catch (error) {
      setTests(prev => prev.map(t => 
        t.id === test.id ? {
          ...t,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : t
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    
    for (const test of tests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningAll(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FontAwesomeIcon icon={faSpinner} className="text-gray-400" />;
      case 'running':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'error':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
      case 'running':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
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
            <FontAwesomeIcon icon={faCode} className="mr-3 text-green-600" />
            API Tester
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ทดสอบ API endpoints ต่างๆ ในระบบ
          </motion.p>
        </div>

        {/* Run All Button */}
        <div className="mb-8">
          <motion.button
            onClick={runAllTests}
            disabled={isRunningAll}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunningAll
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            whileHover={{ scale: isRunningAll ? 1 : 1.02 }}
            whileTap={{ scale: isRunningAll ? 1 : 0.98 }}
          >
            {isRunningAll ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlay} className="mr-2" />
                รันทดสอบทั้งหมด
              </>
            )}
          </motion.button>
        </div>

        {/* API Tests */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon 
                    icon={faCode} 
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
                  {getStatusIcon(test.status)}
                  <span className="text-sm font-medium">
                    {test.status === 'pending' ? 'รอทดสอบ' :
                     test.status === 'running' ? 'กำลังทดสอบ...' :
                     test.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {test.method} {test.endpoint}
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${test.method} ${test.endpoint}`)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                  </button>
                </div>

                {test.result && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        test.result.status >= 200 && test.result.status < 300
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {test.result.status} {test.result.statusText}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {test.result.duration}ms
                      </span>
                    </div>
                    
                    {test.result.data && (
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                        <pre>{JSON.stringify(test.result.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {test.error && (
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-300">
                    {test.error}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => runTest(test)}
                    disabled={test.status === 'running'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      test.status === 'running'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {test.status === 'running' ? 'กำลังทดสอบ...' : 'รันทดสอบ'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {tests.some(t => t.status !== 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 สรุปผลการทดสอบ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tests.filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">สำเร็จ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tests.filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ล้มเหลว</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tests.filter(t => t.status === 'running').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">กำลังทดสอบ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {tests.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ทั้งหมด</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
