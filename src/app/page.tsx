// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { motion } from "framer-motion";

// // 1. นำเข้า Font Awesome libraries และ icon ที่ต้องการ
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faTachometerAlt,
//   faHandHoldingUsd,
//   faUserCircle,
//   faBell,
//   faCogs, // ตัวอย่างไอคอนเพิ่มเติมสำหรับ "ตั้งค่า"
//   faChartBar, // ตัวอย่างไอคอนเพิ่มเติมสำหรับ "รายงาน"
// } from "@fortawesome/free-solid-svg-icons";
// import { IconDefinition } from "@fortawesome/fontawesome-svg-core"; // **สำคัญ: นำเข้า IconDefinition**

// export default function Home() {
//   // กำหนด variants สำหรับ animation ของ container (parent)
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     show: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1, // กำหนดดีเลย์ระหว่างการแสดงผลของ child components
//       },
//     },
//   };

//   // กำหนด variants สำหรับ animation ของ item (child)
//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
//       <motion.main
//         className="flex flex-col gap-8 items-center text-center"
//         variants={containerVariants}
//         initial="hidden"
//         animate="show"
//       >
//         {/* ส่วนโลโก้ */}
//         <motion.div variants={itemVariants}>
//           <Image
//             className="mb-4"
//             src="/ToRoOo.png"
//             alt="Billing System Logo"
//             width={200}
//             height={42}
//             priority
//           />
//         </motion.div>

//         {/* ส่วนคำอธิบาย */}
//         <motion.p
//           className="text-2xl font-bold tracking-tight"
//           variants={itemVariants}
//         >
//           ระบบจัดการงานบริการ
//         </motion.p>
//         <motion.h1
//           className="text-4xl font-bold tracking-tight"
//           variants={itemVariants}
//         >
//           ตรอ.บังรีท่าอิฐ
//         </motion.h1>

//         {/* ส่วนปุ่มเมนู */}
//         <motion.div
//           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full max-w-3xl"
//           variants={containerVariants}
//         >
//           {/* แต่ละ MenuButton จะเป็น child ของ motion.div นี้ ดังนั้นจะรับ stagger effect */}
//           {/* ส่ง prop icon เพิ่มเติมเข้าไปใน MenuButton โดยใช้ IconDefinition */}
//           <MenuButton
//             href="/dashboard"
//             text="แดชบอร์ด"
//             icon={faTachometerAlt}
//           />
//           <MenuButton
//             href="/pricing"
//             text="ราคางานบริการ"
//             icon={faHandHoldingUsd}
//           />
//           <MenuButton
//             href="/customer-info"
//             text="ข้อมูลต่อภาษี"
//             icon={faUserCircle}
//           />
//           <MenuButton
//             href="/noti-today"
//             text="รายการแจ้งเตือนวันนี้"
//             icon={faBell}
//           />
//           {/* เพิ่มปุ่มเมนูอื่นๆ ได้ตามต้องการ */}
//           <MenuButton href="/settings" text="ตั้งค่า" icon={faCogs} />
//           <MenuButton href="/reports" text="รายงาน" icon={faChartBar} />
//         </motion.div>
//       </motion.main>

//       {/* Footer สามารถคงไว้หรือปรับเปลี่ยนได้ตามต้องการ */}
//       <footer className="mt-16 text-sm text-gray-600 dark:text-gray-400">
//         &copy; {new Date().getFullYear()} Management system. All rights
//         reserved..
//       </footer>
//     </div>
//   );
// }

// // Component สำหรับปุ่มเมนูเพื่อให้โค้ดอ่านง่ายขึ้น
// interface MenuButtonProps {
//   href: string;
//   text: string;
//   icon?: IconDefinition; // **แก้ไขตรงนี้: เปลี่ยน 'any' เป็น 'IconDefinition'**
// }

// function MenuButton({ href, text, icon }: MenuButtonProps) {
//   // กำหนด variants สำหรับ animation ของ MenuButton (เพื่อให้ปุ่มแต่ละอันมีอนิเมชั่นแยกกัน)
//   const buttonVariants = {
//     hidden: { opacity: 0, y: 20 },
//     show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
//   };

//   return (
//     <Link href={href} passHref>
//       <motion.div
//         className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex items-center justify-center space-x-2" // เพิ่ม space-x-2 เพื่อเว้นระยะระหว่าง icon กับ text
//         variants={buttonVariants}
//       >
//         {/* แสดง icon ถ้ามีการส่ง prop icon เข้ามา */}
//         {icon && (
//           <FontAwesomeIcon
//             icon={icon}
//             className="text-blue-600 dark:text-blue-400 text-xl"
//           />
//         )}
//         <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
//           {text}
//         </span>
//       </motion.div>
//     </Link>
//   );
// }





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
const MotionA = dynamic(() => import('framer-motion').then(mod => mod.motion.a), { ssr: false });


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
          <Link href="/dashboard" passHref>
            {/* **ใช้ MotionA แทน motion.a** */}
            <MotionA
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 text-xl font-semibold"
            >
              เข้าสู่ระบบ
            </MotionA>
          </Link>
        </MotionDiv>
      </MotionMain>

      <footer className="mt-16 text-sm text-gray-600 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Management system. All rights
        reserved.
      </footer>
    </div>
  );
}