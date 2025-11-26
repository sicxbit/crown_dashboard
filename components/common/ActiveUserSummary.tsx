"use client";

import type { ReactNode } from "react";
import { usePreferences } from "@/components/common/PreferencesProvider";

type Props = {
  fallbackName: string;
  roleLabel?: string;
  secondaryLine?: ReactNode;
};

export default function ActiveUserSummary({ fallbackName, roleLabel, secondaryLine }: Props) {
  const { displayName } = usePreferences();
  const name = displayName.trim() || fallbackName;

  return (
    <div className="text-left sm:text-right">
      <p className="font-medium text-slate-700 dark:text-slate-100">{name}</p>
      {secondaryLine ? (
        <div className="text-xs text-slate-500 dark:text-slate-300">{secondaryLine}</div>
      ) : null}
      {roleLabel ? (
        <p className="text-xs text-slate-500 dark:text-slate-300">{roleLabel}</p>
      ) : null}
    </div>
  );
}
