import { motion, useReducedMotion } from "framer-motion";

import { homeContent } from "../data/homeContent";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "../utils/homeAnimations";
import { FadeIn } from "./FadeIn";

export function HomeAmenitiesSection() {
  const reduceMotion = useReducedMotion();
  const { benefits } = homeContent;

  return (
    <section aria-labelledby="home-benefits-heading" className="bg-surface">
      <div className="mx-auto w-full max-w-app px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <FadeIn className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <h2
            className="max-w-xl text-3xl font-black leading-tight tracking-[-0.025em] text-ink sm:text-4xl"
            id="home-benefits-heading"
          >
            {benefits.heading}
          </h2>
          <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
            {benefits.description}
          </p>
        </FadeIn>

        <motion.ul
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          variants={reduceMotion ? undefined : staggerContainerVariants}
          viewport={{ once: true, margin: "-64px" }}
          whileInView="visible"
        >
          {benefits.items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.li
                className="rounded-card bg-canvas p-6 shadow-elevation-1 transition duration-base ease-calm hover:-translate-y-1 hover:shadow-elevation-2 motion-reduce:transform-none motion-reduce:transition-none"
                key={item.name}
                variants={reduceMotion ? undefined : staggerItemVariants}
              >
                <span className="grid size-11 place-items-center rounded-control bg-surface text-brand shadow-elevation-1">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-7 text-lg font-black text-ink">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
