"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Triggers a download from /api/org/export as a JSON file attachment.
 * Uses a normal anchor navigation so the browser handles Content-Disposition.
 */
export function ExportDataButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
    >
      <a href="/api/org/export" download>
        <Download />
        Export data (JSON)
      </a>
    </Button>
  );
}
