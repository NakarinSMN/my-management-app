// src/lib/api-auth.ts
// Helper functions for API route authentication

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Check if user is authenticated
 * Returns session if authenticated, null otherwise
 */
export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error("Auth session error:", error);
    return null;
  }
}

/**
 * Protect API route - returns 401 if not authenticated
 * Usage: const session = await requireAuth();
 * 
 * ปิดการใช้งานชั่วคราว - อนุญาตให้เข้าถึงได้โดยไม่ต้องล็อกอิน
 */
export async function requireAuth() {
  // ปิดการใช้งาน login ชั่วคราว - return null แทน error
  // TODO: เปิดใช้งานอีกครั้งเมื่อแก้ไขระบบล็อกอินเสร็จ
  // return null; // จะทำให้ API routes ที่ใช้ requireAuth() ต้อง handle null
  
  // หรือ return session ถ้ามี หรือ null ถ้าไม่มี (ไม่ error)
  const session = await getAuthSession();
  return session; // return session หรือ null (ไม่ error)
  
  /* 
  // โค้ดเดิม - เปิดใช้งานเมื่อต้องการเปิดระบบล็อกอินอีกครั้ง
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }

  return session;
  */
}

/**
 * Check if user has admin role
 * Usage: const isAdmin = await checkAdmin();
 */
export async function checkAdmin() {
  const session = await getAuthSession();

  if (!session || !session.user) {
    return false;
  }

  return session.user.role === "admin";
}

/**
 * Require admin role - returns 403 if not admin
 * Usage: const session = await requireAdmin();
 * 
 * ปิดการใช้งานชั่วคราว - อนุญาตให้เข้าถึงได้โดยไม่ต้องล็อกอิน
 */
export async function requireAdmin() {
  // ปิดการใช้งาน login ชั่วคราว - return session หรือ null (ไม่ error)
  // TODO: เปิดใช้งานอีกครั้งเมื่อแก้ไขระบบล็อกอินเสร็จ
  const session = await getAuthSession();
  return session; // return session หรือ null (ไม่ error)
  
  /* 
  // โค้ดเดิม - เปิดใช้งานเมื่อต้องการเปิดระบบล็อกอินอีกครั้ง
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }

  if (session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden - ไม่มีสิทธิ์เข้าถึง" },
      { status: 403 }
    );
  }

  return session;
  */
}

