import { ArrowDown, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

import { LinkButton } from "@/shared/components/LinkButton";

import { homeContent } from "../data/homeContent";
import { fadeUpVariants, heroImageVariants } from "../utils/homeAnimations";

export function HomeHero() {
  const reduceMotion = useReducedMotion();
  const { hero } = homeContent;

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative min-h-[68svh] overflow-hidden bg-inverse text-on-inverse sm:min-h-[72svh]"
      data-home-hero
    >
      <div className="absolute inset-0">
        <motion.div
          animate="visible"
          className="size-full"
          initial="hidden"
          variants={reduceMotion ? undefined : heroImageVariants}
        >
          <img
            alt="Ảnh minh họa không gian nghỉ giữa khu vườn nhiệt đới"
            className="size-full object-cover"
            decoding="async"
            fetchPriority="high"
            src="/images/home/hero.webp"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,28,0.86)_0%,rgba(8,15,28,0.56)_44%,rgba(8,15,28,0.18)_76%,rgba(8,15,28,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(8,15,28,0.76),transparent)]" />
      </div>

      <span className="absolute bottom-4 right-4 z-[1] text-xs font-semibold text-on-inverse/70 sm:bottom-20 lg:right-8">
        Hình ảnh không gian minh họa
      </span>

      <div className="relative mx-auto flex min-h-[68svh] w-full max-w-app items-center px-4 pb-28 pt-24 sm:min-h-[72svh] sm:px-6 sm:pb-32 lg:px-8 lg:pt-28">
        <div className="max-w-[42rem]">
          <motion.p
            animate="visible"
            className="inline-flex items-center gap-2 text-sm font-bold text-on-inverse"
            custom={0.05}
            initial="hidden"
            variants={reduceMotion ? undefined : fadeUpVariants}
          >
            <span className="grid size-6 place-items-center rounded-full bg-success text-white">
              <Check aria-hidden="true" className="size-3.5" />
            </span>
            Homestay Green · Đặt phòng trực tiếp
          </motion.p>

          <motion.h1
            animate="visible"
            className="mt-5 max-w-[10ch] font-display text-4xl font-black leading-[1.02] tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.75rem]"
            custom={0.15}
            id="home-hero-heading"
            initial="hidden"
            variants={reduceMotion ? undefined : fadeUpVariants}
          >
            {hero.heading}
          </motion.h1>

          <motion.p
            animate="visible"
            className="mt-6 max-w-xl text-base leading-7 text-on-inverse-muted sm:text-lg sm:leading-8"
            custom={0.3}
            initial="hidden"
            variants={reduceMotion ? undefined : fadeUpVariants}
          >
            {hero.description}
          </motion.p>

          <motion.div
            animate="visible"
            className="mt-8 flex flex-wrap gap-3"
            custom={0.42}
            initial="hidden"
            variants={reduceMotion ? undefined : fadeUpVariants}
          >
            <LinkButton
              className="min-h-12 px-6 text-base"
              to={hero.primaryCta.to}
            >
              {hero.primaryCta.label}
            </LinkButton>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-control px-5 text-base font-bold text-on-inverse underline-offset-4 hover:underline focus-visible:outline-on-inverse"
              to={hero.secondaryCta.to}
            >
              {hero.secondaryCta.label}
            </Link>
          </motion.div>
        </div>

        <a
          aria-label="Xem nội dung bên dưới"
          className="absolute bottom-8 right-4 hidden min-h-11 items-center gap-2 text-sm font-bold text-on-inverse-muted hover:text-on-inverse sm:flex lg:right-8"
          href="#home-trust"
        >
          Khám phá
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
            transition={
              reduceMotion ? undefined : { duration: 1.8, repeat: Infinity }
            }
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </motion.span>
        </a>
      </div>
    </section>
  );
}
