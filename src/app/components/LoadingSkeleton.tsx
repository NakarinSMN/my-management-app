'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'text';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'card', 
  count = 1,
  className = '' 
}: LoadingSkeletonProps) {
  const shimmer = {
    hidden: { backgroundPosition: '-200% 0' },
    visible: { 
      backgroundPosition: '200% 0',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  };

  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 ${className}`}
    >
      <motion.div
        variants={shimmer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      >
        <div className="h-4 bg-emerald-200 rounded w-3/4"></div>
        <div className="h-4 bg-emerald-200 rounded w-1/2"></div>
        <div className="h-4 bg-emerald-200 rounded w-5/6"></div>
      </motion.div>
    </motion.div>
  );

  const SkeletonTable = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmer}
          initial="hidden"
          animate="visible"
          className="h-12 bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 rounded-lg"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </motion.div>
  );

  const SkeletonList = () => (
    <motion.div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 bg-emerald-50 rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-emerald-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-emerald-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-emerald-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const SkeletonText = () => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-4 bg-emerald-100 rounded w-full animate-pulse"></div>
      ))}
    </div>
  );

  const variants = {
    card: <SkeletonCard />,
    table: <SkeletonTable />,
    list: <SkeletonList />,
    text: <SkeletonText />
  };

  return variants[variant];
}

