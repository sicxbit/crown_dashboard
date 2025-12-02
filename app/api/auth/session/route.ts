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

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!user) {
      if (decoded.phone_number) {
        const caregiver = await prisma.caregiver.findFirst({
          where: { phone: decoded.phone_number },
        });

        if (!caregiver) {
          return NextResponse.json(
            { error: "Caregiver record not found for this phone number." },
            { status: 404 }
          );
        }

        user = await prisma.user.create({
          data: {
            firebaseUid: decoded.uid,
            email: decoded.email ?? null,
            role: "caregiver",
            caregiverId: caregiver.id,
          },
        });
      } else if (decoded.email) {
        return NextResponse.json(
          { error: "Admin account is not provisioned." },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: "Unsupported identity token." },
          { status: 400 }
        );
      }
    } else {
      if (decoded.email && user.email !== decoded.email) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email: decoded.email },
        });
      }

      if (decoded.phone_number && !user.caregiverId) {
        const caregiver = await prisma.caregiver.findFirst({
          where: { phone: decoded.phone_number },
        });

        if (caregiver) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { caregiverId: caregiver.id, role: "caregiver" },
          });
        }
      }
    }

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
  } catch (error) {
    console.error("Session creation failed", error);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return NextResponse.json({ status: "signed_out" });
  } catch (error) {
    console.error("Failed to clear session cookie", error);
    return NextResponse.json({ error: "Unable to sign out" }, { status: 500 });
  }
}
