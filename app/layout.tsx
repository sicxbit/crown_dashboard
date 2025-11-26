import type { Metadata } from "next";
import "./globals.css";
import { PreferencesProvider } from "@/components/common/PreferencesProvider";

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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-900 dark:text-slate-100">
        <PreferencesProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
