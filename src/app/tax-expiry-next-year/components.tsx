'use client';
import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClock, faCopy, faSpinner, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import { STATUS_COLOR, STATUS_ICON, formatDateFlexible } from '@/utils/customerHelpers';

// Interfaces
export interface TaxExpiryData {
  sequenceNumber?: number;
  licensePlate: string;
  customerName: string;
  phone: string;
  lastTaxDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  brand?: string;
  vehicleType?: string;
  tags?: string[];
}

export interface NotificationStatus {
  [licensePlate: string]: {
    sent: boolean;
    sentAt: string;
  };
}

// --- Stat Card ---
export const StatCard = ({ icon, color, title, value }: any) => {
  const colorMap: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };
  const styleClass = colorMap[color] || colorMap['gray'];
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${styleClass.split(' ')[2]} ${styleClass.split(' ')[0]}`}>
        <FontAwesomeIcon icon={icon} className={`text-sm ${styleClass.split(' ')[1]}`} />
      </div>
    </div>
  );
};

// --- Notification Item Card (ใน Modal) ---
export const NotificationItemCard = memo(function NotificationItemCard({ item, idx, isSelectionMode, isSelected, isCopied, hasCopied, isSending, copiedPhoneIds, onToggleSelection, onCopyPhone, onCopyMessage, onMarkAsSent, onDelete }: any) {
  return (
    <div className={`group bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all duration-200 ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'}`}>
      <div className="flex gap-4">
        {/* Checkbox / Index */}
        <div className="flex flex-col items-center gap-2 pt-1">
          {isSelectionMode ? (
            <button onClick={() => onToggleSelection(item.licensePlate)} className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-transparent hover:border-gray-400'}`}>
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            </button>
          ) : (
            <span className="text-xs font-mono text-gray-400">#{String(idx + 1).padStart(2, '0')}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
            {/* Header: License & Status */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.licensePlate}</h3>
                    <p className="text-sm text-gray-500">{item.customerName}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${item.daysUntilExpiry < 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : item.daysUntilExpiry === 0 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {item.daysUntilExpiry < 0 ? `เกิน ${Math.abs(item.daysUntilExpiry)} วัน` : item.daysUntilExpiry === 0 ? 'วันนี้' : `เหลือ ${item.daysUntilExpiry} วัน`}
                </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm mb-3 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400 text-xs" />
                    <span>ครบกำหนด: {formatDateFlexible(item.expiryDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-500">{item.phone}</span>
                    <button onClick={() => onCopyPhone(item.phone, item.licensePlate)} className="text-gray-400 hover:text-emerald-500 transition-colors" title="คัดลอกเบอร์">
                        <FontAwesomeIcon icon={copiedPhoneIds.has(item.licensePlate) ? faCheck : faCopy} className="text-xs" />
                    </button>
                </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button onClick={() => onCopyMessage(item)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border ${isCopied || hasCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                    <FontAwesomeIcon icon={isCopied || hasCopied ? faCheck : faCopy} /> {isCopied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
                </button>
                <button onClick={() => onMarkAsSent(item.licensePlate)} disabled={!hasCopied || isSending} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border ${isSending ? 'bg-gray-100 text-gray-400 border-gray-200' : hasCopied ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}`}>
                    {isSending ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faCheck} />} {isSending ? 'กำลังบันทึก' : 'ส่งแล้ว'}
                </button>
                <button onClick={() => onDelete(item.licensePlate)} className="w-8 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
});

// --- Table Row ---
export const TaxExpiryRow = memo(function TaxExpiryRow({ item, rowNumber, notificationStatus, isFavorite, onToggleFavorite }: any) {
  const isSent = notificationStatus[item.licensePlate]?.sent;
  return (
    <tr className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <button onClick={() => onToggleFavorite(item.licensePlate)} className="text-gray-300 hover:text-amber-400 transition-colors focus:outline-none">
            <FontAwesomeIcon icon={faStar} className={isFavorite ? 'text-amber-400' : ''} />
          </button>
          <span className="text-xs font-mono text-gray-400">#{String(item.sequenceNumber || rowNumber).padStart(6, '0')}</span>
        </div>
      </td>
      <td className="px-6 py-4"><span className="text-sm font-semibold text-gray-900 dark:text-white block">{item.licensePlate}</span></td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.customerName}</td>
      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.phone}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{formatDateFlexible(item.lastTaxDate)}</td>
      <td className="px-6 py-4"><span className="text-sm font-medium text-gray-900 dark:text-white">{formatDateFlexible(item.expiryDate)}</span></td>
      <td className="px-6 py-4">
        <span className={`text-xs font-bold ${item.daysUntilExpiry < 0 ? 'text-rose-600' : item.daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)} วัน (เกิน)` : item.daysUntilExpiry === 0 ? 'วันนี้' : `${item.daysUntilExpiry} วัน`}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR[item.status] || STATUS_COLOR['รอดำเนินการ']}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'ต่อภาษีแล้ว' ? 'bg-emerald-500' : item.status === 'เกินกำหนด' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
          {item.status}
        </div>
      </td>
      <td className="px-6 py-4">
        {isSent ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
            <FontAwesomeIcon icon={faCheck} /> ส่งแล้ว
          </span>
        ) : <span className="text-gray-300 text-xs">-</span>}
      </td>
    </tr>
  );
});