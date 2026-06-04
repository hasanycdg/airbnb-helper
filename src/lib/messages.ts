import type { GuestStay, Property } from "@prisma/client";
import { env } from "@/lib/env";

export type MessageVariables = Record<string, string>;

/** Build the variable map available to message templates for a property/stay. */
export function buildMessageVariables(
  property: Pick<
    Property,
    | "publicName"
    | "slug"
    | "checkInTime"
    | "checkOutTime"
    | "wifiName"
    | "wifiPassword"
    | "parkingInfo"
    | "hostName"
    | "hostPhone"
    | "addressLine"
    | "city"
  >,
  stay?: Pick<GuestStay, "guestName"> | null,
): MessageVariables {
  return {
    guest_name: stay?.guestName ?? "there",
    property_name: property.publicName,
    check_in_time: property.checkInTime,
    check_out_time: property.checkOutTime,
    guide_link: `${env.appUrl}/g/${property.slug}`,
    wifi_name: property.wifiName ?? "",
    wifi_password: property.wifiPassword ?? "",
    parking_info: property.parkingInfo ?? "",
    host_name: property.hostName ?? "",
    host_phone: property.hostPhone ?? "",
    address: [property.addressLine, property.city].filter(Boolean).join(", "),
  };
}

/** Replace {{var}} and {var} placeholders. Unknown vars are left untouched. */
export function renderTemplate(body: string, vars: MessageVariables): string {
  return body.replace(/\{\{?\s*([a-z0-9_]+)\s*\}?\}/gi, (match, key: string) => {
    const value = vars[key.toLowerCase()];
    return value !== undefined ? value : match;
  });
}

/** List the {{variables}} actually referenced by a template body. */
export function extractVariables(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/\{\{?\s*([a-z0-9_]+)\s*\}?\}/gi)) {
    found.add(m[1].toLowerCase());
  }
  return [...found];
}
