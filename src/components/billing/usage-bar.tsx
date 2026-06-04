import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}

function pct(used: number, limit: number | null): number {
  if (limit === null) return 0; // unlimited — 0% shown (no cap)
  if (limit === 0) return 100; // zero-cap plan (e.g. AI messages on STARTER)
  return Math.min(100, Math.round((used / limit) * 100));
}

function statusColor(p: number): string {
  if (p >= 100) return "text-destructive";
  if (p >= 80) return "text-warning";
  return "text-muted-foreground";
}

function indicatorColor(p: number): string {
  if (p >= 100) return "[&>div]:bg-destructive";
  if (p >= 80) return "[&>div]:bg-warning";
  return "";
}

export function UsageBar({ label, used, limit, unit = "" }: UsageBarProps) {
  const percent = pct(used, limit);
  const limitLabel = limit === null ? "unlimited" : limit === 0 ? "not included" : `${limit}${unit ? ` ${unit}` : ""}`;
  const usedLabel = `${used}${unit ? ` ${unit}` : ""}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("tabular-nums", statusColor(percent))}>
          {usedLabel} / {limitLabel}
        </span>
      </div>
      {limit !== null && limit > 0 && (
        <Progress
          value={percent}
          className={cn("h-2", indicatorColor(percent))}
        />
      )}
      {limit === 0 && (
        <p className="text-xs text-muted-foreground">Not included in your current plan.</p>
      )}
      {limit === null && (
        <p className="text-xs text-muted-foreground">Unlimited on your plan.</p>
      )}
    </div>
  );
}
