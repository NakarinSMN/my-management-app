// src/app/devtool/data-migration/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faUpload, faCheckCircle, faTimesCircle, faSpinner, faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MigrationTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
}

export default function DataMigrationPage() {
  const [tasks, setTasks] = useState<MigrationTask[]>([
    {
      id: 'migrate-customers',
      name: 'Migrate Customers',
      description: 'ย้ายข้อมูลลูกค้าจาก Google Sheets ไป MongoDB',
      status: 'pending',
      progress: 0
    },
    {
      id: 'migrate-billing',
      name: 'Migrate Billing',
      description: 'ย้ายข้อมูลบิลจาก Google Sheets ไป MongoDB',
      status: 'pending',
      progress: 0
    },
    {
      id: 'verify-data',
      name: 'Verify Data',
      description: 'ตรวจสอบความถูกต้องของข้อมูลที่ย้าย',
      status: 'pending',
      progress: 0
    }
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const runMigrationTask = async (task: MigrationTask) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'running', progress: 0 } : t
    ));

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress: i } : t
        ));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      let response;
      if (task.id === 'migrate-customers') {
        response = await fetch('/api/migrate-customers', { method: 'POST' });
      } else if (task.id === 'migrate-billing') {
        response = await fetch('/api/migrate-billing', { method: 'POST' });
      } else if (task.id === 'verify-data') {
        response = await fetch('/api/verify-data', { method: 'POST' });
      }

      if (response && response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(t => 
          t.id === task.id ? {
            ...t,
            status: 'success',
            progress: 100,
            result: data
          } : t
        ));
      } else {
        throw new Error('Migration failed');
      }
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t.id === task.id ? {
          ...t,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        } : t
      ));
    }
  };

  const runAllMigrations = async () => {
    setIsRunningAll(true);
    
    for (const task of tasks) {
      await runMigrationTask(task);
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
            <FontAwesomeIcon icon={faDatabase} className="mr-3 text-emerald-600" />
            Data Migration Tool
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ย้ายข้อมูลระหว่างระบบและตรวจสอบความถูกต้อง
          </motion.p>
        </div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ คำเตือน
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                การย้ายข้อมูลจะลบข้อมูลเก่าใน MongoDB และแทนที่ด้วยข้อมูลใหม่จาก Google Sheets
              </p>
            </div>
          </div>
        </motion.div>

        {/* Run All Button */}
        <div className="mb-8">
          <motion.button
            onClick={runAllMigrations}
            disabled={isRunningAll}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunningAll
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            whileHover={{ scale: isRunningAll ? 1 : 1.02 }}
            whileTap={{ scale: isRunningAll ? 1 : 0.98 }}
          >
            {isRunningAll ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                กำลังย้ายข้อมูล...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                เริ่มย้ายข้อมูลทั้งหมด
              </>
            )}
          </motion.button>
        </div>

        {/* Migration Tasks */}
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(task.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon 
                    icon={faDatabase} 
                    className="text-2xl text-gray-600 dark:text-gray-400" 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {task.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {task.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium">
                    {task.status === 'pending' ? 'รอย้ายข้อมูล' :
                     task.status === 'running' ? 'กำลังย้ายข้อมูล...' :
                     task.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {task.status === 'running' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {task.result && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-300">
                  <pre>{JSON.stringify(task.result, null, 2)}</pre>
                </div>
              )}

              {task.error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-300">
                  {task.error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => runMigrationTask(task)}
                  disabled={task.status === 'running'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    task.status === 'running'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {task.status === 'running' ? 'กำลังย้ายข้อมูล...' : 'รันย้ายข้อมูล'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {tasks.some(t => t.status !== 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 สรุปผลการย้ายข้อมูล
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">สำเร็จ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ล้มเหลว</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'running').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">กำลังย้ายข้อมูล</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {tasks.length}
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
