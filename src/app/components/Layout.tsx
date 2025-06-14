// src/app/components/Layout.tsx
"use client";

import React, { useState } from "react";
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
  faFileAlt, // For "รายงาน" (Reports)
  faReceipt, // For "รับชำระเงิน" (Payment)
  faCalendarAlt, // For "ประวัติ" (History)
  faUsers, // For "จัดการผู้ใช้งาน" (User Management)
  faAngleLeft, // New: Icon for collapsing sidebar
  faAngleRight, // New: Icon for expanding sidebar
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Interface for MenuItem Props
interface MenuItemProps {
  href: string;
  icon: IconDefinition;
  text: string;
  isSidebarOpen: boolean; // Add prop to know sidebar state
}

// Component for each menu item in the Sidebar
const SidebarMenuItem: React.FC<MenuItemProps> = ({ href, icon, text, isSidebarOpen }) => {
  const pathname = usePathname();
  const isActive = pathname !== null && pathname.startsWith(href) && (pathname.length === href.length || pathname.charAt(href.length) === '/');

  return (
    <Link href={href} passHref>
      <motion.a
        whileHover={{ scale: 1.02 }}
        className={`flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
          isActive ? "bg-blue-500 text-white dark:bg-blue-700" : ""
        } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`} // Adjust justify based on sidebar state
        title={!isSidebarOpen ? text : undefined} // Tooltip for collapsed state
      >
        <FontAwesomeIcon
          icon={icon}
          className={`text-xl ${isSidebarOpen ? 'mr-3' : ''}`} // Remove margin if collapsed
        />
        {isSidebarOpen && <span className="font-medium text-lg">{text}</span>} {/* Show text only if expanded */}
      </motion.a>
    </Link>
  );
};

// Main Layout Component
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // เริ่มต้นให้ Sidebar เปิด (expanded) บน Desktop, ปิด (collapsed) บน Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // สถานะสำหรับ Desktop Collapse: true = Expanded, false = Collapsed
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);

  // Toggle for Mobile Sidebar (Fixed, Overlay)
  const toggleMobileSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle for Desktop Sidebar (Expand/Collapse)
  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarExpanded(!isDesktopSidebarExpanded);
  };

  // Determine current sidebar width for Tailwind classes
  const sidebarWidthClass = isDesktopSidebarExpanded ? 'lg:w-64' : 'lg:w-20'; // 64 = 16rem, 20 = 5rem

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Overlay for Mobile View when Sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: isSidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 h-full ${sidebarWidthClass} bg-white dark:bg-gray-800 shadow-lg z-40
          transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out
          flex flex-col
          lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:shadow-none`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          {/* Logo - Hide text portion when collapsed, show only icon/small logo */}
      
            <Image
              className="h-8 w-auto"
              src="/ToRoOo.png"
              alt="Billing System Logo"
              width={100}
              height={100}
              priority
            />

          {isDesktopSidebarExpanded && ( // Only show "ตรอ.บังรีท่าอิฐ" when expanded
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
              {isDesktopSidebarExpanded ? "ออกบิลเงินสด" : ""} {/* Hide text when collapsed */}
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
              {isDesktopSidebarExpanded ? "ตั้งค่าระบบ" : ""} {/* Hide text when collapsed */}
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

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 `}>
        <main className="flex-1 p-5 overflow-y-auto ">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;