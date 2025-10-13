import { Variants } from "framer-motion";

// Page entrance animations
export const pageVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

// Card stagger animations
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

// Metric card animations
export const metricsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 100
    }
  })
};

// Slide in from sides
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200 }
  }
};

// Floating animation for backgrounds
export const floatingAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 90, 0]
  },
  transition: {
    duration: 10,
    repeat: Infinity
  }
};

export const floatingAnimationReverse = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, -90, 0]
  },
  transition: {
    duration: 8,
    repeat: Infinity
  }
};

// Pulsing animation
export const pulseAnimation = {
  animate: {
    opacity: [0.3, 0.5, 0.3]
  },
  transition: {
    duration: 3,
    repeat: Infinity
  }
};

// Button hover effects
export const buttonHoverEffect = {
  whileHover: { scale: 1.05, y: -4 },
  whileTap: { scale: 0.95 }
};

// Icon rotate on hover
export const iconRotateHover = {
  whileHover: { rotate: 360 },
  transition: { duration: 0.5 }
};

// Number scale in
export const numberScaleIn = (delay: number = 0) => ({
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: "spring", stiffness: 200, delay }
});

// Progress bar animation
export const progressBarAnimation = (percentage: number, delay: number = 0) => ({
  initial: { width: 0 },
  animate: { width: `${percentage}%` },
  transition: {
    duration: 1.5,
    delay,
    type: "spring",
    stiffness: 50
  }
});

// Fade in up with delay
export const fadeInUp = (delay: number = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.5
    }
  }
});

// List item stagger
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.1
    }
  })
};
