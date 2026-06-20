import { Variants, TargetAndTransition } from "framer-motion";

// Custom premium easing curve for clean, professional SaaS layouts
export const smoothEase = [0.16, 1, 0.3, 1] as const;
export const standardTransition = { type: "tween" as const, ease: smoothEase, duration: 0.5 };
export const springTransition = { type: "spring" as const, stiffness: 260, damping: 26 };

// Simple, smooth page load reveal
export const pageFadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: standardTransition,
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" } 
  },
};

// Container for staggered elements
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

// Clean stagger child item reveal
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

// Table row slide reveals
export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  }
};

// Slider indicators
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  },
};

// Fuel tank fluid fill animation
export const liquidFillVariants: Variants = {
  hidden: { height: "0%" },
  show: (custom: number): TargetAndTransition => ({
    height: `${custom}%`,
    transition: {
      type: "spring",
      stiffness: 40,
      damping: 12,
      delay: 0.25,
    },
  }),
};

// Subtle, professional card lift
export const magneticHover: TargetAndTransition = {
  y: -3,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
  transition: { type: "spring", stiffness: 300, damping: 25 },
};

// Professional button hover highlight
export const buttonHover: TargetAndTransition = {
  scale: 1.015,
  boxShadow: "0 6px 16px rgba(255, 106, 0, 0.22)",
  transition: { type: "spring", stiffness: 400, damping: 22 },
};

// Modal/Popup scale + fade in (with elastic bounce)
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeInOut" }
  }
};

// Minimal background breathing/pulse
export const ambientPulse: Variants = {
  animate: {
    opacity: [0.9, 1, 0.9],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Subtle icon rotation/float for key highlights
export const floatMotion: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
