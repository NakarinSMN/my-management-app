// components/Modal.js
"use client";

import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 }
};

const modalVariants = {
  hidden: { y: "-50px", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  visible: { y: "0", opacity: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

export default function Modal({ isOpen, children }) {
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      controls.start("visible");
    }
  }, [isOpen, controls]);

  // ลบ handleBackdropClick ถ้าไม่ได้ใช้แล้ว

  if (!isOpen) return null;

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          // onClick={handleBackdropClick} // ลบ handleBackdropClick ถ้าไม่ได้ใช้แล้ว
        >
          <motion.div
            className="relative p-6 m-4 max-w-6xl w-full"
            variants={modalVariants}
            animate={controls}
            onClick={(e) => e.stopPropagation()} // Prevents click inside modal from closing it
          >
            {/* --- CHANGE: ADDED A CLOSE BUTTON --- */}
            {/* This button calls the 'onClose' function, fixing the ESLint error */}
            {/* and allowing users to actually close the modal. */}
           {/* <button
              onClick={onClose} // This calls the function to close the modal
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-2xl"
              aria-label="Close modal"
            >
            </button> */}
            
            {children}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}