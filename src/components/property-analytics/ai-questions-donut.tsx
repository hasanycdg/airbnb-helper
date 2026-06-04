import { cn } from "@/lib/utils";

interface AIQuestionsDonutProps {
  answered: number;
  unanswered: number;
  className?: string;
}

/**
 * SVG-based donut chart showing the ratio of AI-answered vs unanswered questions.
 * Falls back to a plain message when there are no questions.
 */
export function AIQuestionsDonut({ answered, unanswered, className }: AIQuestionsDonutProps) {
  const total = answered + unanswered;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No guest questions recorded yet.
      </p>
    );
  }

  const answerRate = Math.round((answered / total) * 100);

  // SVG donut geometry
  const R = 52; // outer radius
  const r = 34; // inner radius (donut hole)
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * R;
  const answeredArc = (answered / total) * circumference;

  // Helper: compute SVG arc path for a slice of a circle
  function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sa = toRad(startAngle - 90);
    const ea = toRad(endAngle - 90);

    const x1 = cx + outerR * Math.cos(sa);
    const y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(ea);
    const y2 = cy + outerR * Math.sin(ea);
    const x3 = cx + innerR * Math.cos(ea);
    const y3 = cy + innerR * Math.sin(ea);
    const x4 = cx + innerR * Math.cos(sa);
    const y4 = cy + innerR * Math.sin(sa);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");
  }

  const answeredDeg = (answered / total) * 360;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6", className)}>
      {/* SVG donut */}
      <div className="relative shrink-0">
        <svg width={128} height={128} viewBox="0 0 128 128" aria-hidden="true">
          {/* Unanswered slice (background / red-ish) */}
          {unanswered > 0 && (
            <path
              d={arcPath(answeredDeg, 360, R, r)}
              className="fill-destructive/30"
            />
          )}
          {/* Answered slice (green) */}
          {answered > 0 && (
            <path
              d={arcPath(0, answeredDeg, R, r)}
              className="fill-green-500"
            />
          )}
          {/* Centre label */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-xl font-bold"
            style={{ fontSize: "18px", fontWeight: 700 }}
          >
            {answerRate}%
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "10px" }}
          >
            answered
          </text>
        </svg>
      </div>

      {/* Legend */}
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          <dt className="text-muted-foreground">Answered by AI</dt>
          <dd className="ml-auto font-semibold tabular-nums pl-4">{answered}</dd>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive/50" />
          <dt className="text-muted-foreground">Unanswered</dt>
          <dd className="ml-auto font-semibold tabular-nums pl-4">{unanswered}</dd>
        </div>
        <div className="flex items-center gap-2 border-t pt-2 mt-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted" />
          <dt className="text-muted-foreground">Total</dt>
          <dd className="ml-auto font-semibold tabular-nums pl-4">{total}</dd>
        </div>
      </dl>
    </div>
  );
}
