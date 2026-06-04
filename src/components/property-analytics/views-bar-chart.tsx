import { cn } from "@/lib/utils";

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ViewsBarChartProps {
  data: DailyCount[];
  /** Height of the tallest bar in pixels. Default 100. */
  maxBarHeight?: number;
  /** Tailwind bg-* class for bars. Default "bg-primary". */
  barColor?: string;
  className?: string;
}

/**
 * Lightweight div/Tailwind bar chart for per-property guide views over 30 days.
 * No external chart library — renders x-axis labels every ~7 days to avoid crowding.
 */
export function ViewsBarChart({
  data,
  maxBarHeight = 100,
  barColor = "bg-primary",
  className,
}: ViewsBarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-32 items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground",
          className,
        )}
      >
        No data for this period
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className={cn("w-full", className)}>
      <div
        className="flex items-end gap-[2px] overflow-hidden"
        style={{ height: `${maxBarHeight + 4}px` }}
        role="img"
        aria-label="Daily guide views bar chart"
      >
        {data.map((d, i) => {
          const heightPx = Math.max(2, Math.round((d.count / maxValue) * maxBarHeight));
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: `${maxBarHeight}px` }}
            >
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow group-hover:block">
                {d.date.slice(5)}: <strong>{d.count}</strong>
              </div>
              <div
                className={cn(
                  "w-full min-h-[2px] rounded-t transition-all",
                  barColor,
                  d.count === 0 ? "opacity-20" : "opacity-90 hover:opacity-100",
                )}
                style={{ height: `${heightPx}px` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis: show label for first, last, and every 7th bar */}
      <div className="mt-1 flex items-start gap-[2px] overflow-hidden">
        {data.map((d, i) => {
          const show = i === 0 || i === data.length - 1 || i % 7 === 0;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-1 items-center justify-center text-[10px] text-muted-foreground",
                !show && "invisible",
              )}
            >
              {show ? d.date.slice(5) : " "}
            </div>
          );
        })}
      </div>
    </div>
  );
}
