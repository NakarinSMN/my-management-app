// src/components/icons/customer-icon.tsx
import React from 'react';

// นี่คือตัวอย่างของ CustomerIcon แบบง่ายๆ
// คุณสามารถเปลี่ยนไปใช้ SVG หรือ icon component อื่นๆ ตามที่คุณต้องการ
export function CustomerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// หรือถ้าใช้ FontAwesomeIcon เป็น CustomerIcon
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faUser } from '@fortawesome/free-solid-svg-icons'; // หรือไอคอนที่คุณต้องการ
// export function CustomerIcon(props: any) {
//   return <FontAwesomeIcon icon={faUser} {...props} />;
// }