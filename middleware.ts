// middleware.ts
// Edge-compatible middleware - only uses Edge runtime APIs
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // อนุญาตให้เข้าถึงหน้า login, register, API auth ได้โดยไม่ต้องล็อกอิน
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

  // ตรวจสอบ session cookie โดยตรง (Edge-compatible)
  // เนื่องจาก Edge runtime ไม่สามารถ decode JWT ได้ เราจะเช็คแค่การมีอยู่ของ cookie
  const sessionCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token"
  ];
  
  const allCookies = request.cookies.getAll();
  const hasSessionCookie = sessionCookieNames.some(cookieName =>
    allCookies.some(c => c.name === cookieName)
  );

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    const cookieNames = allCookies.map(c => c.name);
    console.log("[MIDDLEWARE DEBUG]", {
      pathname,
      hasSessionCookie,
      cookies: cookieNames,
    });
  }

  // ถ้าไม่มี session cookie และไม่ใช่หน้า login ให้ redirect ไปหน้า login
  if (!hasSessionCookie) {
    // ไม่ต้องเช็ค callbackUrl - redirect ตรงไปหน้า login
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }
    
    // Redirect ไปหน้า login โดยตรง
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ถ้ามี session cookie ให้ผ่าน
  // หมายเหตุ: การตรวจสอบความถูกต้องของ JWT token จะทำใน API routes หรือ server components แทน
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

