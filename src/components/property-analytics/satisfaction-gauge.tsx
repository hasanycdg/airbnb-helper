import { cn } from "@/lib/utils";

interface SatisfactionGaugeProps {
  /** Percentage 0–100 of GOOD responses, or null if no data. */
  score: number | null;
  good: number;
  problem: number;
  className?: string;
}

/**
 * SVG semi-circle gauge displaying the satisfaction score for a property.
 * Shows green when score >= 75, amber otherwise. Falls back to an empty state message.
 */
export function SatisfactionGauge({ score, good, problem, className }: SatisfactionGaugeProps) {
  if (score === null) {
    return (
      <p className="text-sm text-muted-foreground">
        No satisfaction check responses yet.
      </p>
    );
  }

  // Semi-circle gauge parameters
  const cx = 80;
  const cy = 72;
  const R = 56;
  const strokeW = 14;
  // Arc is a semi-circle from 180° to 360° (left to right, bottom half of full circle = top half visual)
  const arcLen = Math.PI * R; // half circumference
  const fill = (score / 100) * arcLen;

  const isGood = score >= 75;
  const trackColor = "stroke-muted";
  const fillColor = isGood ? "stroke-green-500" : "stroke-amber-500";
  const textColor = isGood ? "fill-green-600 dark:fill-green-400" : "fill-amber-600 dark:fill-amber-400";

  // SVG arc drawing: start at left (180°), sweep clockwise by fill proportion
  function describeArc(startDeg: number, endDeg: number, r: number): string {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const filledEndDeg = 180 + score * 1.8; // 0% → 180°, 100% → 360°

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Gauge SVG */}
      <svg width={160} height={90} viewBox="0 0 160 90" aria-label={`Satisfaction score ${score}%`}>
        {/* Track (full semi-circle) */}
        <path
          d={describeArc(180, 360, R)}
          fill="none"
          strokeWidth={strokeW}
          strokeLinecap="round"
          className={trackColor}
        />
        {/* Filled arc */}
        {score > 0 && (
          <path
            d={describeArc(180, Math.min(filledEndDeg, 359.9), R)}
            fill="none"
            strokeWidth={strokeW}
            strokeLinecap="round"
            className={fillColor}
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "22px", fontWeight: 700 }}
          className={textColor}
        >
          {score}%
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: "10px" }}
          className="fill-muted-foreground"
        >
          satisfaction
        </text>
      </svg>

      {/* Legend */}
      <dl className="flex gap-6 text-sm">
        <div className="flex flex-col items-center gap-0.5">
          <dt className="text-muted-foreground text-xs">Good</dt>
          <dd className="font-semibold tabular-nums text-green-600 dark:text-green-400">{good}</dd>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <dt className="text-muted-foreground text-xs">Problem</dt>
          <dd className="font-semibold tabular-nums text-destructive">{problem}</dd>
        </div>
      </dl>
    </div>
  );
}
