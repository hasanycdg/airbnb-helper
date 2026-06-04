import { cn } from "@/lib/utils";

export interface StatRowItem {
  label: string;
  value: string | number;
  /** Optional supplementary text in muted color. */
  hint?: string;
  /** Optional Tailwind bg-* class for the value badge. */
  badgeColor?: string;
}

interface StatRowProps {
  items: StatRowItem[];
  className?: string;
}

/**
 * A horizontal list of labelled stat values — used for compact metric rows
 * inside analytics cards (e.g. "AI answered: 42  |  Unanswered: 8").
 */
export function StatRow({ items, className }: StatRowProps) {
  return (
    <dl
      className={cn(
        "flex flex-wrap gap-x-6 gap-y-3",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-xl font-semibold tabular-nums",
                item.badgeColor,
              )}
            >
              {item.value}
            </span>
            {item.hint && (
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
