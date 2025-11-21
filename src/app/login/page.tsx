// src/app/login/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faSignInAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle PIN input change
  const handlePinChange = (index: number, value: string) => {
    // อนุญาตเฉพาะตัวเลข
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // Auto focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit เมื่อกรอกครบ 6 หลัก
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
    if (pinString.length !== 6) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        pin: pinString,
        redirect: true,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        setError("PIN ไม่ถูกต้อง");
        setIsLoading(false);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("PIN ไม่ถูกต้อง");
      setIsLoading(false);
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mb-4"
          >
            <FontAwesomeIcon icon={faLock} className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            เข้าสู่ระบบ
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            กรุณากรอก PIN 6 หลัก
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                PIN 6 หลัก
              </label>
              <div className="flex justify-center gap-3">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-3xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    style={{
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={isLoading || pin.join("").length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} />
                  เข้าสู่ระบบ
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


