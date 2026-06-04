"use client";

import type { GuideMedia, GuideSection } from "@prisma/client";
import { MediaCard } from "./media-card";

interface MediaGridProps {
  mediaList: (GuideMedia & { sections: Pick<GuideSection, "id" | "title">[] })[];
  allSections: Pick<GuideSection, "id" | "title">[];
}

export function MediaGrid({ mediaList, allSections }: MediaGridProps) {
  if (mediaList.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {mediaList.map((m) => (
        <MediaCard key={m.id} media={m} allSections={allSections} />
      ))}
    </div>
  );
}
