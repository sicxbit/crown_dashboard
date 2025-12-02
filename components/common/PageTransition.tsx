"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const transition = { duration: 0.25, ease: "easeInOut" };

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Avoid remounting admin layout so the navbar stays persistent between admin routes.
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={transition}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
