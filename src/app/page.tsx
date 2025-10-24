


// src/app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from 'next/dynamic'; // **Import dynamic from next/dynamic**

// **Dynamically import each motion component you use**
// We use ssr: false to ensure these components are only rendered on the client-side
const MotionMain = dynamic(() => import('framer-motion').then(mod => mod.motion.main), { ssr: false });
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const MotionP = dynamic(() => import('framer-motion').then(mod => mod.motion.p), { ssr: false });
const MotionH1 = dynamic(() => import('framer-motion').then(mod => mod.motion.h1), { ssr: false });


export default function LandingPage() {
  // กำหนด variants สำหรับ animation ของ container (parent)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // กำหนด variants สำหรับ animation ของ item (child)
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // เนื่องจากใช้ dynamic import แต่ละ Motion component จะถูกโหลดแยกกัน
  // เราไม่จำเป็นต้องมี if (!MotionComponent) check หรือ const motion = MotionComponent; แล้ว

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* **ใช้ MotionMain แทน motion.main** */}
      <MotionMain
        className="flex flex-col gap-8 items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* **ใช้ MotionDiv แทน motion.div** */}
        <MotionDiv variants={itemVariants}>
          <Image
            className="mb-4"
            src="/ToRoOo.png"
            alt="Billing System Logo"
            width={200}
            height={42}
            priority
          />
        </MotionDiv>

        {/* **ใช้ MotionP แทน motion.p** */}
        <MotionP
          className="text-2xl font-bold tracking-tight"
          variants={itemVariants}
        >
          ยินดีต้อนรับสู่ระบบจัดการงานบริการ
        </MotionP>
        {/* **ใช้ MotionH1 แทน motion.h1** */}
        <MotionH1
          className="text-4xl font-bold tracking-tight"
          variants={itemVariants}
        >
          ตรอ.บังรีท่าอิฐ
        </MotionH1>

        <MotionDiv variants={itemVariants} className="mt-8">
          <MotionDiv
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 text-xl font-semibold"
            >
              เข้าสู่ระบบ
            </Link>
          </MotionDiv>
        </MotionDiv>
      </MotionMain>

      <footer className="mt-16 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Management system. All rights
        reserved.
      </footer>
    </div>
  );
}