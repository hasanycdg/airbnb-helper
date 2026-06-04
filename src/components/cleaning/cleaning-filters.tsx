"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CleaningStatus } from "@prisma/client";

interface Property {
  id: string;
  publicName: string;
}

interface CleaningFiltersProps {
  properties: Property[];
  currentStatus?: CleaningStatus;
  currentPropertyId?: string;
}

const STATUS_LABELS: Record<CleaningStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  INSPECTED: "Inspected",
};

export function CleaningFilters({
  properties,
  currentStatus,
  currentPropertyId,
}: CleaningFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string | undefined) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
      router.push(`${pathname}?${current.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={currentStatus ?? "all"}
        onValueChange={(v) => updateParams("status", v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"] as CleaningStatus[]).map(
            (s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <Select
        value={currentPropertyId ?? "all"}
        onValueChange={(v) => updateParams("propertyId", v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All properties" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All properties</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.publicName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
