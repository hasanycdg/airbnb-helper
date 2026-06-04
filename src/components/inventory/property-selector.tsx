"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Property } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface PropertySelectorProps {
  properties: Pick<Property, "id" | "name" | "publicName">[];
  selectedId: string;
}

export function PropertySelector({ properties, selectedId }: PropertySelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("propertyId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (properties.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select property" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name ?? p.publicName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
