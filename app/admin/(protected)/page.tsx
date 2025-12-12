import { addDays, isBefore, isWithinInterval } from "date-fns";
import AdminDashboard from "@/components/admin/AdminDashboard";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  const [clients, caregivers, referrals] = await Promise.all([
    prisma.client.findMany({
      orderBy: { lastName: "asc" },
      include: {
        referral: { select: { id: true, source: true } },
        assignments: {
          where: { isPrimary: true, endDate: null },
          include: {
            caregiver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.caregiver.findMany({
      orderBy: { lastName: "asc" },
      include: {
        compliance: true,
      },
    }),
    prisma.referral.findMany({ orderBy: { source: "asc" } }),
  ]);

  const today = new Date();
  const soon = addDays(today, 30);

  const clientsData = clients.map((client) => ({
    id: client.id,
    code: client.code,
    firstName: client.firstName,
    lastName: client.lastName,
    dob: client.dob?.toISOString() ?? null,
    phone: client.phone,
    email: client.email,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    state: client.state,
    zip: client.zip,
    emergencyName: client.emergencyName,
    emergencyPhone: client.emergencyPhone,
    primaryInsurance: client.primaryInsurance,
    insuranceMemberId: client.insuranceMemberId,
    referralId: client.referralId,
    referralSource: client.referral?.source ?? null,
    assessmentDate: client.assessmentDate?.toISOString() ?? null,
    riskLevel: client.riskLevel,
    status: client.status,
    notes: client.notes,
    primaryCaregiver: client.assignments[0]?.caregiver
      ? `${client.assignments[0]?.caregiver.firstName} ${client.assignments[0]?.caregiver.lastName}`
      : null,
  }));

  const caregiversData = caregivers.map((caregiver) => {
    const expired = caregiver.compliance.filter((item) => {
      if (item.status.toLowerCase() === "expired") {
        return true;
      }
      if (item.expirationDate && isBefore(item.expirationDate, today)) {
        return true;
      }
      return false;
    }).length;

    const expiringSoon = caregiver.compliance.filter((item) => {
      if (!item.expirationDate) return false;
      return isWithinInterval(item.expirationDate, { start: today, end: soon });
    }).length;

    let summary = "All valid";
    if (expired > 0 && expiringSoon > 0) {
      summary = `${expired} expired / ${expiringSoon} expiring soon`;
    } else if (expired > 0) {
      summary = `${expired} expired`;
    } else if (expiringSoon > 0) {
      summary = `${expiringSoon} expiring soon`;
    }

    return {
      id: caregiver.id,
      employeeCode: caregiver.employeeCode,
      firstName: caregiver.firstName,
      lastName: caregiver.lastName,
      dob: caregiver.dateOfBirth?.toISOString() ?? null,
      phone: caregiver.phone,
      email: caregiver.email,
      addressLine1: caregiver.address,
      addressLine2: caregiver.addressLine2,
      city: caregiver.city,
      state: caregiver.state,
      zip: caregiver.zip,
      sandataEvvId: caregiver.sandataEvvId,
      status: caregiver.status,
      complianceSummary: summary,
    };
  });

  return (
    <AdminDashboard
      clients={clientsData}
      caregivers={caregiversData}
      referrals={referrals.map((ref) => ({ id: ref.id, source: ref.source }))}
    />
  );
}
