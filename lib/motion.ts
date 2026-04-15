import { Variants, TargetAndTransition, Variant } from "framer-motion";

// Custom easing for world-class feel
export const smoothEase = [0.16, 1, 0.3, 1];

export const pageFadeIn: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: smoothEase,
    },
  },
  exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 0.4 } },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "tween" as const,
      ease: smoothEase,
      duration: 0.6,
    },
  },
};

// Fluid fill effect specifically tailored for Tank capacities
export const liquidFillVariants = {
  hidden: { height: "0%" },
  show: (custom: number): Variant => ({
    height: `${custom}%`,
    transition: {
      type: "spring" as const,
      stiffness: 40,
      damping: 10,
      delay: 0.2, // letting dashboard render first
    },
  }),
};

export const magneticHover: TargetAndTransition = {
  scale: 1.02,
  y: -2,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
  },
};

export const ambientPulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

export const floatMotion: Variants = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 2, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
