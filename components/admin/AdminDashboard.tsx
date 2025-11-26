"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type AdminClient = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  primaryInsurance: string | null;
  insuranceMemberId: string | null;
  referralId: string | null;
  referralSource: string | null;
  assessmentDate: string | null;
  riskLevel: string | null;
  status: string;
  notes: string | null;
  primaryCaregiver: string | null;
};

export type AdminCaregiver = {
  id: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  sandataEvvId: string | null;
  status: string;
  complianceSummary: string;
};

export type ReferralOption = {
  id: string;
  source: string;
};

type Props = {
  clients: AdminClient[];
  caregivers: AdminCaregiver[];
  referrals: ReferralOption[];
};

const inputClasses =
  "w-full rounded-md border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

const labelClasses = "text-sm font-medium text-slate-700";

function formatDateInput(value: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

const createEmptyClient = (): AdminClient => ({
  id: "",
  code: "",
  firstName: "",
  lastName: "",
  dob: null,
  phone: null,
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  zip: null,
  emergencyName: null,
  emergencyPhone: null,
  primaryInsurance: null,
  insuranceMemberId: null,
  referralId: null,
  referralSource: null,
  assessmentDate: null,
  riskLevel: null,
  status: "active",
  notes: null,
  primaryCaregiver: null,
});

const createEmptyCaregiver = (): AdminCaregiver => ({
  id: "",
  employeeCode: null,
  firstName: "",
  lastName: "",
  dob: null,
  phone: null,
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  zip: null,
  sandataEvvId: null,
  status: "active",
  complianceSummary: "",
});

export default function AdminDashboard({ clients, caregivers, referrals }: Props) {
  const router = useRouter();
  const [editingClient, setEditingClient] = useState<AdminClient | null>(null);
  const [editingCaregiver, setEditingCaregiver] = useState<AdminCaregiver | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      ),
    [clients]
  );

  const sortedCaregivers = useMemo(
    () =>
      [...caregivers].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      ),
    [caregivers]
  );

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleClientSave = async (data: AdminClient) => {
    setIsSaving(true);
    setError(null);
    const isNew = !data.id;

    try {
      const response = await fetch(
        isNew ? `/api/admin/clients` : `/api/admin/clients/${data.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: data.code,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            phone: data.phone,
            email: data.email,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            zip: data.zip,
            emergencyName: data.emergencyName,
            emergencyPhone: data.emergencyPhone,
            primaryInsurance: data.primaryInsurance,
            insuranceMemberId: data.insuranceMemberId,
            referralId: data.referralId,
            assessmentDate: data.assessmentDate,
            riskLevel: data.riskLevel,
            status: data.status,
            notes: data.notes,
          }),
        }
      );

      if (!response.ok) {
        let message = "Unable to save client";

        try {
          const payload = await response.json();
          if (payload && typeof payload === "object" && "error" in payload) {
            message = (payload as any).error ?? message;
          }
        } catch {
          // ignore JSON parse failure and keep default message
        }

        throw new Error(message);
      }

      setEditingClient(null);
      refresh();
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };


  const handleCaregiverSave = async (data: AdminCaregiver) => {
    setIsSaving(true);
    setError(null);
    const isNew = !data.id;

    try {
      const response = await fetch(
        isNew ? `/api/admin/caregivers` : `/api/admin/caregivers/${data.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeCode: data.employeeCode,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            phone: data.phone,
            email: data.email,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            zip: data.zip,
            sandataEvvId: data.sandataEvvId,
            status: data.status,
          }),
        }
      );

      if (!response.ok) {
        let message = "Unable to save caregiver";

        try {
          const payload = await response.json();
          if (payload && typeof payload === "object" && "error" in payload) {
            message = (payload as any).error ?? message;
          }
        } catch {
          // response body not JSON or empty – ignore and use default message
        }

        throw new Error(message);
      }

      setEditingCaregiver(null);
      refresh();
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">
          Welcome back! Review client and caregiver records and keep information current.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Clients */}
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Clients</h2>
              <p className="text-sm text-slate-500">
                Click a client row to view and edit details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingClient(createEmptyClient());
                setError(null);
              }}
              className="rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
            >
              + New Client
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-semibold text-slate-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">City / State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Primary Caregiver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="cursor-pointer transition hover:bg-brand-50"
                    onClick={() => {
                      setEditingClient(client);
                      setError(null);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {client.firstName} {client.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{client.code}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.city}, {client.state}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{client.riskLevel ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {client.primaryCaregiver ?? "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Caregivers */}
        <div className="rounded-xl bg-white shadow">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Caregivers</h2>
              <p className="text-sm text-slate-500">
                Review staffing readiness and compliance status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCaregiver(createEmptyCaregiver());
                setError(null);
              }}
              className="rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
            >
              + New Caregiver
            </button>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-semibold text-slate-600">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Employee Code</th>
                  <th className="px-4 py-3">City / State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sandata EVV ID</th>
                  <th className="px-4 py-3">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedCaregivers.map((caregiver) => (
                  <tr
                    key={caregiver.id}
                    className="cursor-pointer transition hover:bg-brand-50"
                    onClick={() => {
                      setEditingCaregiver(caregiver);
                      setError(null);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {caregiver.firstName} {caregiver.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {caregiver.employeeCode ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {caregiver.city}, {caregiver.state}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {caregiver.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {caregiver.sandataEvvId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {caregiver.complianceSummary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {editingClient && (
        <ClientEditModal
          client={editingClient}
          referrals={referrals}
          onClose={() => setEditingClient(null)}
          onSave={handleClientSave}
          isSaving={isSaving || isRefreshing}
        />
      )}

      {editingCaregiver && (
        <CaregiverEditModal
          caregiver={editingCaregiver}
          onClose={() => setEditingCaregiver(null)}
          onSave={handleCaregiverSave}
          isSaving={isSaving || isRefreshing}
        />
      )}
    </main>
  );
}

type ClientModalProps = {
  client: AdminClient;
  referrals: ReferralOption[];
  onClose: () => void;
  onSave: (client: AdminClient) => Promise<void>;
  isSaving: boolean;
};

function ClientEditModal({ client, referrals, onClose, onSave, isSaving }: ClientModalProps) {
  const [form, setForm] = useState<AdminClient>(client);
  const isNew = !client.id;

  const updateField = <K extends keyof AdminClient>(key: K, value: AdminClient[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">
            {isNew ? "New Client" : "Edit Client"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          <div className="md:col-span-2">
            <label className={labelClasses}>Client Code</label>
            <input
              className={inputClasses}
              value={form.code}
              onChange={(event) => updateField("code", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>First Name</label>
            <input
              className={inputClasses}
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>Last Name</label>
            <input
              className={inputClasses}
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>Date of Birth</label>
            <input
              type="date"
              className={inputClasses}
              value={formatDateInput(form.dob)}
              onChange={(event) => updateField("dob", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Phone</label>
            <input
              className={inputClasses}
              value={form.phone ?? ""}
              onChange={(event) => updateField("phone", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              className={inputClasses}
              value={form.email ?? ""}
              onChange={(event) => updateField("email", event.target.value || null)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Address Line 1</label>
            <input
              className={inputClasses}
              value={form.addressLine1 ?? ""}
              onChange={(event) => updateField("addressLine1", event.target.value || null)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Address Line 2</label>
            <input
              className={inputClasses}
              value={form.addressLine2 ?? ""}
              onChange={(event) => updateField("addressLine2", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>City</label>
            <input
              className={inputClasses}
              value={form.city ?? ""}
              onChange={(event) => updateField("city", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>State</label>
            <input
              className={inputClasses}
              value={form.state ?? ""}
              onChange={(event) => updateField("state", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>ZIP</label>
            <input
              className={inputClasses}
              value={form.zip ?? ""}
              onChange={(event) => updateField("zip", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Emergency Contact</label>
            <input
              className={inputClasses}
              value={form.emergencyName ?? ""}
              onChange={(event) => updateField("emergencyName", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Emergency Phone</label>
            <input
              className={inputClasses}
              value={form.emergencyPhone ?? ""}
              onChange={(event) => updateField("emergencyPhone", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Primary Insurance</label>
            <input
              className={inputClasses}
              value={form.primaryInsurance ?? ""}
              onChange={(event) => updateField("primaryInsurance", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Insurance Member ID</label>
            <input
              className={inputClasses}
              value={form.insuranceMemberId ?? ""}
              onChange={(event) => updateField("insuranceMemberId", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Referral</label>
            <select
              className={inputClasses}
              value={form.referralId ?? ""}
              onChange={(event) => updateField("referralId", event.target.value || null)}
            >
              <option value="">No referral</option>
              {referrals.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.source}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Assessment Date</label>
            <input
              type="date"
              className={inputClasses}
              value={formatDateInput(form.assessmentDate)}
              onChange={(event) =>
                updateField("assessmentDate", event.target.value || null)
              }
            />
          </div>
          <div>
            <label className={labelClasses}>Risk Level</label>
            <input
              className={inputClasses}
              value={form.riskLevel ?? ""}
              onChange={(event) => updateField("riskLevel", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Status</label>
            <input
              className={inputClasses}
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Notes</label>
            <textarea
              className={`${inputClasses} min-h-[80px]`}
              value={form.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value || null)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {isSaving ? "Saving..." : isNew ? "Create Client" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type CaregiverModalProps = {
  caregiver: AdminCaregiver;
  onClose: () => void;
  onSave: (caregiver: AdminCaregiver) => Promise<void>;
  isSaving: boolean;
};

function CaregiverEditModal({
  caregiver,
  onClose,
  onSave,
  isSaving,
}: CaregiverModalProps) {
  const [form, setForm] = useState<AdminCaregiver>(caregiver);
  const isNew = !caregiver.id;

  const updateField = <K extends keyof AdminCaregiver>(
    key: K,
    value: AdminCaregiver[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">
            {isNew ? "New Caregiver" : "Edit Caregiver"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(form);
          }}
        >
          <div>
            <label className={labelClasses}>Employee Code</label>
            <input
              className={inputClasses}
              value={form.employeeCode ?? ""}
              onChange={(event) =>
                updateField("employeeCode", event.target.value || null)
              }
            />
          </div>
          <div>
            <label className={labelClasses}>First Name</label>
            <input
              className={inputClasses}
              value={form.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>Last Name</label>
            <input
              className={inputClasses}
              value={form.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>Date of Birth</label>
            <input
              type="date"
              className={inputClasses}
              value={formatDateInput(form.dob)}
              onChange={(event) => updateField("dob", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Phone</label>
            <input
              className={inputClasses}
              value={form.phone ?? ""}
              onChange={(event) => updateField("phone", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>Email</label>
            <input
              type="email"
              className={inputClasses}
              value={form.email ?? ""}
              onChange={(event) => updateField("email", event.target.value || null)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Address Line 1</label>
            <input
              className={inputClasses}
              value={form.addressLine1 ?? ""}
              onChange={(event) =>
                updateField("addressLine1", event.target.value || null)
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Address Line 2</label>
            <input
              className={inputClasses}
              value={form.addressLine2 ?? ""}
              onChange={(event) =>
                updateField("addressLine2", event.target.value || null)
              }
            />
          </div>
          <div>
            <label className={labelClasses}>City</label>
            <input
              className={inputClasses}
              value={form.city ?? ""}
              onChange={(event) => updateField("city", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>State</label>
            <input
              className={inputClasses}
              value={form.state ?? ""}
              onChange={(event) => updateField("state", event.target.value || null)}
            />
          </div>
          <div>
            <label className={labelClasses}>ZIP</label>
            <input
              className={inputClasses}
              value={form.zip ?? ""}
              onChange={(event) => updateField("zip", event.target.value || null)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Sandata EVV ID</label>
            <input
              className={inputClasses}
              value={form.sandataEvvId ?? ""}
              onChange={(event) =>
                updateField("sandataEvvId", event.target.value || null)
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Status</label>
            <input
              className={inputClasses}
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {isSaving ? "Saving..." : isNew ? "Create Caregiver" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
