'use client';

import { motion } from "framer-motion";
import React from "react";

// กำหนด Variants สำหรับอนิเมชั่นของ Container (ตัวครอบทั้งหมด)
// ทำให้ทั้งหน้าค่อยๆ ปรากฏขึ้น และสั่งให้ส่วนประกอบข้างในทยอยแสดงผล
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
  exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
};

// กำหนด Variants สำหรับอนิเมชั่นของ Item (แต่ละชิ้นส่วนในหน้า)
// เรา export ตัวนี้ออกไปเพื่อให้ไฟล์อื่นสามารถนำไปใช้ได้โดยตรง
export const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // เริ่มจากสถานะโปร่งใส และอยู่ต่ำกว่าตำแหน่งจริง 20px
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } }, // ค่อยๆ ชัดขึ้นและเลื่อนขึ้นมายังตำแหน่งจริง
  exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: 'easeInOut' } },
};

// สร้าง Interface สำหรับ Props เพื่อกำหนดว่า Component นี้ต้องรับ children เข้ามา
interface AnimatedPageProps {
  children: React.ReactNode;
}

// นี่คือ Component หลักที่จะถูกนำไปใช้ครอบเนื้อหาของหน้าอื่นๆ
export default function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      // ใช้ motion.div เป็นตัวครอบหลักเพื่อให้สามารถใส่อนิเมชั่นได้
      className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      variants={containerVariants}
      initial="hidden" // กำหนดสถานะเริ่มต้นของอนิเมชั่น
      animate="show"   // กำหนดสถานะเมื่ออนิเมชั่นทำงาน
      exit="exit"    // กำหนดสถานะเมื่อเปลี่ยนหน้าออก (มีประโยชน์เมื่อใช้กับ AnimatePresence)
    >
      <main className="flex flex-col gap-8 items-center text-center w-full">
        {/* แสดงผล "children" หรือเนื้อหาของหน้าที่ถูกส่งเข้ามา */}
        {children}
      </main>
    </motion.div>
  );
}
