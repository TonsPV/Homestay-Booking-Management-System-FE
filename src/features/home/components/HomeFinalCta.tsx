import { LinkButton } from "@/shared/components/LinkButton";

import { homeContent } from "../data/homeContent";
import { FadeIn } from "./FadeIn";

export function HomeFinalCta() {
  const { finalCta } = homeContent;

  return (
    <section
      aria-labelledby="home-final-cta-heading"
      className="mx-auto w-full max-w-app px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
    >
      <FadeIn>
        <div className="relative min-h-[28rem] overflow-hidden rounded-panel bg-inverse px-6 py-16 text-on-inverse shadow-elevation-4 sm:px-12 lg:flex lg:items-center lg:px-16">
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            src="/images/home/closing.webp"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,28,0.94)_0%,rgba(8,15,28,0.78)_52%,rgba(8,15,28,0.28)_100%)]" />
          <div className="relative max-w-2xl">
            <h2
              className="text-3xl font-black leading-tight tracking-[-0.025em] sm:text-5xl"
              id="home-final-cta-heading"
            >
              {finalCta.heading}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-on-inverse-muted sm:text-lg">
              {finalCta.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton
                className="min-h-12 px-6 text-base"
                to={finalCta.primaryCta.to}
              >
                {finalCta.primaryCta.label}
              </LinkButton>
              <LinkButton
                className="min-h-12 border-on-inverse/35 bg-transparent px-6 text-base text-on-inverse hover:bg-on-inverse/10"
                to={finalCta.secondaryCta.to}
                variant="outline"
              >
                {finalCta.secondaryCta.label}
              </LinkButton>
            </div>
          </div>
          <span className="absolute bottom-4 right-4 text-xs font-semibold text-white/70">
            Hình ảnh không gian minh họa
          </span>
        </div>
      </FadeIn>
    </section>
  );
}
