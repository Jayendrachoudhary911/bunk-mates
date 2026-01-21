import { motion, AnimatePresence } from "framer-motion";
import React from "react";

const AnimatedLikeCount = ({ value }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          display: "inline-block",
          minWidth: "2ch",
          textAlign: "center",
          fontSize: 18
        }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
};

export default AnimatedLikeCount;
