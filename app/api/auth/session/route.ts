import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebaseAdmin";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIVE_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const auth = firebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const firebaseUid = decoded.uid;
    const email = decoded.email ?? null;
    const phoneNumber = decoded.phone_number ?? null;

    // 1️⃣ Try to find existing user by firebaseUid
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    // 2️⃣ If not found, try by email (for legacy email-only records)
    if (!user && email) {
      user = await prisma.user.findFirst({
        where: { email },
      });

      if (user) {
        // attach firebaseUid to legacy user row
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid },
        });
      }
    }

    // 3️⃣ If still no user, we need to create one
    if (!user) {
      if (phoneNumber) {
        // 📱 Caregiver flow: must match a caregiver record by phone
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
        // ✉️ Admin (email-based) flow
        // For now, auto-create admin row for this email.
        // You can tighten this by checking domain or env ADMIN_EMAIL.
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
      // 4️⃣ User existed: keep email up to date
      if (email && user.email !== email) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      }

      // If phone number exists and user isn't linked to a caregiver yet,
      // try to auto-link the caregiver.
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

    // 5️⃣ Create Firebase session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_IN_MS,
    });

    // 🔑 FIX: await cookies()
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
  } catch (error) {
    console.error("Session creation failed", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    // 🔑 FIX: await cookies() here too
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return NextResponse.json({ status: "signed_out" });
  } catch (error) {
    console.error("Failed to clear session cookie", error);
    return NextResponse.json(
      { error: "Unable to sign out" },
      { status: 500 }
    );
  }
}
