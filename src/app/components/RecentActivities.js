// components/RecentActivities.js


'use client';

import React, { memo } from 'react';

export const RecentActivities = memo(function RecentActivities() {
  const activities = [
    { id: 1, text: "ผู้ใช้ John Doe ลงทะเบียนใหม่", time: "10 นาทีที่แล้ว", type: "new_user" },
    { id: 2, text: "คำสั่งซื้อ #123456 ถูกสร้างขึ้น", time: "30 นาทีที่แล้ว", type: "order" },
    { id: 3, text: "สินค้า 'เสื้อยืด' ถูกอัปเดตราคา", time: "1 ชั่วโมงที่แล้ว", type: "product_update" },
    { id: 4, text: "ผู้ใช้ Jane Smith เข้าสู่ระบบ", time: "2 ชั่วโมงที่แล้ว", type: "login" },
    { id: 5, text: "รายงานรายวันถูกสร้างและส่งออก", time: "เมื่อวานนี้", type: "report" },
    { id: 6, text: "ผู้ใช้ Michael B. อัปเดตโปรไฟล์", time: "เมื่อวานนี้", type: "user_update" },
  ];

  // Helper to get color based on activity type
  const getTypeColor = (type) => {
    switch (type) {
      case 'new_user': return 'text-green-600 dark:text-green-400';
      case 'order': return 'text-blue-600 dark:text-blue-400';
      case 'product_update': return 'text-yellow-600 dark:text-yellow-400';
      case 'login': return 'text-indigo-600 dark:text-indigo-400';
      case 'report': return 'text-purple-600 dark:text-purple-400';
      case 'user_update': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-72"> {/* Added overflow for scrollable list */}
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-150">
          <div className={`flex-shrink-0 w-2 h-2 rounded-full ${getTypeColor(activity.type)} bg-current`}></div>
          <div>
            <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">{activity.text}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">{activity.time}</p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">ยังไม่มีกิจกรรมล่าสุด</p>
      )}
    </div>
  );
});