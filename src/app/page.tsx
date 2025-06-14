"use client"; // เพิ่มบรรทัดนี้ที่ด้านบนสุดของไฟล์

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
// 1. นำเข้า Font Awesome libraries และ icon ที่ต้องการ
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faHandHoldingUsd,
  faUserCircle,
  faBell,
} from "@fortawesome/free-solid-svg-icons"; // ตัวอย่าง icon ที่ใช้

export default function Home() {
  // กำหนด variants สำหรับ animation ของ container (parent)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // กำหนดดีเลย์ระหว่างการแสดงผลของ child components
      },
    },
  };

  // กำหนด variants สำหรับ animation ของ item (child)
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <motion.main
        className="flex flex-col gap-8 items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* ส่วนโลโก้ */}
        <motion.div variants={itemVariants}>
          <Image
            className="mb-4"
            src="/ToRoOo.png"
            alt="Billing System Logo"
            width={200}
            height={42}
            priority
          />
        </motion.div>

        {/* ส่วนคำอธิบาย */}
        <motion.p
          className="text-2xl font-bold tracking-tight"
          variants={itemVariants}
        >
          ระบบจัดการงานบริการ
        </motion.p>
        <motion.h1
          className="text-4xl font-bold tracking-tight"
          variants={itemVariants}
        >
          ตรอ.บังรีท่าอิฐ
        </motion.h1>

        {/* ส่วนปุ่มเมนู */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full max-w-3xl"
          variants={containerVariants}
        >
          {/* แต่ละ MenuButton จะเป็น child ของ motion.div นี้ ดังนั้นจะรับ stagger effect */}
          {/* ส่ง prop icon เพิ่มเติมเข้าไปใน MenuButton */}
          <MenuButton
            href="/dashboard"
            text="แดชบอร์ด"
            icon={faTachometerAlt}
          />
          <MenuButton
            href="/pricing"
            text="ราคางานบริการ"
            icon={faHandHoldingUsd}
          />
          <MenuButton
            href="/customer-info"
            text="ข้อมูลต่อภาษี"
            icon={faUserCircle}
          />
          <MenuButton
            href="/noti-today"
            text="รายการแจ้งเตือนวันนี้"
            icon={faBell}
          />
          {/* สามารถเพิ่มปุ่มเมนูอื่นๆ ได้ตามต้องการ */}
        </motion.div>
      </motion.main>

      {/* Footer สามารถคงไว้หรือปรับเปลี่ยนได้ตามต้องการ */}
      <footer className="mt-16 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Management system. All rights
        reserved..
      </footer>
    </div>
  );
}

// Component สำหรับปุ่มเมนูเพื่อให้โค้ดอ่านง่ายขึ้น
interface MenuButtonProps {
  href: string;
  text: string;
  icon?: any; // เพิ่ม prop สำหรับ icon (ประเภทเป็น 'any' เพื่อความยืดหยุ่น)
}

function MenuButton({ href, text, icon }: MenuButtonProps) {
  // กำหนด variants สำหรับ animation ของ MenuButton (เพื่อให้ปุ่มแต่ละอันมีอนิเมชั่นแยกกัน)
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Link href={href} passHref>
      <motion.div
        className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex items-center justify-center space-x-2" // เพิ่ม space-x-2 เพื่อเว้นระยะระหว่าง icon กับ text
        variants={buttonVariants}
      >
        {/* แสดง icon ถ้ามีการส่ง prop icon เข้ามา */}
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            className="text-blue-600 dark:text-blue-400 text-xl"
          />
        )}
        <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
          {text}
        </span>
      </motion.div>
    </Link>
  );
}
