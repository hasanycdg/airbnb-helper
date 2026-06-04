import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SectionIcon } from "@/components/shared/section-icon";
import { ApplyTemplateDialog } from "@/components/templates/apply-template-dialog";
import type { TemplateContent } from "@/components/templates/template-data";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  publicName: string;
}

interface Props {
  template: TemplateContent;
  properties: Property[];
}

/** Truncate content preview to ~160 chars without breaking words. */
function previewText(text: string, max = 160): string {
  // Strip markdown headings, bold markers etc. for a clean preview.
  const clean = text
    .replace(/^#{1,3}\s.+$/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\|.+/g, "")
    .replace(/^\s*[-|]\s*/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S+$/, "") + "…";
}

export function TemplateCard({ template, properties }: Props) {
  const dePreview = previewText(template.contentDE);
  const enPreview = previewText(template.contentEN);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Icon badge */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              template.iconColour,
            )}
          >
            <SectionIcon name={template.icon} />
          </div>

          {/* Category badge */}
          <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
            {template.category}
          </Badge>
        </div>

        <CardTitle className="text-base leading-snug">{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* DE preview */}
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">DE</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                German preview — click &quot;Apply to property&quot; to insert the full text.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{dePreview}</p>
        </div>

        {/* EN preview */}
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">EN</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                English preview — the full translation is saved automatically.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{enPreview}</p>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <ApplyTemplateDialog template={template} properties={properties} />
      </CardFooter>
    </Card>
  );
}
