import { ArrowRight } from "lucide-react";

import { LinkButton } from "@/shared/components/LinkButton";

import { homeContent } from "../data/homeContent";
import { FadeIn } from "./FadeIn";

export function HomeExperienceSection() {
  const { experience } = homeContent;

  return (
    <section
      aria-labelledby="home-experience-heading"
      className="bg-inverse text-on-inverse"
    >
      <div className="mx-auto grid min-h-[38rem] max-w-[100rem] lg:grid-cols-[0.88fr_1.12fr]">
        <FadeIn
          className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
          x={-20}
          y={0}
        >
          <p className="text-sm font-bold text-brand-on-inverse">
            Trải nghiệm lưu trú
          </p>
          <h2
            className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.025em] sm:text-5xl"
            id="home-experience-heading"
          >
            {experience.heading}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-on-inverse-muted sm:text-lg sm:leading-8">
            {experience.description}
          </p>
          <ul className="mt-8 grid gap-3 text-sm font-bold text-on-inverse sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {experience.moments.map((moment) => (
              <li
                className="flex items-start gap-2 border-t border-inverse-line pt-3"
                key={moment}
              >
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand-on-inverse"
                />
                {moment}
              </li>
            ))}
          </ul>
          <div className="mt-9">
            <LinkButton to={experience.cta.to} variant="outline">
              {experience.cta.label}
            </LinkButton>
          </div>
        </FadeIn>

        <div className="relative min-h-[28rem] overflow-hidden bg-inverse-raised lg:min-h-full">
          <img
            alt="Ảnh minh họa hiên nghỉ nhìn ra khu vườn sau mưa"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            src="/images/home/experience.webp"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.28),transparent_45%)]" />
          <span className="absolute bottom-4 right-4 text-xs font-semibold text-white/75">
            Hình ảnh không gian minh họa
          </span>
        </div>
      </div>
    </section>
  );
}
