// src/app/login/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faSignInAlt, faSpinner, faShieldAlt } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle PIN input change
  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const pinString = newPin.join("");
      if (pinString.length === 6) {
        setTimeout(() => {
          const event = new Event('submit', { bubbles: true, cancelable: true }) as unknown as React.FormEvent;
          handleSubmit(event);
        }, 100);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.match(/\d/g) || [];
    
    if (digits.length === 6) {
      setPin(digits as string[]);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    
    const pinString = pin.join("");
    if (pinString.length !== 6) return;

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        pin: pinString,
        redirect: true,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        throw new Error("Invalid PIN");
      }
    } catch {
      setError("รหัส PIN ไม่ถูกต้อง");
      setIsLoading(false);
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-gray-700 relative z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200/50 dark:shadow-none rotate-3"
          >
            <FontAwesomeIcon icon={faShieldAlt} className="text-white text-3xl" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            ยินดีต้อนรับกลับ
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            กรุณายืนยันตัวตนด้วย PIN 6 หลัก
          </p>
        </div>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          {/* Error Message with Shake Animation */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                // Shake effect keyframes
                key={error} // Important for re-animating on new error
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium text-center border border-red-100 dark:border-red-800 flex items-center justify-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-3 sm:gap-4">
            {pin.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-3xl font-bold rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 transition-all duration-200 outline-none
                  ${error 
                    ? 'border-red-200 bg-red-50/50 text-red-500' 
                    : digit 
                      ? 'border-emerald-500 bg-white dark:bg-gray-700 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]' 
                      : 'border-transparent focus:border-emerald-400 focus:bg-white dark:focus:bg-gray-700'
                  }
                `}
                whileFocus={{ scale: 1.05 }}
                style={{ caretColor: 'transparent' }} // Hide cursor for cleaner look
              />
            ))}
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={isLoading || pin.join("").length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden py-4 px-4 rounded-xl shadow-lg shadow-emerald-200/50 dark:shadow-none text-sm font-bold text-white bg-gray-900 dark:bg-emerald-600 hover:bg-gray-800 dark:hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
                    <span>กำลังตรวจสอบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <FontAwesomeIcon icon={faSignInAlt} />
                  </>
                )}
              </div>
            </motion.button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ลืมรหัส PIN? <button className="text-gray-600 dark:text-gray-300 hover:underline font-medium">ติดต่อผู้ดูแลระบบ</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}