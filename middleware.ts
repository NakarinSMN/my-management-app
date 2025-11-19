// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // อนุญาตให้เข้าถึงหน้า login, register, API auth และ debug env ได้โดยไม่ต้องล็อกอิน
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // อนุญาตให้เข้าถึง static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // ตรวจสอบ token
  // getToken จะหา cookie อัตโนมัติตามที่ NextAuth config ไว้
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // ถ้าไม่มี token และไม่ใช่หน้า login ให้ redirect ไปหน้า login
  if (!token) {
    // Prevent redirect loop - don't redirect if already on login/register
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    
    // Prevent redirect loop - don't redirect API routes to login (return 401 instead)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }
    
    // Prevent redirect loop - redirect root path to login without callbackUrl
    if (pathname === "/") {
      const loginUrl = new URL("/login", request.url);
      // Don't set callbackUrl for root path to prevent loop
      return NextResponse.redirect(loginUrl);
    }
    
    // For other pages, redirect to login with callbackUrl
    // แต่ถ้ามี callbackUrl อยู่แล้วใน query string ให้ใช้ค่านั้น
    const loginUrl = new URL("/login", request.url);
    const existingCallbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    
    if (existingCallbackUrl) {
      // ถ้ามี callbackUrl อยู่แล้ว (เช่น redirect จาก NextAuth) ให้ใช้ค่านั้น
      loginUrl.searchParams.set("callbackUrl", existingCallbackUrl);
    } else if (
      pathname !== "/login" && 
      pathname !== "/register" && 
      !pathname.startsWith("/api/") &&
      pathname !== "/"
    ) {
      // ถ้าไม่มี callbackUrl ให้ใช้ pathname ปัจจุบัน
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // ถ้ามี token ให้ผ่าน
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

