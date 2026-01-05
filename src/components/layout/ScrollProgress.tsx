"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "games", label: "Games" },
  { id: "blog", label: "Blog" },
];

export function ScrollProgress() {
  const [activeSection, setActiveSection] = useState("home");
  const [isVisible, setIsVisible] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest < 300) {
      setIsVisible(false);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      return;
    }

    setIsVisible(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      if (latest > 300) {
          setIsVisible(false);
      }
    }, 2000);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    }
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sidebarVariants: Variants = {
      visible: {
          opacity: 1,
          x: 0,
          display: "flex",
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
      },
      hidden: {
          opacity: 0,
          x: -20,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
          transitionEnd: { display: "none" }
      }
  };

  return (
    <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={sidebarVariants}
        className="fixed left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center py-4"
    >
      {SECTIONS.map((section, index) => {
        const isActive = activeSection === section.id;
        const isLast = index === SECTIONS.length - 1;

        return (
          <div key={section.id} className="flex flex-col items-center relative">
            <button
              onClick={() => scrollTo(section.id)}
              className="relative flex items-center justify-center focus:outline-none group"
              aria-label={`Scroll to ${section.label}`}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.8,
                  backgroundColor: isActive ? "var(--foreground)" : "transparent",
                  borderColor: "var(--foreground)",
                  borderWidth: isActive ? "0px" : "2px",
                  opacity: isActive ? 1 : 0.3
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-3.5 h-3.5 rounded-full box-border z-10"
              />
              <div className="absolute inset-0 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 30, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-2 text-sm font-semibold tracking-tight text-foreground pointer-events-none whitespace-nowrap"
                  >
                    {section.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {!isLast && (
               <div className="w-[2px] h-10 bg-foreground/20 rounded-full my-1.5" />
            )}
          </div>
        );
      })}
    </motion.div>
  );
}