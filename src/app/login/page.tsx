// src/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faSignInAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    console.log("[LOGIN DEBUG] Session status changed:", { status, hasSession: !!session, session });
    
    if (status === "authenticated" && session && typeof window !== "undefined") {
      console.log("[LOGIN DEBUG] User already authenticated, redirecting...");
      // Use window.location.search instead of useSearchParams to avoid SSR issues
      const params = new URLSearchParams(window.location.search);
      let callbackUrl = params.get("callbackUrl") || "/dashboard";
      console.log("[LOGIN DEBUG] Callback URL from query:", callbackUrl);
      
      // Decode callbackUrl if needed
      try {
        callbackUrl = decodeURIComponent(callbackUrl);
        console.log("[LOGIN DEBUG] Decoded callback URL:", callbackUrl);
      } catch (error) {
        console.error("[LOGIN DEBUG] Error decoding callback URL:", error);
        callbackUrl = "/dashboard";
      }
      
      // Validate callbackUrl
      if (
        !callbackUrl || 
        !callbackUrl.startsWith("/") ||
        callbackUrl === "/login" || 
        callbackUrl === "/register" || 
        callbackUrl === "/" ||
        callbackUrl.startsWith("/api/")
      ) {
        console.log("[LOGIN DEBUG] Invalid callback URL, using /dashboard");
        callbackUrl = "/dashboard";
      }
      
      console.log("[LOGIN DEBUG] Redirecting to:", callbackUrl);
      // Use window.location.replace for production compatibility
      window.location.replace(callbackUrl);
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("[LOGIN DEBUG] Form submitted, starting login process...");

    try {
      // Get callbackUrl from query string
      let callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
      console.log("[LOGIN DEBUG] Initial callbackUrl from query:", callbackUrl);
      
      // Decode URL if encoded (e.g., %2Fdashboard -> /dashboard)
      if (callbackUrl) {
        try {
          callbackUrl = decodeURIComponent(callbackUrl);
          console.log("[LOGIN DEBUG] Decoded callbackUrl:", callbackUrl);
        } catch (error) {
          console.error("[LOGIN DEBUG] Error decoding callbackUrl:", error);
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
        console.log("[LOGIN DEBUG] Invalid callbackUrl, using /dashboard");
        callbackUrl = "/dashboard";
      }
      
      console.log("[LOGIN DEBUG] Final callbackUrl:", callbackUrl);
      console.log("[LOGIN DEBUG] Calling signIn with:", { username, hasPassword: !!password });
      
      // Use redirect: false to handle redirect manually
      // Don't pass callbackUrl to signIn to avoid NextAuth redirect callback issues
      let result;
      try {
        result = await signIn("credentials", {
          username,
          password,
          redirect: false
        });
        console.log("[LOGIN DEBUG] signIn completed successfully");
      } catch (signInError: unknown) {
        console.error("[LOGIN DEBUG] signIn threw an error:", signInError);
        // ถ้าเกิด error แต่ login อาจสำเร็จแล้ว ให้ redirect ไปเลย (วิธีขั้นสุด)
        const errorMessage = signInError instanceof Error ? signInError.message : String(signInError);
        if (errorMessage.includes("URL") || errorMessage.includes("Invalid")) {
          console.log("[LOGIN DEBUG] URL error detected, redirecting anyway to:", callbackUrl);
          // Redirect ทันที - ไม่ต้องรอ
          window.location.href = callbackUrl;
          return;
        }
        // ถ้า error อื่นๆ ให้แสดง error
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        setIsLoading(false);
        return;
      }

      console.log("[LOGIN DEBUG] signIn result:", result);
      console.log("[LOGIN DEBUG] Result details:", {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
        keys: result ? Object.keys(result) : null
      });

      // Check result and redirect manually - วิธีขั้นสุด
      if (result?.error) {
        console.error("[LOGIN DEBUG] Login failed with error:", result.error);
        setError("Username หรือ Password ไม่ถูกต้อง");
        setIsLoading(false);
      } else {
        // Login สำเร็จ - redirect ทันที (วิธีขั้นสุด)
        // ใช้ result.url ถ้ามี หรือใช้ callbackUrl
        const redirectUrl = result?.url || callbackUrl;
        console.log("[LOGIN DEBUG] Login successful! Redirecting immediately to:", redirectUrl);
        
        // ใช้วิธีที่แน่นอนที่สุด - สร้าง absolute URL
        const absoluteUrl = redirectUrl.startsWith("/") 
          ? `${window.location.origin}${redirectUrl}`
          : redirectUrl;
        
        console.log("[LOGIN DEBUG] Absolute redirect URL:", absoluteUrl);
        
        // Redirect ทันที - ใช้หลายวิธีเพื่อให้แน่ใจว่า redirect ทำงาน
        try {
          // วิธีที่ 1: ใช้ replace (แนะนำ)
          window.location.replace(absoluteUrl);
        } catch (e) {
          console.error("[LOGIN DEBUG] Replace failed, trying href:", e);
          // วิธีที่ 2: ใช้ href (fallback)
          window.location.href = absoluteUrl;
        }
        
        // วิธีที่ 3: ถ้ายังไม่ redirect ให้ force redirect อีกครั้ง
        setTimeout(() => {
          if (window.location.pathname === "/login") {
            console.log("[LOGIN DEBUG] Still on login page, forcing redirect...");
            window.location.href = absoluteUrl;
          }
        }, 1000);
      }
    } catch (error: unknown) {
      console.error("[LOGIN DEBUG] Login error:", error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("[LOGIN DEBUG] Error details:", {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name
      });
      
      // ถ้าเกิด error แต่ login อาจสำเร็จแล้ว ให้ redirect ไปเลย (วิธีขั้นสุด)
      if (errorObj.message.includes("URL") || errorObj.message.includes("Invalid")) {
        console.log("[LOGIN DEBUG] URL error detected, redirecting anyway...");
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
        console.log("[LOGIN DEBUG] Redirecting to:", callbackUrl);
        // Redirect ทันที - ไม่ต้องรอ
        window.location.href = callbackUrl;
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        setIsLoading(false);
      }
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

