"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MediaFilter = "all" | "IMAGE" | "VIDEO" | "PDF" | "FILE";

const FILTER_OPTIONS: { value: MediaFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Videos" },
  { value: "PDF", label: "PDFs" },
  { value: "FILE", label: "Other files" },
];

export function MediaFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilter = (searchParams.get("type") ?? "all") as MediaFilter;

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("type");
      } else {
        params.set("type", value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Filter:</span>
      <Select value={currentFilter} onValueChange={handleChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
