import type { Permission } from "@/lib/rbac";

/**
 * Single source of truth for the host app's left navigation. The sidebar
 * renders from this and filters each item by the member's role permission.
 * `icon` is a lucide-react component name resolved in the sidebar.
 * `i18nKey` / `labelKey` map to `@/lib/app-i18n` (label is the English fallback).
 */
export interface NavItem {
  label: string;
  i18nKey?: string;
  href: string;
  icon: string;
  permission?: Permission;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  labelKey?: string;
  items: NavItem[];
}

export const APP_NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", i18nKey: "nav.dashboard", href: "/dashboard", icon: "LayoutDashboard", exact: true },
      { label: "Properties", i18nKey: "nav.properties", href: "/properties", icon: "Building2", permission: "property:manage" },
    ],
  },
  {
    label: "Guest experience",
    labelKey: "nav.group.guest",
    items: [
      { label: "Guest questions", i18nKey: "nav.questions", href: "/questions", icon: "MessageCircleQuestion", permission: "ai:configure" },
      { label: "Messages", i18nKey: "nav.messages", href: "/messages", icon: "Mail", permission: "messages:manage" },
      { label: "Reviews", i18nKey: "nav.reviews", href: "/reviews", icon: "Star", permission: "reviews:manage" },
      { label: "Tirol templates", i18nKey: "nav.templates", href: "/templates", icon: "BookOpen", permission: "guide:edit" },
    ],
  },
  {
    label: "Operations",
    labelKey: "nav.group.operations",
    items: [
      { label: "Issues", i18nKey: "nav.issues", href: "/issues", icon: "TriangleAlert", permission: "issues:view" },
      { label: "Cleaning", i18nKey: "nav.cleaning", href: "/cleaning", icon: "SprayCan", permission: "cleaning:view" },
      { label: "Inventory", i18nKey: "nav.inventory", href: "/inventory", icon: "Package", permission: "inventory:view" },
    ],
  },
  {
    label: "Insights",
    labelKey: "nav.group.insights",
    items: [
      { label: "Analytics", i18nKey: "nav.analytics", href: "/analytics", icon: "BarChart3", permission: "analytics:view" },
    ],
  },
  {
    label: "Settings",
    labelKey: "nav.group.settings",
    items: [
      { label: "Team", i18nKey: "nav.team", href: "/settings/team", icon: "Users", permission: "members:manage" },
      { label: "Billing", i18nKey: "nav.billing", href: "/settings/billing", icon: "CreditCard", permission: "billing:manage" },
      { label: "Organization", i18nKey: "nav.organization", href: "/settings/organization", icon: "Settings", permission: "org:manage" },
    ],
  },
];

/** Per-property sub-navigation (tabs on the property detail page). */
export interface PropertyNavItem {
  label: string;
  segment: string; // appended to /properties/[id]
  icon: string;
  permission?: Permission;
}

export const PROPERTY_NAV: PropertyNavItem[] = [
  { label: "Overview", segment: "", icon: "LayoutDashboard" },
  { label: "Guide builder", segment: "/guide", icon: "BookOpen", permission: "guide:edit" },
  { label: "Media library", segment: "/media", icon: "Image", permission: "media:manage" },
  { label: "QR codes", segment: "/qr", icon: "QrCode", permission: "qr:manage" },
  { label: "Recommendations", segment: "/recommendations", icon: "Sparkles", permission: "recommendations:manage" },
  { label: "AI assistant", segment: "/ai", icon: "Bot", permission: "ai:configure" },
  { label: "Analytics", segment: "/analytics", icon: "BarChart3", permission: "analytics:view" },
];
