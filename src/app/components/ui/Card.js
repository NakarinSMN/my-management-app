// components/ui/Card.js
'use client'; // <--- ADD THIS LINE AT THE VERY TOP

import { motion } from 'framer-motion';
import { itemVariants } from '../AnimatedPage'; // Import itemVariants for animation

export function Card({ children, title, className = '' }) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full ${className}`} // `h-full` makes card fill available vertical space
      variants={itemVariants} // Each card animates in
    >
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h2>
      )}
      {children}
    </motion.div>
  );
}