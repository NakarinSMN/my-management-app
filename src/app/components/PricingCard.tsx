'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

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

interface PricingCardProps {
  data: PricingData;
  onEdit: (data: PricingData) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm?: (id: string, name: string) => void;
}

export default function PricingCard({ data, onEdit, onDelete, onDeleteConfirm }: PricingCardProps) {
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
    <div className="group relative bg-white dark:bg-gray-800 p-5 transition-all duration-300 hover:shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
      {/* Actions - Top Right */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(data)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
          title="แก้ไข"
        >
          <FontAwesomeIcon icon={faEdit} className="text-xs" />
        </button>
        <button
          onClick={handleDelete}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
          title="ลบ"
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </button>
      </div>

      {/* Service Name */}
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
          {data.serviceName}
        </h3>
        {/* Description */}
        {data.serviceDetails && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {data.serviceDetails}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xl font-bold text-purple-500 dark:text-purple-400">
          ฿{formatPrice(data.servicePrice)}
        </div>
      </div>
    </div>
  );
}
