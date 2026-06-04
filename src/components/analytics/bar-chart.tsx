import { cn } from "@/lib/utils";

export interface BarChartDatum {
  label: string; // shown on x-axis (e.g. "Jun 04")
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  /** Height of the tallest bar in pixels. Default 120. */
  maxBarHeight?: number;
  /** Tailwind bg-* class for the bars. Default "bg-primary". */
  barColor?: string;
  /** Show value tooltip on hover. */
  showTooltip?: boolean;
  className?: string;
}

/**
 * Lightweight SVG-free bar chart built purely with Tailwind / divs.
 * Renders responsively; labels are shown every ~7 items to avoid crowding.
 */
export function BarChart({
  data,
  maxBarHeight = 120,
  barColor = "bg-primary",
  className,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-36 items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground",
          className,
        )}
      >
        No data for this period
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("w-full", className)}>
      {/* Chart area */}
      <div
        className="flex items-end gap-[2px] overflow-hidden"
        style={{ height: `${maxBarHeight + 4}px` }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, i) => {
          const heightPx = Math.max(2, Math.round((d.value / maxValue) * maxBarHeight));
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: `${maxBarHeight}px` }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow group-hover:block">
                {d.label}: <strong>{d.value}</strong>
              </div>
              {/* Bar */}
              <div
                className={cn(
                  "w-full min-h-[2px] rounded-t transition-all",
                  barColor,
                  d.value === 0 ? "opacity-20" : "opacity-90 hover:opacity-100",
                )}
                style={{ height: `${heightPx}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show approx every 7 items */}
      <div className="mt-1 flex items-start gap-[2px] overflow-hidden">
        {data.map((d, i) => {
          const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-1 items-center justify-center text-[10px] text-muted-foreground",
                !showLabel && "invisible",
              )}
            >
              {showLabel ? d.label.slice(5) : " "}
            </div>
          );
        })}
      </div>
    </div>
  );
}
