import "server-only";
import { cookies } from "next/headers";
import { firebaseAdminAuth } from "./firebaseAdmin";
import prisma from "./prisma";

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
    phone: string;
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

// cache comes from react (Next.js server components)
import { cache } from "react";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const decoded = await firebaseAdminAuth().verifySessionCookie(
      sessionCookie.value,
      true
    );

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
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

// 🔹 define a reusable role type instead of inline literal union
export type UserRole = "admin" | "caregiver";

export async function requireApiUserRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
