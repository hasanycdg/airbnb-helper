import { Film, Image as ImageIcon, FileText, File, HardDrive } from "lucide-react";
import type { GuideMedia } from "@prisma/client";
import { StatCard } from "@/components/shared/stat-card";

interface MediaStatsProps {
  mediaList: GuideMedia[];
  videoLimit: number | null;
}

export function MediaStats({ mediaList, videoLimit }: MediaStatsProps) {
  const images = mediaList.filter((m) => m.type === "IMAGE").length;
  const videos = mediaList.filter((m) => m.type === "VIDEO").length;
  const docs = mediaList.filter((m) => m.type === "PDF" || m.type === "FILE").length;
  const totalMb =
    mediaList.reduce((sum, m) => sum + (m.fileSize ?? 0), 0) / 1024 / 1024;

  const videoHint =
    videoLimit !== null ? `${videos} / ${videoLimit} on this plan` : undefined;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="Images" value={images} icon={ImageIcon} />
      <StatCard label="Videos" value={videos} icon={Film} hint={videoHint} />
      <StatCard label="Documents" value={docs} icon={FileText} />
      <StatCard
        label="Storage used"
        value={`${totalMb.toFixed(1)} MB`}
        icon={HardDrive}
      />
    </div>
  );
}
