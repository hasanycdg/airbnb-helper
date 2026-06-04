import { cn } from "@/lib/utils";

export interface SectionViewItem {
  sectionId: string;
  title: string;
  count: number;
}

interface SectionViewsListProps {
  items: SectionViewItem[];
  className?: string;
}

/**
 * Horizontal progress-bar list showing the top-viewed guide sections for a
 * single property. Bar width is relative to the section with the most views.
 */
export function SectionViewsList({ items, className }: SectionViewsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No section views recorded yet.</p>
    );
  }

  const max = items[0].count;

  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
        return (
          <li key={item.sectionId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate max-w-[65%]">{item.title}</span>
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
