import type { Permission } from "@/lib/rbac";

/**
 * Single source of truth for the host app's left navigation. The sidebar
 * renders from this and filters each item by the member's role permission.
 * `icon` is a lucide-react component name resolved in the sidebar.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: Permission;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const APP_NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", exact: true },
      { label: "Properties", href: "/properties", icon: "Building2", permission: "property:manage" },
    ],
  },
  {
    label: "Guest experience",
    items: [
      { label: "Guest questions", href: "/questions", icon: "MessageCircleQuestion", permission: "ai:configure" },
      { label: "Messages", href: "/messages", icon: "Mail", permission: "messages:manage" },
      { label: "Reviews", href: "/reviews", icon: "Star", permission: "reviews:manage" },
      { label: "Tirol templates", href: "/templates", icon: "BookOpen", permission: "guide:edit" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Issues", href: "/issues", icon: "TriangleAlert", permission: "issues:view" },
      { label: "Cleaning", href: "/cleaning", icon: "SprayCan", permission: "cleaning:view" },
      { label: "Inventory", href: "/inventory", icon: "Package", permission: "inventory:view" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/analytics", icon: "BarChart3", permission: "analytics:view" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Team", href: "/settings/team", icon: "Users", permission: "members:manage" },
      { label: "Billing", href: "/settings/billing", icon: "CreditCard", permission: "billing:manage" },
      { label: "Organization", href: "/settings/organization", icon: "Settings", permission: "org:manage" },
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
