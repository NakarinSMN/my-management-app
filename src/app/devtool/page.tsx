// src/app/devtool/page.tsx
"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faDatabase, faCode, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
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
