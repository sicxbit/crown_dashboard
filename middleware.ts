import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public login routes
  if (pathname === "/admin/login" || pathname === "/caregiver/login") {
    return NextResponse.next();
  }

  // Protect these routes
  const isAdmin = pathname.startsWith("/admin");
  const isCaregiver = pathname.startsWith("/caregiver");
  const isTicket = pathname.startsWith("/tickets");

  if (!isAdmin && !isCaregiver && !isTicket) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("session");

  // No cookie → go to login
  if (!cookie) {
    const loginUrl = new URL(isAdmin ? "/admin/login" : "/caregiver/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists → let the Node server routes validate the session themselves
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/caregiver/:path*", "/tickets/:path*"],
};
