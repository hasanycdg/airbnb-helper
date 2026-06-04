import { cn } from "@/lib/utils";

export interface LocaleBarItem {
  locale: string;
  label: string;
  flag: string;
  count: number;
  percent: number;
}

interface LocaleBarsProps {
  items: LocaleBarItem[];
  className?: string;
}

/**
 * Stacked horizontal progress bars showing guest language distribution.
 */
export function LocaleBars({ items, className }: LocaleBarsProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No locale data available yet.
      </p>
    );
  }

  // Use a repeating set of distinct Tailwind bg colours for each bar
  const barColors = [
    "bg-primary",
    "bg-blue-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li key={item.locale} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{item.flag}</span>
              <span className="font-medium">{item.label}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {item.count} ({item.percent}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", barColors[i % barColors.length])}
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
