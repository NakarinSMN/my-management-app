// src/app/components/CustomerCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faStar, faTag, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CustomerData } from '@/lib/useCustomerData';

interface CustomerCardProps {
  item: CustomerData;
  rowNumber: number;
  onView: (customer: CustomerData) => void;
  isFavorite: boolean;
  onToggleFavorite: (licensePlate: string) => void;
  statusColor: { [key: string]: string };
  statusIcon: { [key: string]: IconDefinition };
  formatDate: (dateStr: string) => string;
}

export default function CustomerCard({ 
  item, 
  rowNumber, 
  onView, 
  isFavorite, 
  onToggleFavorite,
  statusColor,
  statusIcon,
  formatDate
}: CustomerCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-2xl transition-all border border-gray-200 cursor-pointer"
    >
      {/* Header - ลำดับ + Favorite */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.licensePlate);
            }}
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="text-yellow-500 hover:text-yellow-600 transition-colors"
          >
            <FontAwesomeIcon 
              icon={faStar} 
              className={isFavorite ? 'text-yellow-500' : 'text-gray-300'} 
            />
          </motion.button>
          <span className="text-sm font-bold text-emerald-600">
            #{item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : String(rowNumber).padStart(6, '0')}
          </span>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
      </div>

      {/* License Plate + Type */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{item.licensePlate}</span>
          {item.vehicleType && (
            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-medium">
              {item.vehicleType}
            </span>
          )}
        </div>
        {item.brand && (
          <span className="text-sm text-gray-600 dark:text-gray-400">{item.brand}</span>
        )}
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">ชื่อลูกค้า:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.customerName}</span>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">เบอร์โทร:</span>
          <span className="text-sm text-gray-900 dark:text-white">{item.phone}</span>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">ชำระล่าสุด:</span>
          <span className="text-sm text-gray-900 dark:text-white">{formatDate(item.registerDate)}</span>
        </div>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map((tag, index) => (
            <span 
              key={index}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                tag === 'ภาษี' ? 'bg-blue-500 text-white' :
                tag === 'ตรอ.' ? 'bg-green-500 text-white' :
                tag === 'พรบ.' ? 'bg-orange-500 text-white' :
                'bg-gray-500 text-white'
              }`}
            >
              <FontAwesomeIcon icon={faTag} className="text-[9px]" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onView(item);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
      >
        <FontAwesomeIcon icon={faInfoCircle} />
        ดูข้อมูล
      </motion.button>
    </motion.div>
  );
}

