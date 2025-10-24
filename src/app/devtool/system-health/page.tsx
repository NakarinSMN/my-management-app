// src/app/devtool/system-health/page.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faCheckCircle, faTimesCircle, faSpinner, faArrowLeft, faServer, faDatabase, faGlobe, faShield } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  icon: IconDefinition;
  status: 'pending' | 'checking' | 'healthy' | 'unhealthy';
  details?: string;
  lastChecked?: Date;
}

export default function SystemHealthPage() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: 'mongodb-connection',
      name: 'MongoDB Connection',
      description: 'ตรวจสอบการเชื่อมต่อ MongoDB Atlas',
      icon: faDatabase,
      status: 'pending'
    },
    {
      id: 'api-endpoints',
      name: 'API Endpoints',
      description: 'ตรวจสอบ API endpoints หลัก',
      icon: faServer,
      status: 'pending'
    },
    {
      id: 'environment-variables',
      name: 'Environment Variables',
      description: 'ตรวจสอบตัวแปรสภาพแวดล้อม',
      icon: faShield,
      status: 'pending'
    },
    {
      id: 'network-connectivity',
      name: 'Network Connectivity',
      description: 'ตรวจสอบการเชื่อมต่อเครือข่าย',
      icon: faGlobe,
      status: 'pending'
    }
  ]);

  const [isCheckingAll, setIsCheckingAll] = useState(false);

  const runHealthCheck = async (check: HealthCheck) => {
    setHealthChecks(prev => prev.map(h => 
      h.id === check.id ? { ...h, status: 'checking' } : h
    ));

    try {
      let response;
      let data;

      switch (check.id) {
        case 'mongodb-connection':
          response = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'network' })
          });
          data = await response.json();
          break;

        case 'api-endpoints':
          const customersResponse = await fetch('/api/customers');
          const billingResponse = await fetch('/api/billing');
          data = {
            customers: customersResponse.ok,
            billing: billingResponse.ok,
            status: customersResponse.ok && billingResponse.ok
          };
          break;

        case 'environment-variables':
          response = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'environment' })
          });
          data = await response.json();
          break;

        case 'network-connectivity':
          response = await fetch('/api/debug-mongodb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'network' })
          });
          data = await response.json();
          break;

        default:
          throw new Error('Unknown health check');
      }

      const isHealthy = data.success || data.status === true;
      
      setHealthChecks(prev => prev.map(h => 
        h.id === check.id ? {
          ...h,
          status: isHealthy ? 'healthy' : 'unhealthy',
          details: JSON.stringify(data, null, 2),
          lastChecked: new Date()
        } : h
      ));
    } catch (error) {
      setHealthChecks(prev => prev.map(h => 
        h.id === check.id ? {
          ...h,
          status: 'unhealthy',
          details: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date()
        } : h
      ));
    }
  };

  const runAllHealthChecks = async () => {
    setIsCheckingAll(true);
    
    for (const check of healthChecks) {
      await runHealthCheck(check);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsCheckingAll(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FontAwesomeIcon icon={faSpinner} className="text-gray-400" />;
      case 'checking':
        return <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />;
      case 'healthy':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'unhealthy':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
      case 'checking':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      case 'healthy':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'unhealthy':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
    }
  };

  const getOverallStatus = () => {
    const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
    const totalCount = healthChecks.filter(h => h.status !== 'pending').length;
    
    if (totalCount === 0) return 'pending';
    if (healthyCount === totalCount) return 'healthy';
    if (healthyCount === 0) return 'unhealthy';
    return 'partial';
  };

  const overallStatus = getOverallStatus();

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
            <FontAwesomeIcon icon={faHeartbeat} className="mr-3 text-red-600" />
            System Health Monitor
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            ตรวจสอบสถานะระบบและสุขภาพของแอปพลิเคชัน
          </motion.p>
        </div>

        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-8 p-6 rounded-lg border-2 ${
            overallStatus === 'healthy' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
            overallStatus === 'unhealthy' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
            overallStatus === 'partial' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
            'border-gray-200 bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon 
                icon={faHeartbeat} 
                className={`text-3xl ${
                  overallStatus === 'healthy' ? 'text-green-600' :
                  overallStatus === 'unhealthy' ? 'text-red-600' :
                  overallStatus === 'partial' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  สถานะระบบโดยรวม
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {overallStatus === 'healthy' ? 'ระบบทำงานปกติ' :
                   overallStatus === 'unhealthy' ? 'ระบบมีปัญหา' :
                   overallStatus === 'partial' ? 'ระบบมีปัญหาบางส่วน' :
                   'ยังไม่ได้ตรวจสอบ'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthChecks.filter(h => h.status === 'healthy').length} / {healthChecks.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ผ่านการตรวจสอบ
              </div>
            </div>
          </div>
        </motion.div>

        {/* Run All Button */}
        <div className="mb-8">
          <motion.button
            onClick={runAllHealthChecks}
            disabled={isCheckingAll}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isCheckingAll
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            whileHover={{ scale: isCheckingAll ? 1 : 1.02 }}
            whileTap={{ scale: isCheckingAll ? 1 : 0.98 }}
          >
            {isCheckingAll ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faHeartbeat} className="mr-2" />
                ตรวจสอบระบบทั้งหมด
              </>
            )}
          </motion.button>
        </div>

        {/* Health Checks */}
        <div className="space-y-4">
          {healthChecks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(check.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon 
                    icon={check.icon} 
                    className="text-2xl text-gray-600 dark:text-gray-400" 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {check.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {check.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(check.status)}
                  <span className="text-sm font-medium">
                    {check.status === 'pending' ? 'รอตรวจสอบ' :
                     check.status === 'checking' ? 'กำลังตรวจสอบ...' :
                     check.status === 'healthy' ? 'ปกติ' : 'ผิดปกติ'}
                  </span>
                </div>
              </div>

              {check.details && (
                <div className="mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                    <pre>{check.details}</pre>
                  </div>
                </div>
              )}

              {check.lastChecked && (
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  ตรวจสอบล่าสุด: {check.lastChecked.toLocaleString('th-TH')}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => runHealthCheck(check)}
                  disabled={check.status === 'checking'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    check.status === 'checking'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {check.status === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        {healthChecks.some(h => h.status !== 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 สรุปผลการตรวจสอบ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {healthChecks.filter(h => h.status === 'healthy').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ปกติ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {healthChecks.filter(h => h.status === 'unhealthy').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ผิดปกติ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {healthChecks.filter(h => h.status === 'checking').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">กำลังตรวจสอบ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {healthChecks.length}
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
