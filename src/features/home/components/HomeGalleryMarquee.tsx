import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { FadeIn } from "./FadeIn";

interface GalleryItem {
  alt: string;
  id: string;
  src: string;
}

const galleryItems: GalleryItem[] = [
  {
    alt: "Ảnh minh họa phòng ngủ mở ra khu vườn xanh",
    id: "arrival",
    src: "/images/home/hero.webp",
  },
  {
    alt: "Ảnh minh họa hiên nghỉ yên tĩnh sau mưa",
    id: "veranda",
    src: "/images/home/experience.webp",
  },
  {
    alt: "Ảnh minh họa khuôn viên homestay vào buổi tối",
    id: "evening",
    src: "/images/home/closing.webp",
  },
];

export function HomeGalleryMarquee() {
  return (
    <section
      aria-labelledby="home-gallery-heading"
      className="mx-auto w-full max-w-app px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <FadeIn className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-strong">
            Góc nhìn Homestay Green
          </p>
          <h2
            className="mt-2 text-3xl font-black tracking-[-0.025em] text-ink sm:text-4xl"
            id="home-gallery-heading"
          >
            Những khoảng nghỉ đáng nhớ.
          </h2>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-ink hover:text-brand-strong"
          to="/rooms"
        >
          Xem danh sách phòng{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </FadeIn>

      <div className="grid auto-rows-[11rem] gap-3 sm:grid-cols-2 sm:auto-rows-[14rem] lg:grid-cols-4 lg:auto-rows-[13rem]">
        {galleryItems.map((item, index) => (
          <FadeIn
            className={`group overflow-hidden rounded-card bg-surface-muted ${index === 0 ? "sm:row-span-2 lg:col-span-2" : "lg:col-span-2"}`}
            delay={Math.min(index, 3) * 0.06}
            key={item.id}
          >
            <img
              alt={item.alt}
              className="size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.035] motion-reduce:transition-none"
              loading="lazy"
              src={item.src}
            />
          </FadeIn>
        ))}
      </div>
      <p className="mt-3 text-right text-xs font-semibold text-ink-muted">
        Hình ảnh không gian minh họa
      </p>
    </section>
  );
}
