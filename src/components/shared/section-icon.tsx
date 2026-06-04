import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function SectionIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = getIcon(name);
  return <Icon className={cn("h-5 w-5", className)} />;
}
