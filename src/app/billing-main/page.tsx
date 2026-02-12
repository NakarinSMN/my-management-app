"use client";

import React from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCarSide,
} from "@fortawesome/free-solid-svg-icons";
import Tooltip from '../components/Tooltip';

function billingmain() {
  interface TooltipProps {
    children: React.ReactNode;
    text: string;     // มั่นใจว่าเป็นตัวพิมพ์เล็ก
    side?: string;    // เพิ่ม ? ถ้าไม่บังคับใส่
  }

  const Tooltip = ({ children, text, side = "right" }: TooltipProps) => {
    return (
      <div className="group relative flex items-center">
        {children}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {text}
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col h-screen max-h-[800px]  overflow-hidden">
      {/* 1. Header: อยู่กับที่ด้านบนเสมอ */}
      <header className="h-16 bg-white rounded-b-3xl border-b flex items-center px-6 shrink-0 z-20">
        <h1 className="font-bold text-xl">My Application</h1>
      </header>

      <div className="flex flex-1 overflow-hidden rounded-br-3xl  rounded-tr-3xl bg-blue-100">
        {/* 2. Sidebar: อยู่กับที่ด้านซ้าย (ไม่เลื่อนตาม content) */}
        <aside className="w-20 bg-white border-r flex flex-col items-center py-6 gap-6 shrink-0">

          {/* หุ้มปุ่มด้วย Tooltip ที่คุณ Import มา */}
          <Tooltip text="จัดการยานพาหนะ" side="right">
            <button
              className='bg-gray-500 p-2 text-xl rounded-lg text-white hover:scale-110 active:scale-95 transition-all shadow-md'
              onClick={() => console.log("Hello World")}
            >
              <FontAwesomeIcon icon={faCarSide} />
            </button>
          </Tooltip>

          {/* ไอคอนอื่นๆ ก็ใช้วิธีเดียวกัน */}
        </aside>

        {/* 3. Main Content: ส่วนเดียวที่จะเลื่อนขึ้น-ลงได้ (Scrollable) */}
        <main className="flex-1 p-6 overflow-y-auto  text-gray-700">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border min-h-[1500px]">
              <h2 className="text-2xl font-semibold mb-4">Main Content Area</h2>
              <p className="text-gray-500">
                ลอง Scroll ส่วนนี้ดูครับ ส่วน Header และ Sidebar จะยังคงอยู่ที่เดิมเสมอ
              </p>
              {/* ใส่เนื้อหาเยอะๆ เพื่อทดสอบการ Scroll */}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default billingmain
