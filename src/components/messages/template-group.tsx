import type { MessageChannel, MessageType, Locale } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOCALE_LABELS } from "@/lib/constants";
import { TemplateRowActions } from "@/components/messages/template-row-actions";
import { cn } from "@/lib/utils";

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  MANUAL: "Manual",
  EMAIL: "Email",
  SMS: "SMS",
};

interface TemplateItem {
  id: string;
  name: string;
  type: MessageType;
  locale: Locale;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  enabled: boolean;
  propertyId: string | null;
  property?: { publicName: string } | null;
}

interface TemplateGroupProps {
  label: string;
  templates: TemplateItem[];
  properties: { id: string; publicName: string }[];
}

export function TemplateGroup({ label, templates, properties }: TemplateGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {templates.map((t) => {
            const localeInfo = LOCALE_LABELS[t.locale];
            return (
              <div
                key={t.id}
                className={cn(
                  "flex flex-col gap-2 px-6 py-3 transition-colors sm:flex-row sm:items-center sm:gap-4",
                  !t.enabled && "opacity-60",
                )}
              >
                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {t.property ? (
                      <Badge variant="outline" className="text-xs">
                        {t.property.publicName}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Org-wide
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {localeInfo.flag} {localeInfo.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {CHANNEL_LABELS[t.channel]}
                    </Badge>
                    {!t.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <TemplateRowActions template={t} properties={properties} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
