import { Variants, TargetAndTransition } from "framer-motion";

// Custom premium easing curve (matching Linear & Apple)
export const smoothEase = [0.16, 1, 0.3, 1] as const;
export const elasticSpring = { type: "spring" as const, stiffness: 220, damping: 22 };
export const superElasticSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

// Page transition: cinematic fade in + upward reveal + blur to sharp
export const pageFadeIn: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(12px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: smoothEase,
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    filter: "blur(8px)", 
    transition: { duration: 0.35, ease: "easeIn" } 
  },
};

// Container for staggered elements
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

// Stagger child entrance
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: elasticSpring,
  },
};

// Table row specific stagger entries
export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 280,
      damping: 24
    }
  }
};

// Slide items in from right/left
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30, filter: "blur(4px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 24
    },
  },
};

// Fuel tank fluid level rise (with spring bounce)
export const liquidFillVariants: Variants = {
  hidden: { height: "0%" },
  show: (custom: number): TargetAndTransition => ({
    height: `${custom}%`,
    transition: {
      type: "spring",
      stiffness: 35,
      damping: 10,
      delay: 0.3,
    },
  }),
};

// Premium magnetic card hover (with visual elevation)
export const magneticHover: TargetAndTransition = {
  scale: 1.025,
  y: -5,
  boxShadow: "0 25px 45px rgba(0, 0, 0, 0.45), 0 0 35px rgba(255, 106, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  transition: superElasticSpring,
};

// Subtle magnetic button hover
export const buttonHover: TargetAndTransition = {
  scale: 1.03,
  y: -2,
  boxShadow: "0 10px 20px rgba(255, 106, 0, 0.35)",
  transition: superElasticSpring,
};

// Modal/Popup scale + fade in (with elastic bounce)
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, filter: "blur(8px)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 26,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: "easeInOut" }
  }
};

// Idle ambient breathing/pulse
export const ambientPulse: Variants = {
  animate: {
    scale: [1, 1.015, 1],
    opacity: [0.85, 1, 0.85],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Idle ambient floating movement
export const floatMotion: Variants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 1.5, 0],
    transition: {
      duration: 5,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};
