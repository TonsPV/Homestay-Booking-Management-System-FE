import type { Variants } from "framer-motion";

export const easeCalm = [0.22, 1, 0.36, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: easeCalm },
  }),
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.5, ease: easeCalm },
  }),
};

export const lineRevealVariants: Variants = {
  hidden: { opacity: 0, y: "110%" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: "0%",
    transition: { delay, duration: 0.7, ease: easeCalm },
  }),
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeCalm },
  },
};

export const heroImageVariants: Variants = {
  hidden: { scale: 1.04 },
  visible: {
    scale: 1,
    transition: { duration: 1.4, ease: easeCalm },
  },
};
