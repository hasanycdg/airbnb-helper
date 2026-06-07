"use client";

import { useActionState, useEffect, useRef } from "react";
import { LifeBuoy, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { useT } from "@/components/app/app-i18n-provider";
import { sendSupportMessage } from "@/server/support";
import { SUPPORT_CATEGORIES, type SupportActionState } from "@/lib/support";

export function SupportForm({ supportEmail }: { supportEmail: string }) {
  const t = useT();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<SupportActionState, FormData>(
    sendSupportMessage,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      toast({ title: t("support.success"), description: t("support.successDesc") });
      formRef.current?.reset();
    }
  }, [state?.success, toast, t]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          <CardTitle>{t("support.title")}</CardTitle>
        </div>
        <CardDescription>{t("support.desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="category">{t("support.category")}</Label>
            <Select name="category" defaultValue="question">
              <SelectTrigger id="category" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`support.cat.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">{t("support.message")}</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              placeholder={t("support.message.placeholder")}
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {supportEmail ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {t("support.direct")}{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {supportEmail}
                </a>
              </p>
            ) : (
              <span />
            )}
            <SubmitButton pendingText={t("support.sending")}>{t("support.send")}</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
