// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
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

  // ตรวจสอบ token
  // getToken จะหา cookie อัตโนมัติตามที่ NextAuth config ไว้
  const token = await getToken({ 
    req: request,
    secret: "fallback-secret-key-for-development-only-change-in-production"
  });

  // Debug logging (only in development or if needed)
  if (process.env.NODE_ENV === "development") {
    console.log("[MIDDLEWARE DEBUG]", {
      pathname,
      hasToken: !!token,
      cookies: request.cookies.getAll().map(c => c.name)
    });
  }

  // ถ้าไม่มี token และไม่ใช่หน้า login ให้ redirect ไปหน้า login
  if (!token) {
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

