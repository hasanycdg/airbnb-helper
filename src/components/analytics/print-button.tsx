"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers window.print() for the monthly analytics report. */
export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer />
      Print report
    </Button>
  );
}
