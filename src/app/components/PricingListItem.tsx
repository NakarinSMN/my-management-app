'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCar } from '@fortawesome/free-solid-svg-icons';

interface PricingData {
  _id: string;
  categoryName: string;
  categoryDescription: string;
  serviceName: string;
  servicePrice: number;
  serviceDetails: string;
  createdAt: string;
  updatedAt: string;
}

interface PricingListItemProps {
  data: PricingData;
  onEdit: (data: PricingData) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm?: (id: string, name: string) => void;
}

export default function PricingListItem({ data, onEdit, onDelete, onDeleteConfirm }: PricingListItemProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const handleDelete = () => {
    if (onDeleteConfirm) {
      onDeleteConfirm(data._id, data.serviceName);
    } else {
      onDelete(data._id);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between">
        {/* Left side - Service info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
            <FontAwesomeIcon icon={faCar} className="text-blue-600 dark:text-blue-400 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {data.serviceName}
              </h3>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                {data.categoryName}
              </span>
            </div>
            {data.serviceDetails && (
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {data.serviceDetails}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Price and actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              ฿{formatPrice(data.servicePrice)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ราคาต่อบริการ
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(data)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
              title="แก้ไข"
            >
              <FontAwesomeIcon icon={faEdit} className="text-sm" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
              title="ลบ"
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
