// components/AnimatedPage.js
"use client";

import { motion } from 'framer-motion';

// Variants for the main container (parent)
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger children animations by 0.1 seconds
      delayChildren: 0.2,   // Add a small delay before children start animating
    },
  },
  exit: { opacity: 0, transition: { duration: 0.5 } } // For page exit transitions
};

// Variants for individual items (children) within the page
export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100, // Controls the "springiness" of the animation
      damping: 10,    // Controls the "bounciness" of the animation
    },
  },
};

export default function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // Classes to make the page fill the screen and center content
      className="flex flex-col flex-grow p-8 w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
    >
      <div className="max-w-7xl mx-auto w-full"> {/* Container to limit content width and center it */}
        {children}
      </div>
    </motion.div>
  );
}