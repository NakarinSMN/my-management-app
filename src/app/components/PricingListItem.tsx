'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

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
    <div className="group bg-white dark:bg-gray-800 p-4 transition-all duration-200 hover:shadow-md rounded-2xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Icon & Service info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 dark:text-emerald-300 text-sm" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
              {data.serviceName}
            </h3>
            {data.serviceDetails && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {data.serviceDetails}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Price and actions */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Price */}
          <div className="text-right min-w-[100px]">
            <div className="text-lg font-bold text-emerald-400 dark:text-emerald-300">
              ฿{formatPrice(data.servicePrice)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(data)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
              title="แก้ไข"
            >
              <FontAwesomeIcon icon={faEdit} className="text-xs" />
            </button>
            <button
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              title="ลบ"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
