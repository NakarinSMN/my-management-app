// src/app/components/Layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Font Awesome Imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faHandHoldingUsd,
  faUserCircle,
  faCogs,
  faFileAlt,
  faReceipt,
  faCalendarAlt,
  faUsers,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface MenuItemProps {
  href: string;
  icon: IconDefinition;
  text: string;
  isSidebarOpen: boolean;
}

const SidebarMenuItem: React.FC<MenuItemProps> = ({ href, icon, text, isSidebarOpen }) => {
  const pathname = usePathname();
  const isActive = pathname !== null && pathname.startsWith(href) && (pathname.length === href.length || pathname.charAt(href.length) === '/');

  return (
    <Link href={href} passHref>
      <motion.a
        whileHover={{ scale: 1.02 }}
        className={`flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
          isActive ? "bg-blue-500 text-white dark:bg-blue-700" : ""
        } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
        title={!isSidebarOpen ? text : undefined}
      >
        <FontAwesomeIcon
          icon={icon}
          className={`text-xl ${isSidebarOpen ? 'mr-3' : ''}`}
        />
        {isSidebarOpen && <span className="font-medium text-lg">{text}</span>}
      </motion.a>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile sidebar state
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true); // Desktop collapse state

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // ต่ำกว่า lg breakpoint (1024px)
        setIsDesktopSidebarExpanded(false); // บังคับให้ยุบใน mobile/tablet
        setIsSidebarOpen(false); // ปิด sidebar overlay ใน mobile
      } else {
        setIsSidebarOpen(true); // เปิด sidebar ใน desktop
        // รักษาสถานะ expanded/collapsed เดิมไว้สำหรับ desktop
      }
    };

    handleResize(); // เรียกครั้งแรกตอน mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarExpanded(!isDesktopSidebarExpanded);
  };

  // กำหนดความกว้างของ Sidebar สำหรับ Tailwind CSS
  // w-64 = 256px, w-20 = 80px
  const sidebarWidthClass = isDesktopSidebarExpanded ? 'w-64' : 'w-20';
  const marginLeftMain = isDesktopSidebarExpanded ? '256px' : '80px'; // ค่าเป็น pixel สำหรับ style attribute

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Overlay for Mobile View when Sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Sidebar - **นี่คือจุดที่สำคัญ** ให้ Sidebar เป็น fixed และกำหนดความกว้าง */}
      <motion.aside
        initial={{ x: -250 }} // Mobile animation
        animate={{ x: isSidebarOpen ? 0 : -250 }} // Mobile animation
        transition={{ duration: 0.3 }}
        // ใช้ classname สำหรับความกว้าง (w-64/w-20)
        // ใช้ fixed เพื่อตรึง
        // ใช้ flex-shrink-0 เพื่อให้มันไม่หดตัว
        className={`fixed top-0 left-0 h-full ${sidebarWidthClass} bg-white dark:bg-gray-800 shadow-lg z-40
          transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out
          flex flex-col
          lg:flex-shrink-0 lg:overflow-y-auto lg:shadow-none lg:transform-none lg:transition-all lg:duration-300 lg:ease-in-out`}
          // ลบคลาส lg:fixed ออกจาก Sidebar เพราะเราจะใช้ flexbox และ margin-left แทนการ fixed
          // **คำอธิบาย: จริงๆ แล้ว lg:fixed ใน aside ถูกต้องแล้วครับ เพื่อให้มันตรึงอยู่**
          // **ปัญหาคือ div main content ไม่ได้ใช้ margin-left/padding-left ที่ถูกต้องและ dynamic**
          // ผมจะกลับไปใช้ lg:fixed เหมือนเดิมใน aside และแก้ไขที่ main content
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <Image
            className="h-8 w-auto"
            src="/ToRoOo.png"
            alt="Billing System Logo"
            width={100}
            height={100}
            priority
          />

          {isDesktopSidebarExpanded && (
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 ml-4 flex-grow">
              ตรอ.บังรีท่าอิฐ
            </h2>
          )}
          <button
            onClick={toggleDesktopSidebar}
            className="lg:block text-gray-600 dark:text-gray-300 focus:outline-none ml-2"
          >
            <FontAwesomeIcon icon={isDesktopSidebarExpanded ? faAngleLeft : faAngleRight} className="text-xl" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <SidebarMenuItem
              href="/dashboard"
              icon={faTachometerAlt}
              text="แดชบอร์ด"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <SidebarMenuItem
              href="/pricing"
              icon={faHandHoldingUsd}
              text="ราคางานบริการ"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <SidebarMenuItem
              href="/customer-info"
              icon={faUserCircle}
              text="ข้อมูลต่อภาษี"
              isSidebarOpen={isDesktopSidebarExpanded}
            />

            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3">
              {isDesktopSidebarExpanded ? "ออกบิลเงินสด" : ""}
            </h3>
            <SidebarMenuItem
              href="/billing-main"
              icon={faFileAlt}
              text="ออกบิล"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <SidebarMenuItem
              href="/payment"
              icon={faReceipt}
              text="รับชำระเงิน"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <SidebarMenuItem
              href="/history"
              icon={faCalendarAlt}
              text="ประวัติ"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3">
              {isDesktopSidebarExpanded ? "ตั้งค่าระบบ" : ""}
            </h3>
            <SidebarMenuItem
              href="/settings"
              icon={faCogs}
              text="ตั้งค่าทั่วไป"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
            <SidebarMenuItem
              href="/user-management"
              icon={faUsers}
              text="จัดการผู้ใช้งาน"
              isSidebarOpen={isDesktopSidebarExpanded}
            />
          </ul>
        </nav>

        <footer className={`p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 ${isDesktopSidebarExpanded ? '' : 'hidden'}`}>
          &copy; {new Date().getFullYear()} Management system.
        </footer>
      </motion.aside>

      {/* Main Content Area - **นี่คือจุดที่สำคัญ** ใช้ marginLeft เพื่อดันเนื้อหาให้พ้น Sidebar */}
      <div
        className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300 ease-in-out`}
        // **ใช้ marginLeftDynamic ที่นี่**
        style={{ marginLeft: marginLeftMain }}
      >
        <main className="flex-1 p-5 overflow-y-auto">
          {children} {/* children คือ BillingMainPage ของคุณ */}
        </main>
      </div>
    </div>
  );
};

export default Layout;