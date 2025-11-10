// src/app/components/TaxExpiryCard.tsx
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCheck, faClock, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface TaxExpiryData {
  sequenceNumber?: number;
  licensePlate: string;
  customerName: string;
  phone: string;
  lastTaxDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
}

interface NotificationStatus {
  [licensePlate: string]: {
    sent: boolean;
    sentAt: string;
  };
}

interface TaxExpiryCardProps {
  item: TaxExpiryData;
  rowNumber: number;
  notificationStatus: NotificationStatus;
  isFavorite: boolean;
  onToggleFavorite: (licensePlate: string) => void;
  statusColor: { [key: string]: string };
  statusIcon: { [key: string]: IconDefinition };
  formatDate: (dateStr: string, useBuddhistYear?: boolean) => string;
}

export default function TaxExpiryCard({ 
  item, 
  rowNumber, 
  notificationStatus,
  isFavorite, 
  onToggleFavorite,
  statusColor,
  statusIcon,
  formatDate
}: TaxExpiryCardProps) {
  const isSent = notificationStatus[item.licensePlate]?.sent || false;
  const sentAt = notificationStatus[item.licensePlate]?.sentAt;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      {/* Header - ลำดับ + Favorite + Days */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(item.licensePlate)}
            className="text-yellow-500 hover:text-yellow-600 transition-colors"
          >
            <FontAwesomeIcon 
              icon={faStar} 
              className={isFavorite ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} 
            />
          </button>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            #{item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : String(rowNumber).padStart(6, '0')}
          </span>
        </div>
        <span className={`text-sm font-bold ${
          item.daysUntilExpiry < 0 ? 'text-red-600 dark:text-red-400' :
          item.daysUntilExpiry <= 30 ? 'text-orange-600 dark:text-orange-400' :
          item.daysUntilExpiry <= 90 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)} วัน (เกินกำหนด)` :
            item.daysUntilExpiry === 0 ? 'วันนี้' :
            `${item.daysUntilExpiry} วัน`}
        </span>
      </div>

      {/* License Plate */}
      <div className="mb-3">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{item.licensePlate}</span>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">ชื่อลูกค้า:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.customerName}</span>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">เบอร์โทร:</span>
          <span className="text-sm text-gray-900 dark:text-white">{item.phone}</span>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">ชำระล่าสุด:</span>
          <span className="text-sm text-gray-900 dark:text-white">{formatDate(item.lastTaxDate)}</span>
        </div>
        <div className="flex items-start">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">ภาษีครั้งถัดไป:</span>
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{formatDate(item.expiryDate)}</span>
        </div>
      </div>

      {/* Status + Notification */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
        
        {isSent ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
            <FontAwesomeIcon icon={faCheck} className="mr-1" />
            ส่งแล้ว
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            ยังไม่ส่ง
          </span>
        )}
      </div>
    </div>
  );
}

