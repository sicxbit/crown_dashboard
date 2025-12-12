import "server-only";
import { cookies } from "next/headers";
import { firebaseAdminAuth } from "./firebaseAdmin";
import prisma from "./prisma";

// cache comes from react (Next.js server components)
import { cache } from "react";

export type CurrentUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  role: "admin" | "caregiver";
  caregiverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  caregiver?: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    ssnLast4: string | null;
    isActive: boolean;
  } | null;
};

// 🔹 reusable role type
export type UserRole = "admin" | "caregiver";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // 1) Verify Firebase session cookie
    const decoded = await firebaseAdminAuth().verifySessionCookie(
      sessionCookie.value,
      true
    );

    // 2) Ensure we have a DB user for this Firebase UID
    //    - if user exists -> update email
    //    - if user doesn't exist -> create with default role
    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {
        email: decoded.email ?? null,
      },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        // 👇 choose your default role for first-time logins
        role: "caregiver",
      },
      include: {
        caregiver: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role as "admin" | "caregiver",
      caregiverId: user.caregiverId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      caregiver: user.caregiver
        ? {
            id: user.caregiver.id,
            firstName: user.caregiver.firstName,
            middleName: user.caregiver.middleName,
            lastName: user.caregiver.lastName,
            phone: user.caregiver.phone,
            email: user.caregiver.email,
            address: user.caregiver.address,
            city: user.caregiver.city,
            state: user.caregiver.state,
            zip: user.caregiver.zip,
            dateOfBirth: user.caregiver.dateOfBirth,
            gender: user.caregiver.gender,
            ssnLast4: user.caregiver.ssnLast4,
            isActive: user.caregiver.isActive,
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to verify session cookie", error);
    return null;
  }
});

export async function requireApiUserRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
