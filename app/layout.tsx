import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crown Home Care",
  description: "Operations dashboard and caregiver portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
