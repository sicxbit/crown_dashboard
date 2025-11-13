import { NextResponse, type NextRequest } from "next/server";

const loginPaths = new Set(["/admin/login", "/caregiver/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (loginPaths.has(pathname)) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isCaregiverRoute = pathname.startsWith("/caregiver");

  if (!isAdminRoute && !isCaregiverRoute) {
    return NextResponse.next();
  }

  const loginRedirect = new URL(isAdminRoute ? "/admin/login" : "/caregiver/login", req.url);
  const sessionCookie = req.cookies.get("session");

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

    if (!response.ok) {
      return NextResponse.redirect(loginRedirect);
    }

    const payload = (await response.json()) as { role: "admin" | "caregiver" };

    if (isAdminRoute && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/caregiver/dashboard", req.url));
    }

    if (isCaregiverRoute && payload.role !== "caregiver") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("middleware auth error", error);
    return NextResponse.redirect(loginRedirect);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/caregiver/:path*"],
};
