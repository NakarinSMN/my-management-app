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
 */
export async function requireAuth() {
  const session = await getAuthSession();

  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }

  return session;
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
 */
export async function requireAdmin() {
  const session = await getAuthSession();

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
}

