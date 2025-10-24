// src/app/components/AdjustCarpetModal.tsx
"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faUndo, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

interface AdjustCarpetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CarpetData {
  id: string;
  licensePlate: string;
  customerName: string;
  currentPeriod: string;
  newPeriod: string;
  status: 'active' | 'expired' | 'pending';
}

export default function AdjustCarpetModal({ isOpen, onClose }: AdjustCarpetModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarpets, setSelectedCarpets] = useState<string[]>([]);
  const [newPeriod, setNewPeriod] = useState('');

  // ข้อมูลตัวอย่าง (ในอนาคตจะดึงจาก API)
  const [carpetData] = useState<CarpetData[]>([
    {
      id: '1',
      licensePlate: 'กข-1234',
      customerName: 'นาย สมชาย ใจดี',
      currentPeriod: '2024-01-01 ถึง 2024-12-31',
      newPeriod: '',
      status: 'active'
    },
    {
      id: '2',
      licensePlate: 'คง-5678',
      customerName: 'นาง สมหญิง รักดี',
      currentPeriod: '2024-03-15 ถึง 2025-03-14',
      newPeriod: '',
      status: 'active'
    },
    {
      id: '3',
      licensePlate: 'จฉ-9012',
      customerName: 'นาย สมศักดิ์ ใจงาม',
      currentPeriod: '2023-06-01 ถึง 2024-05-31',
      newPeriod: '',
      status: 'expired'
    }
  ]);

  const filteredCarpets = carpetData.filter(carpet =>
    carpet.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carpet.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCarpet = (id: string) => {
    setSelectedCarpets(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCarpets.length === filteredCarpets.length) {
      setSelectedCarpets([]);
    } else {
      setSelectedCarpets(filteredCarpets.map(carpet => carpet.id));
    }
  };

  const handleSave = () => {
    // TODO: บันทึกข้อมูลไปยัง API
    console.log('บันทึกการปรับรอบ:', {
      selectedCarpets,
      newPeriod
    });
    alert('บันทึกการปรับรอบเรียบร้อยแล้ว!');
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ใช้งานอยู่';
      case 'expired': return 'หมดอายุ';
      case 'pending': return 'รอดำเนินการ';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ปรับรอบพรบ. ประกันภัย</h2>
              <p className="text-gray-600 dark:text-gray-400">จัดการรอบการต่ออายุประกันภัยรถยนต์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Search and Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาทะเบียนรถหรือชื่อลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedCarpets([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ยกเลิกการเลือก
                </button>
              </div>
            </div>

            {/* New Period Input */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                กำหนดรอบใหม่ (เลือกแล้ว {selectedCarpets.length} รายการ)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSave}
                  disabled={selectedCarpets.length === 0 || !newPeriod}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  บันทึก
                </button>
              </div>
            </div>
          </div>

          {/* Carpet List */}
          <div className="space-y-3">
            {filteredCarpets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                ไม่พบข้อมูลที่ตรงกับการค้นหา
              </div>
            ) : (
              filteredCarpets.map((carpet) => (
                <motion.div
                  key={carpet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCarpets.includes(carpet.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectCarpet(carpet.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedCarpets.includes(carpet.id)}
                          onChange={() => handleSelectCarpet(carpet.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {carpet.licensePlate}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(carpet.status)}`}>
                          {getStatusText(carpet.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        {carpet.customerName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        รอบปัจจุบัน: {carpet.currentPeriod}
                      </p>
                      {carpet.newPeriod && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          รอบใหม่: {carpet.newPeriod}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            เลือกแล้ว {selectedCarpets.length} รายการ
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUndo} />
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCarpets.length === 0 || !newPeriod}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
