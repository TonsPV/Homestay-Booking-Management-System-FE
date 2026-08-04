import { useRooms } from "@/features/rooms/hooks";

import { FeaturedRoomsSection } from "../components/FeaturedRoomsSection";
import { HomeAmenitiesSection } from "../components/HomeAmenitiesSection";
import { HomeExperienceSection } from "../components/HomeExperienceSection";
import { HomeFinalCta } from "../components/HomeFinalCta";
import { HomeGalleryMarquee } from "../components/HomeGalleryMarquee";
import { HomeHero } from "../components/HomeHero";
import { HomeSearchPanel } from "../components/HomeSearchPanel";
import { HomeTrustSection } from "../components/HomeTrustSection";

/*
 * THESIS: The homepage is an arrival journey, not a stack of marketing sections.
 * OWN-WORLD: Real property photography, mineral neutrals, deep slate fields, crisp white controls, blue booking actions.
 * STORY: Feel the stay, search immediately, trust the system, compare rooms, imagine the experience, then book.
 * FIRST VIEWPORT: A 70vh room image carries the headline; a compact booking rail locks to its lower threshold.
 * FORM: Premium hospitality canon, staged as an editorial journey; selected from the brief's competitor-quality direction.
 */
export function HomePage() {
  const roomsQuery = useRooms({ limit: 12, page: 1 });
  const rooms = roomsQuery.data?.items ?? [];

  return (
    <div className="overflow-x-clip bg-canvas">
      <div className="relative">
        <HomeHero />
        <HomeSearchPanel />
      </div>
      <HomeTrustSection />
      <FeaturedRoomsSection
        isError={roomsQuery.isError}
        isPending={roomsQuery.isPending}
        refetch={() => void roomsQuery.refetch()}
        rooms={rooms}
      />
      <HomeAmenitiesSection />
      <HomeExperienceSection />
      <HomeGalleryMarquee />
      <HomeFinalCta />
    </div>
  );
}
