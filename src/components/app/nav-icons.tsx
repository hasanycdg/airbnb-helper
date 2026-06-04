import {
  BarChart3,
  Bot,
  BookOpen,
  Building2,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MessageCircleQuestion,
  Package,
  QrCode,
  Settings,
  Sparkles,
  SprayCan,
  Star,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  MessageCircleQuestion,
  Mail,
  Star,
  TriangleAlert,
  SprayCan,
  Package,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  BookOpen,
  Image: ImageIcon,
  QrCode,
  Sparkles,
  Bot,
};

export function getNavIcon(name: string): LucideIcon {
  return NAV_ICONS[name] ?? LayoutDashboard;
}
