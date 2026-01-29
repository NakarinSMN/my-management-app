import { NextResponse } from "next/server";

function middleware(request: any) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  const sessionCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token"
  ];
  
  const hasSessionCookie = sessionCookieNames.some((cookieName: string) =>
    request.cookies?.has?.(cookieName) || false
  );

  if (!hasSessionCookie) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }
    
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
