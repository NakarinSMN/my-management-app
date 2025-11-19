"use client";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // For auth pages, skip animation to avoid issues
  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname}>
        {children}
      </div>
    </AnimatePresence>
  );
} 