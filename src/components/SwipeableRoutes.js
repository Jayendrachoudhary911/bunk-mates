// src/components/SwipeableRoutes.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { AnimatePresence, motion } from 'framer-motion';
import { SWIPEABLE_PATHS } from '../components/navItems'; // Import the paths

const transitionVariants = {
  // Use a dynamic key (`direction`) to control slide-in/slide-out based on swipe
  hidden: (direction) => ({
    x: direction > 0 ? '100%' : '-100%', // 100% is right, -100% is left
    opacity: 0,
  }),
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'tween', // Simple, quick transition
      duration: 0.35,
    },
  },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      type: 'tween',
      duration: 0.35,
    },
  }),
};

function SwipeableRoutes({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = SWIPEABLE_PATHS.indexOf(location.pathname);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left moves to the next page in the array
      if (currentIndex < SWIPEABLE_PATHS.length - 1) {
        navigate(SWIPEABLE_PATHS[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      // Swipe right moves to the previous page in the array
      if (currentIndex > 0) {
        navigate(SWIPEABLE_PATHS[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: true, // Optional: helps prevent unintended scroll
    trackMouse: true, // Optional: enables swiping with the mouse
  });

  // Only apply swipe handlers to the main swipeable pages
  const isSwipeablePage = currentIndex !== -1;
  const props = isSwipeablePage ? handlers : {};

  return (
    <div {...props} style={{ height: '100%', width: '100%' }}>
      {children}
    </div>
  );
}

export default SwipeableRoutes;