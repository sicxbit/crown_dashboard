import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebaseAdmin";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIVE_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 5;

type SessionRequestBody = {
  idToken: string;
};

function parseSessionRequestBody(value: unknown): SessionRequestBody | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.idToken !== "string" || !obj.idToken.trim()) return null;
  return { idToken: obj.idToken };
}

function getAdminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json().catch(() => null);
    const parsed = parseSessionRequestBody(raw);

    if (!parsed) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const { idToken } = parsed;

    const auth = firebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const firebaseUid = decoded.uid;
    const email = decoded.email ? decoded.email.toLowerCase() : null;
    const phoneNumber = decoded.phone_number ?? null;

    const adminAllowlist = getAdminAllowlist();

    // 1) Try to find existing user by firebaseUid
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    // 2) If not found, try by email (legacy email-only records)
    if (!user && email) {
      user = await prisma.user.findFirst({ where: { email } });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid },
        });
      }
    }

    // 3) If still no user, create one
    if (!user) {
      if (phoneNumber) {
        // Caregiver flow: match caregiver by phone
        const caregiver = await prisma.caregiver.findFirst({
          where: { phone: phoneNumber },
        });

        if (!caregiver) {
          return NextResponse.json(
            { error: "Caregiver record not found for this phone number." },
            { status: 404 }
          );
        }

        user = await prisma.user.create({
          data: {
            firebaseUid,
            email,
            role: "caregiver",
            caregiverId: caregiver.id,
          },
        });
      } else if (email) {
        // 🔒 Admin flow — ENV allowlist enforced
        if (!adminAllowlist.has(email)) {
          return NextResponse.json(
            { error: "Access denied: not authorized as admin." },
            { status: 403 }
          );
        }

        user = await prisma.user.create({
          data: {
            firebaseUid,
            email,
            role: "admin",
          },
        });
      } else {
        return NextResponse.json(
          { error: "Unsupported identity token (no email or phone)." },
          { status: 400 }
        );
      }
    } else {
      // 4) Existing user: sync email
      if (email && user.email !== email) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      }

      // Prevent silent privilege escalation
      if (
        user.role === "admin" &&
        email &&
        !adminAllowlist.has(email)
      ) {
        return NextResponse.json(
          { error: "Admin access revoked by policy." },
          { status: 403 }
        );
      }

      // Auto-link caregiver if phone matches
      if (phoneNumber && !user.caregiverId) {
        const caregiver = await prisma.caregiver.findFirst({
          where: { phone: phoneNumber },
        });

        if (caregiver) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              caregiverId: caregiver.id,
              role: "caregiver",
            },
          });
        }
      }
    }

    // 5) Create Firebase session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_IN_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FIVE_DAYS_IN_MS / 1000,
    });

    return NextResponse.json({ status: "ok", role: user.role });
  } catch (error: unknown) {
    console.error("Session creation failed", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return NextResponse.json({ status: "signed_out" });
  } catch (error: unknown) {
    console.error("Failed to clear session cookie", error);
    return NextResponse.json({ error: "Unable to sign out" }, { status: 500 });
  }
}
