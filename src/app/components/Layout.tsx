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
  faCalendarAlt,
  faAngleLeft,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface MenuItemProps {
  href: string;
  icon: IconDefinition;
  text: string;
  isSidebarOpen: boolean;
}

const SidebarMenuItem: React.FC<MenuItemProps> = ({ href, icon, text }) => {
  const pathname = usePathname();
  const isActive = pathname !== null && pathname.startsWith(href) && (pathname.length === href.length || pathname.charAt(href.length) === '/');

  return (
    <Link
      href={href}
      className={`flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-200
        ${isActive ? "bg-blue-500 text-white dark:bg-blue-700" : ""}
        justify-start`}
      title={text}
    >
      <motion.div whileHover={{ scale: 1.02 }} className="flex items-center w-full">
        <FontAwesomeIcon icon={icon} className="text-xl mr-3" />
        <span className="font-medium text-lg">{text}</span>
      </motion.div>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // sidebar state (mobile เท่านั้น)
  const [isMobile, setIsMobile] = useState(false); // Mobile state
  const [sidebarWidth, setSidebarWidth] = useState(300); // default 300px

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsSidebarOpen(false); // ปิด sidebar เมื่อเข้า mobile
      } else {
        setIsSidebarOpen(true); // เปิด sidebar เมื่อเข้า PC
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // เรียกครั้งแรก
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(window.innerWidth);
    } else {
      setSidebarWidth(300);
    }
  }, [isMobile]);

  const toggleMobileSidebar = () => {
    if (isMobile) setIsSidebarOpen((open) => !open);
  };

  // กำหนดความกว้างของ Sidebar สำหรับ Tailwind CSS
  // w-64 = 256px, w-20 = 80px
  const sidebarWidthClass = isMobile ? 'w-full' : 'w-[300px]';
  
  // ใช้ state isMobile แทนการเช็ค window.innerWidth โดยตรง
  const marginLeftMain = isMobile ? '0px' : '300px'; // 256px = w-64, 80px = w-20

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Overlay for Mobile View when Sidebar is open */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5, display: 'block' }}
          exit={{ opacity: 0, display: 'none' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 bg-black z-30 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar - **นี่คือจุดที่สำคัญ** ให้ Sidebar เป็น fixed และกำหนดความกว้าง */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{
          x: isMobile && !isSidebarOpen ? -sidebarWidth : 0,
          width: isMobile ? (isSidebarOpen ? '100%' : '0%') : '300px'
        }}
        transition={{ 
          duration: 0.4,
          ease: [0.4, 0.0, 0.2, 1], // Custom easing for smoother animation
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className={`fixed top-0 left-0 h-full ${sidebarWidthClass} bg-white dark:bg-gray-800 shadow-lg z-40
          flex flex-col
          lg:flex-shrink-0 lg:overflow-y-auto lg:shadow-none lg:transform-none lg:transition-all lg:duration-300 lg:ease-in-out`}
          // ลบคลาส lg:fixed ออกจาก Sidebar เพราะเราจะใช้ flexbox และ margin-left แทนการ fixed
          // **คำอธิบาย: จริงๆ แล้ว lg:fixed ใน aside ถูกต้องแล้วครับ เพื่อให้มันตรึงอยู่**
          // **ปัญหาคือ div main content ไม่ได้ใช้ margin-left/padding-left ที่ถูกต้องและ dynamic**
          // ผมจะกลับไปใช้ lg:fixed เหมือนเดิมใน aside และแก้ไขที่ main content
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              className="h-8 w-auto"
              src="/ToRoOo.png"
              alt="Billing System Logo"
              width={100}
              height={100}
              priority
            />
          </motion.div>

          {(isMobile || isSidebarOpen) && (
            <motion.h2 
              className="text-lg font-semibold text-gray-700 dark:text-gray-300 ml-4 flex-grow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h2>
          )}
          
          {/* ปุ่มปิดเมนูสำหรับโหมดมือถือ */}
          {isMobile && (
            <motion.button
              onClick={toggleMobileSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
              aria-label="ปิดเมนู"
            >
              <FontAwesomeIcon icon={faAngleLeft} className="text-xl" />
            </motion.button>
          )}
          
          {/* ลบปุ่มย่อ/ขยายสำหรับเดสก์ท็อป */}
          {/* <motion.button
            onClick={toggleDesktopSidebar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:block text-gray-600 dark:text-gray-300 focus:outline-none ml-2 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={isDesktopSidebarExpanded ? faAngleLeft : faAngleRight} className="text-xl" />
          </motion.button> */}
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <SidebarMenuItem
              href="/dashboard"
              icon={faTachometerAlt}
              text="แดชบอร์ด"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/pricing"
              icon={faHandHoldingUsd}
              text="ราคางานบริการ"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/customer-info"
              icon={faUserCircle}
              text="ข้อมูลต่อภาษี"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <motion.h3 
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {(isMobile || isSidebarOpen) ? "ออกบิลเงินสด" : ""}
            </motion.h3>
            <SidebarMenuItem
              href="/billing-main"
              icon={faFileAlt}
              text="ออกบิล"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/history"
              icon={faCalendarAlt}
              text="ประวัติ"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <motion.h3 
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-2 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {(isMobile || isSidebarOpen) ? "ตั้งค่าระบบ" : ""}
            </motion.h3>
            <SidebarMenuItem
              href="/settings"
              icon={faCogs}
              text="ตั้งค่าทั่วไป"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
          </ul>
        </nav>

        <motion.footer 
          className={`p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: (isMobile || isSidebarOpen) ? 1 : 0,
            y: (isMobile || isSidebarOpen) ? 0 : 20
          }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          &copy; {new Date().getFullYear()} Management system.
        </motion.footer>
      </motion.aside>

      {/* Main Content Area - **นี่คือจุดที่สำคัญ** ใช้ marginLeft เพื่อดันเนื้อหาให้พ้น Sidebar */}
      <motion.div
        className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900`}
        animate={{ marginLeft: marginLeftMain }}
        transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1], type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Mobile Header with Menu Button */}
        <motion.header 
          className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            <motion.button
              onClick={toggleMobileSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="เปิดเมนู"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl" />
            </motion.button>
            <motion.h1 
              className="text-lg font-semibold text-gray-700 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </motion.header>
        
        <main className="flex-1 p-5 overflow-y-auto">
          {children} {/* children คือ BillingMainPage ของคุณ */}
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;