import { cn } from "@/lib/utils";

export interface IssueCategoryItem {
  category: string;
  label: string;
  count: number;
}

interface IssuesByCategoryProps {
  items: IssueCategoryItem[];
  className?: string;
}

/**
 * Horizontal bar chart listing issues by category for a single property.
 * Bars are coloured using the destructive palette to signal problem data.
 */
export function IssuesByCategory({ items, className }: IssuesByCategoryProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No issues recorded in the last 30 days.
      </p>
    );
  }

  const max = items[0].count;

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => {
        const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
        return (
          <li key={item.category} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 truncate font-medium">{item.label}</span>
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-destructive/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                {item.count}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
