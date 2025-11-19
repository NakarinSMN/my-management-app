// src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faSignInAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
      
      // Decode URL if encoded (e.g., %2Flogi -> /logi)
      if (callbackUrl) {
        try {
          callbackUrl = decodeURIComponent(callbackUrl);
        } catch {
          // If decode fails, use default
          callbackUrl = "/dashboard";
        }
      }
      
      // Prevent redirect loop - ensure callbackUrl is valid
      // Must be a valid page path (starts with /, not empty, not login/register/api)
      if (
        !callbackUrl || 
        !callbackUrl.startsWith("/") ||
        callbackUrl === "/login" || 
        callbackUrl === "/register" || 
        callbackUrl === "/" ||
        callbackUrl.startsWith("/api/") ||
        callbackUrl.includes("?") || // No query params
        callbackUrl.includes("#") // No hash
      ) {
        callbackUrl = "/dashboard";
      }
      
      // Use NextAuth's built-in redirect mechanism
      // This will handle cookie setting and redirect automatically
      // ถ้าเป็น production ให้ redirect ไปที่ production URL
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const productionUrl = isProduction ? window.location.origin : '';
      const finalCallbackUrl = isProduction && productionUrl 
        ? `${productionUrl}/dashboard` 
        : "/dashboard";
      
      const result = await signIn("credentials", {
        username,
        password,
        redirect: true,
        callbackUrl: finalCallbackUrl
      });

      // If redirect is true, signIn will handle redirect automatically
      // This code will only execute if there's an error
      if (result?.error) {
        setError("Username หรือ Password ไม่ถูกต้อง");
        setIsLoading(false);
      }
      // If result?.ok is true, NextAuth will redirect automatically
      // So we don't need to handle it here
    } catch (error) {
      console.error("Login error:", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setIsLoading(false);
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
            <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            เข้าสู่ระบบ
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ระบบจัดการงานบริการ ตรอ.บังรีท่าอิฐ
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username หรือ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="กรอก Username หรือ Email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="กรอก Password"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={isLoading}
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

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

