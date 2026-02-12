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
  faChartColumn,
  faHandHoldingUsd,
  faUserCircle,
  faFileAlt,
  faSheetPlastic,
  faAngleLeft,
  faBars,
  faClock,
  faMoneyBillWave,
  faCashRegister,
  
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useRenewalNotificationCount } from "@/lib/useRenewalNotificationCount";
import { useAuth } from "@/app/contexts/AuthContext";

interface MenuItemProps {
  href: string;
  icon: IconDefinition;
  text: string;
  isSidebarOpen: boolean;
  notificationCount?: number;
}

const SidebarMenuItem: React.FC<MenuItemProps> = ({ href, icon, text, notificationCount = 0 }) => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ใช้ค่า default เพื่อป้องกัน hydration error
  const isActive = isMounted && pathname !== null && pathname.startsWith(href) && (pathname.length === href.length || pathname.charAt(href.length) === '/');
  const hasNotification = notificationCount > 0;

  return (
    <Link
      href={href}
      className={`flex  items-center shadow-lg p-1 mb-3 rounded-full   border-l border-blue-800/50 text-blue-50 transition-all duration-300 group relative 
        ${isActive
          ? "bg-blue-400/15 border-l  border-blue-800/50"
          : "hover:bg-blue-400/10 hover:border-l hover:border-blue-800/50 "
        }
        justify-start`}
      title={text}
      suppressHydrationWarning
    >
      <motion.div

        className="flex items-center w-full"
      >
        <div className={`w-9 h-9  rounded-full flex items-center justify-center transition-all duration-300 relative
          ${isActive
            ? ""
            : ""
          }`}
        >
          <FontAwesomeIcon icon={icon} className="text-lg text-blue-50" />
          {/* Badge แจ้งเตือน */}
          {hasNotification && (
            <>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px]  rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg border border-white dark:border-gray-800">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </>
          )}
        </div>
        <span className=" text-[14px] ml-3 flex-1">{text}</span>
        {/* วงกลมสีแดงที่ข้อความ */}
        {hasNotification && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></div>
        )}
      </motion.div>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // sidebar state (mobile เท่านั้น)
  const [isMobile, setIsMobile] = useState(false); // Mobile state
  const [sidebarWidth, setSidebarWidth] = useState(300); // default 300px
  const [isMounted, setIsMounted] = useState(false); // ป้องกัน hydration error

  // ตรวจสอบว่าอยู่ในหน้า login หรือ register หรือไม่
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const shouldLoadProtectedData = !isAuthPage;
  // ดึงจำนวนแจ้งเตือน
  const { count: renewalNotificationCount } = useRenewalNotificationCount(shouldLoadProtectedData);

  // ดึงข้อมูล user และ auth functions
  // Note: useAuth must always be called (React hook rule)
  const auth = useAuth();
  const user = shouldLoadProtectedData ? auth.user : null;

  useEffect(() => {
    setIsMounted(true); // ตั้งค่า mounted state เมื่อ component mount แล้ว
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

  // ถ้าอยู่ในหน้า login หรือ register ให้ไม่แสดง sidebar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#04091a]">
        {children}
      </div>
    );
  }


  // HTML
  return (

    <div className="flex min-h-screen">

      {/* Overlay for Mobile View */}
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

      {/* Sidebar: เปลี่ยนจาก Gradient เป็นสีพื้นเรียบๆ กลืนกับ Background */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{
          x: isMobile && !isSidebarOpen ? -sidebarWidth : 0,
          width: isMobile ? (isSidebarOpen ? '100%' : '0%') : '300px'
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0.0, 0.2, 1],
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        // ตัด Shadow และ Border ออก เพื่อให้ดู Flat สไตล์ Google
        className={`fixed top-0 left-0 h-full ${sidebarWidthClass} bg-[#04091a] z-40
          flex flex-col
          lg:flex-shrink-0 lg:overflow-y-auto lg:transform-none lg:transition-all lg:duration-300 lg:ease-in-out`}
      >
        {/* Header: เรียบง่าย ไม่มีพื้นหลังสีเขียว */}
        <div className="p-6 flex items-center justify-between">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Logo: เอา Background Gradient ออก หรือปรับให้เรียบขึ้น */}
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                className="h-8 w-auto"
                src="/ToRoOo.png"
                alt="Logo"
                width={100}
                height={100}
                priority
              />
            </div>
          </motion.div>

          {(isMobile || isSidebarOpen) && (
            <motion.h2
              className="text-md  rounded-full bg-blue-700/10 border-l border-blue-800/50 px-5 py-3 text-blue-50 ml-3 flex-grow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h2>
          )}

          {isMobile && (
            <motion.button
              onClick={toggleMobileSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-full text-blue-700/40 hover:text-blue-500/50  transition-colors"
            >
              <FontAwesomeIcon icon={faAngleLeft} className="text-lg" />
            </motion.button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1">


            <SidebarMenuItem
              href="/dashboard"
              icon={faChartColumn}
              text="แดชบอร์ด"
              isSidebarOpen={isMobile || isSidebarOpen}
            />


            <SidebarMenuItem
              href="/pricing"
              icon={faHandHoldingUsd}
              text="ราคางานบริการ"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <div className="my-4 mx-2 border-t border-blue-50/50 dark:border-[#444746]"></div>

            <motion.h3
              className="text-xs  text-blue-50/50 dark:text-[#c4c7c5] uppercase tracking-wider mt-4 mb-2 px-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {(isMobile || isSidebarOpen) ? "ข้อมูลลูกค้า" : ""}
            </motion.h3>

            <SidebarMenuItem
              href="/customer-info"
              icon={faUserCircle}
              text="ข้อมูลต่อภาษี"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/installment-insurance"
              icon={faMoneyBillWave}
              text="ข้อมูลผ่อนประกัน"
              isSidebarOpen={isMobile || isSidebarOpen}
              notificationCount={renewalNotificationCount}
            />

            <div className="my-4 mx-2 border-t border-blue-50/50 dark:border-[#444746]"></div>

            <motion.h3
              className="text-xs  text-blue-50/50 dark:text-[#c4c7c5] uppercase tracking-wider mt-4 mb-2 px-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >{(isMobile || isSidebarOpen) ? "คำนวณ" : ""}</motion.h3>

            <SidebarMenuItem
              href="/adjust-carpet"
              icon={faClock}
              text="ปรับรอบพรบ."
              isSidebarOpen={isMobile || isSidebarOpen}
            />


            <div className="my-4 mx-2 border-t border-blue-50/50 dark:border-[#444746]"></div>

            <motion.h3
              className="text-xs  text-blue-50/50 dark:text-[#c4c7c5] uppercase tracking-wider mt-4 mb-2 px-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >{(isMobile || isSidebarOpen) ? "การเงิน" : ""}</motion.h3>



            <SidebarMenuItem
              href="/billing-main"
              icon={faCashRegister}
              text="ใบเสร็จ"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <div className="my-4 mx-2 border-t border-blue-50/50 dark:border-[#444746]"></div>



            <motion.h3
              className="text-xs  text-blue-50/50 dark:text-[#c4c7c5] uppercase tracking-wider mt-4 mb-2 px-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >{(isMobile || isSidebarOpen) ? "Google Sheet" : ""}</motion.h3>

            <SidebarMenuItem
              href="/coverpage"
              icon={faSheetPlastic}
              text="ใบปะหน้า"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <div className="my-4 mx-2 border-t border-blue-50/50 dark:border-[#444746]"></div>


            {isMounted && (
              <motion.h3
                className="text-xs  text-blue-50/50 dark:text-[#c4c7c5] uppercase tracking-wider mt-4 mb-2 px-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                  x: (isMobile || isSidebarOpen) ? 0 : -20
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {(isMobile || isSidebarOpen) ? "Admin Menu" : ""}
              </motion.h3>
            )}
            {isMounted && (
              <SidebarMenuItem
                href="/devtool"
                icon={faFileAlt}
                text="DevMenu"
                isSidebarOpen={isMobile || isSidebarOpen}
              />
            )}
          </ul>
        </nav>

        <motion.footer
          className={`p-4 text-center text-[10px] text-blue-50/50 dark:text-[#c4c7c5]`}
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

      {/* Main Content: ปรับให้ลอยเป็น Card สีขาว มุมโค้งมน */}
      <motion.div
        className={`flex-1 flex flex-col`}
        // Margin Left ยังคงใช้ Logic เดิม แต่ UI จะดูเหมือน Sidebar แยกตัวออกไป
        animate={{ marginLeft: marginLeftMain }}
        transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1], type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Mobile Header */}
        <motion.header
          className="lg:hidden bg-[#04091a]  p-4 flex items-center justify-between"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              onClick={toggleMobileSidebar}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-blue-900 hover:text-blue-700/50"
            >
              <FontAwesomeIcon icon={faBars} className="text-lg" />
            </motion.button>

            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                className="h-8 w-auto"
                src="/ToRoOo.png"
                alt="Logo"
                width={100}
                height={100}
                priority
              />
            </div>

            <motion.h1
              className="text-md   rounded-full bg-blue-700/10 border-l border-blue-800/50 px-5 py-3 text-blue-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h1>
          </div>
        </motion.header>


        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4">
            {children}
          </div>
        </main>


      </motion.div>
    </div>
  );

};

export default Layout;