import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. ใช้ Named Export เพื่อให้ Next.js มองเห็นได้ชัดเจน
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- ส่วนที่ 1: ยกเว้นเส้นทางที่ไม่ต้องเช็ค Auth ---
  // อนุญาตหน้า Login, Register, และ API Auth
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // อนุญาต Static Files และรูปภาพต่างๆ
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // --- ส่วนที่ 2: ตรวจสอบ Session Cookie ---
  const sessionCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token"
  ];

  // ตรวจสอบว่ามีคุกกี้ตัวใดตัวหนึ่งใน List หรือไม่
  const hasSessionCookie = sessionCookieNames.some((cookieName) =>
    request.cookies.has(cookieName)
  );

  // --- ส่วนที่ 3: จัดการ Redirect ---
  if (!hasSessionCookie) {
    // ถ้าเรียก API ให้ส่ง 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    // ถ้าเข้าหน้าอื่นๆ ให้ Redirect ไปหน้า Login
    const loginUrl = new URL("/login", request.url);
    // แถม: เก็บ URL เดิมไว้ใน callbackUrl เพื่อให้ Login แล้วเด้งกลับมาหน้าเดิมได้
    loginUrl.searchParams.set("callbackUrl", pathname); 
    
    return NextResponse.redirect(loginUrl);
  }

  // ถ้ามี Cookie ครบถ้วน ให้ผ่านไปได้
  return NextResponse.next();
}

// 2. ใช้ Default Export เพื่อให้ Netlify Edge Handler มองเห็น (แก้ Error 'default')
export default middleware;

// 3. กำหนดขอบเขตการทำงาน (Matcher)
export const config = {
  matcher: [
    /*
     * Match ทั้งหมด ยกเว้น:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - ไฟล์รูปภาพใน public
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
