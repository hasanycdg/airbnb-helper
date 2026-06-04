"use client";

import { useActionState, useEffect, useState } from "react";
import type { Organization } from "@prisma/client";
import { Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { updateOrganizationAction, type OrgActionState } from "@/server/organization";
import { LOCALES, LOCALE_LABELS } from "@/lib/constants";

interface OrgSettingsFormProps {
  organization: Pick<
    Organization,
    | "name"
    | "primaryColor"
    | "logoUrl"
    | "defaultLocale"
    | "supportedLocales"
  >;
}

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState<OrgActionState, FormData>(
    updateOrganizationAction,
    undefined,
  );
  const [colorHex, setColorHex] = useState(organization.primaryColor ?? "#0F766E");

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Settings saved", description: "Your organization settings have been updated." });
    }
  }, [state?.success, toast]);

  return (
    <form action={formAction} className="space-y-6">
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic information about your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={organization.name}
              placeholder="e.g. Alpine Stay Management"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              defaultValue={organization.logoUrl ?? ""}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              A publicly accessible image URL. Used in guest-facing materials.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Brand colour</Label>
            <div className="flex items-center gap-3">
              <input
                id="primaryColor"
                name="primaryColor"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                aria-label="Hex colour value"
                value={colorHex}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColorHex(v);
                }}
                placeholder="#0F766E"
                className="w-32 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to QR print materials and guest guide headers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Localisation</CardTitle>
          </div>
          <CardDescription>
            Default language for new properties and guests. Additional languages enable multi-language
            guides and AI translation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="defaultLocale">Default language</Label>
            <Select name="defaultLocale" defaultValue={organization.defaultLocale}>
              <SelectTrigger id="defaultLocale" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((locale) => {
                  const meta = LOCALE_LABELS[locale];
                  return (
                    <SelectItem key={locale} value={locale}>
                      {meta.flag} {meta.name} ({meta.native})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supported languages</Label>
            <p className="text-xs text-muted-foreground">
              All languages your guides can be translated into.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {LOCALES.map((locale) => {
                const meta = LOCALE_LABELS[locale];
                const checked = organization.supportedLocales.includes(locale);
                return (
                  <label
                    key={locale}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      name="supportedLocales"
                      value={locale}
                      defaultChecked={checked}
                    />
                    <span>
                      {meta.flag} {meta.native}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
      </div>
    </form>
  );
}
