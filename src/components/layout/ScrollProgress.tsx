"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useScroll, useTransform, Variants } from "framer-motion";

import { MorphingLabel } from "@/components/ui/MorphingLabel";
import { morphingLabelSpeed } from "@/lib/animations";

const SECTIONS = [
  { id: "home", key: "home" },
  { id: "projects", key: "projects" },
  { id: "games", key: "games" },
  { id: "blog", key: "blog" },
];

export function ScrollProgress() {
  const t = useTranslations("ScrollProgress");
  const [activeSection, setActiveSection] = useState("home");
  const [isVisible, setIsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const bounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  const scrollbarThumbHeight = windowHeight > 0 && contentHeight > 0
    ? (windowHeight / contentHeight) * windowHeight
    : 0;

  const maxScrollDistance = Math.max(contentHeight - windowHeight, 1);
  const maxThumbPosition = Math.max(windowHeight - scrollbarThumbHeight, 0);

  const y = useTransform(
    scrollY,
    [0, maxScrollDistance],
    [scrollbarThumbHeight / 2, maxThumbPosition + scrollbarThumbHeight / 2]
  );

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
    };
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      setContentHeight(document.documentElement.scrollHeight);
      setWindowHeight(window.innerHeight);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    const hasScrollbar = contentHeight > windowHeight;

    if (!hasScrollbar) {
      setIsVisible(false);
      return;
    }

    const maxScroll = contentHeight - windowHeight;

    const unsubscribe = scrollY.onChange((latest) => {
      setIsScrolling(true);

      const isAtTop = latest <= 5;
      const isAtBottom = latest >= maxScroll - 5;

      if (isAtTop || isAtBottom) {
        setIsBouncing(true);
        if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
        bounceTimeout.current = setTimeout(() => {
          setIsBouncing(false);
        }, 400);
      }

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    });

    return () => {
      unsubscribe();
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
    };
  }, [contentHeight, windowHeight, scrollY]);

  useEffect(() => {
    const hasScrollbar = contentHeight > windowHeight;
    setIsVisible(hasScrollbar && isScrolling);
  }, [isScrolling, contentHeight, windowHeight]);

  const activeSection_data = SECTIONS.find((s) => s.id === activeSection);
  const activeLabel = activeSection_data ? t(activeSection_data.key) : "";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={`scroll-progress-${isScrolling}`}
          style={{ y }}
          initial={{
            x: 100,
            opacity: 0,
            filter: "blur(12px)"
          }}
          animate={{
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: isBouncing ? [1, 1.15, 1] : 1,
          }}
          exit={{
            x: 100,
            opacity: 0,
            filter: "blur(12px)"
          }}
          transition={{
            duration: isScrolling ? 0.3 : 0.35,
            ease: isScrolling ? [0.2, 0, 0.2, 1] : [0.4, 0.0, 0.2, 1],
            scale: {
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1],
            }
          }}
          className="fixed right-6 top-0 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="text-sm md:text-base lg:text-lg font-black tracking-wide text-foreground/80 uppercase select-none whitespace-nowrap" style={{ textRendering: "geometricPrecision" }}>
            <MorphingLabel
              text={activeLabel}
              layoutIdPrefix={`scroll-section-${activeSection}`}
              animationDuration={morphingLabelSpeed.fast}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}