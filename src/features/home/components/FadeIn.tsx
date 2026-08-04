import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { easeCalm } from "../utils/homeAnimations";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  x = 0,
  y = 24,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      transition={{ delay, duration, ease: easeCalm }}
      viewport={{ once: true, margin: "-64px" }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
