import { NextResponse, type NextRequest } from "next/server";

const loginPaths = new Set(["/admin/login", "/caregiver/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Let login pages through without auth
  if (loginPaths.has(pathname)) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isCaregiverRoute = pathname.startsWith("/caregiver");
  const isTicketRoute = pathname.startsWith("/tickets");

  // 2) If it's not one of the protected prefixes, ignore
  if (!isAdminRoute && !isCaregiverRoute && !isTicketRoute) {
    return NextResponse.next();
  }

  const loginRedirect = new URL(
    isAdminRoute ? "/admin/login" : "/caregiver/login",
    req.url,
  );

  const sessionCookie = req.cookies.get("session");

  // 3) No session cookie → straight to login
  if (!sessionCookie) {
    return NextResponse.redirect(loginRedirect);
  }

  try {
    const verifyUrl = new URL("/api/auth/session/validate", req.url);
    const response = await fetch(verifyUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    // 4) Invalid / expired / DB-reset session → clear cookie + send to login
    if (!response.ok) {
      const res = NextResponse.redirect(loginRedirect);
      res.cookies.set("session", "", { maxAge: 0 }); // clear broken session
      return res;
    }

    const payload = (await response.json()) as { role: "admin" | "caregiver" };

    // 5) Role-based redirects
    if (isAdminRoute && payload.role !== "admin") {
      // careviger trying to hit /admin → push them to caregiver dashboard
      return NextResponse.redirect(new URL("/caregiver/dashboard", req.url));
    }

    if (isCaregiverRoute && payload.role !== "caregiver") {
      // admin trying to hit /caregiver → push them to admin home
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (isTicketRoute && payload.role === "admin") {
      // admins hitting public tickets → push to admin tickets
      return NextResponse.redirect(new URL("/admin/tickets", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("middleware auth error", error);
    const res = NextResponse.redirect(loginRedirect);
    res.cookies.set("session", "", { maxAge: 0 }); // also clear on error
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/caregiver/:path*", "/tickets/:path*"],
};
