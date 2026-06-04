import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QRScanItem {
  id: string;
  label: string | null;
  type: string;
  scanCount: number;
}

interface QRScansListProps {
  items: QRScanItem[];
  qrTypeLabels: Record<string, string>;
  className?: string;
}

/**
 * Table-style list of QR codes with their scan counts for a single property.
 * Bar widths are relative to the code with the most scans.
 */
export function QRScansList({ items, qrTypeLabels, className }: QRScansListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No QR codes created for this property yet.
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.scanCount), 1);

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const pct = Math.round((item.scanCount / max) * 100);
        const displayLabel = item.label ?? qrTypeLabels[item.type] ?? item.type;
        return (
          <li key={item.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium truncate max-w-[65%]">
                <QrCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {displayLabel}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {item.scanCount} scan{item.scanCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.scanCount > 0 ? "bg-blue-500" : "bg-muted-foreground/30",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
