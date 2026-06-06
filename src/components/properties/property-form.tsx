"use client";

import { useActionState, useEffect } from "react";
import type { Property } from "@prisma/client";
import { updatePropertyAction } from "@/server/properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/shared/submit-button";
import { useToast } from "@/components/ui/use-toast";
import { LOCALES, LOCALE_LABELS } from "@/lib/constants";

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
    </div>
  );
}

export function PropertyForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState(updatePropertyAction, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) toast({ title: "Saved", description: "Property details updated." });
    if (state?.error) toast({ variant: "destructive", title: "Error", description: state.error });
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="propertyId" value={property.id} />

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field name="publicName" label="Public name" defaultValue={property.publicName} />
          <Field name="internalName" label="Internal name" defaultValue={property.internalName} />
          <Field name="maxGuests" label="Max guests" type="number" defaultValue={property.maxGuests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location &amp; timing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field name="addressLine" label="Address" defaultValue={property.addressLine} />
          <Field name="city" label="City" defaultValue={property.city} />
          <Field name="postalCode" label="Postal code" defaultValue={property.postalCode} />
          <Field name="country" label="Country" defaultValue={property.country} />
          <Field name="timezone" label="Timezone" defaultValue={property.timezone} placeholder="Europe/Vienna" />
          <div className="grid grid-cols-2 gap-3">
            <Field name="checkInTime" label="Check-in" defaultValue={property.checkInTime} placeholder="15:00" />
            <Field name="checkOutTime" label="Checkout" defaultValue={property.checkOutTime} placeholder="10:00" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host contact &amp; emergency</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field name="hostName" label="Host name" defaultValue={property.hostName} />
          <Field name="hostEmail" label="Host email" defaultValue={property.hostEmail} />
          <Field name="hostPhone" label="Host phone" defaultValue={property.hostPhone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WiFi, parking &amp; rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field name="wifiName" label="WiFi network" defaultValue={property.wifiName} />
          <Field name="wifiPassword" label="WiFi password" defaultValue={property.wifiPassword} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="parkingInfo">Parking details</Label>
            <Textarea id="parkingInfo" name="parkingInfo" defaultValue={property.parkingInfo ?? ""} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="houseRules">House rules</Label>
            <Textarea id="houseRules" name="houseRules" defaultValue={property.houseRules ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field name="quietHoursFrom" label="Quiet hours from" defaultValue={property.quietHoursFrom} placeholder="22:00" />
            <Field name="quietHoursTo" label="Quiet hours to" defaultValue={property.quietHoursTo} placeholder="07:00" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {LOCALES.map((locale) => {
              const isBase = locale === property.baseLocale;
              const checked = property.supportedLocales.includes(locale);
              return (
                <label key={locale} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name="supportedLocales"
                    value={locale}
                    defaultChecked={checked || isBase}
                    disabled={isBase}
                  />
                  {LOCALE_LABELS[locale].flag} {LOCALE_LABELS[locale].native}
                  {isBase && <span className="text-xs text-muted-foreground">(base)</span>}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
