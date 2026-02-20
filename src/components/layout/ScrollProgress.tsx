"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { MorphingLabel } from "@/components/ui/MorphingLabel";
import { morphingLabelSpeed } from "@/lib/animations";

const SECTIONS = [
  { id: "home", key: "home" },
  { id: "projects", key: "projects" },
  { id: "games", key: "games" },
  { id: "blog", key: "blog" },
] as const;

const DEFAULT_SECTION_ID = SECTIONS[0].id;
const SECTION_OBSERVER_ROOT_MARGIN = "-50% 0px -50% 0px";

const SCROLL_EDGE_THRESHOLD_PX = 5;
const BOUNCE_RESET_DELAY_MS = 400;
const SCROLL_IDLE_DELAY_MS = 500;

const BASE_MOTION = {
  x: 100,
  opacity: 0,
  filter: "blur(12px)",
};

const BOUNCE_SCALE_KEYFRAMES = [1, 1.15, 1];
const ENTER_EASE: [number, number, number, number] = [0.2, 0, 0.2, 1];
const EXIT_EASE: [number, number, number, number] = [0.4, 0.0, 0.2, 1];
const BOUNCE_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const ENTER_DURATION = 0.3;
const EXIT_DURATION = 0.35;
const BOUNCE_DURATION = 0.4;

const CONTAINER_CLASS = "fixed right-6 top-0 -translate-y-1/2 z-50 pointer-events-none will-change-transform";
const LABEL_CLASS = "text-sm md:text-base lg:text-lg font-black tracking-wide text-foreground/80 uppercase select-none whitespace-nowrap";

type Section = (typeof SECTIONS)[number];
type SectionId = Section["id"];

export function ScrollProgress() {
  const t = useTranslations("ScrollProgress");
  const [activeSection, setActiveSection] = useState<SectionId>(DEFAULT_SECTION_ID);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scrollY } = useScroll();
  const hasScrollbar = contentHeight > windowHeight;

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
    const sectionIds = new Set<SectionId>(SECTIONS.map(({ id }) => id));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id as SectionId;

          if (entry.isIntersecting && sectionIds.has(sectionId)) {
            setActiveSection(sectionId);
          }
        });
      },
      { rootMargin: SECTION_OBSERVER_ROOT_MARGIN }
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
      const nextContentHeight = document.documentElement.scrollHeight;
      const nextWindowHeight = window.innerHeight;

      setContentHeight((previous) => (previous === nextContentHeight ? previous : nextContentHeight));
      setWindowHeight((previous) => (previous === nextWindowHeight ? previous : nextWindowHeight));
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("load", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("load", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasScrollbar) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
    }
  }, [hasScrollbar]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hasScrollbar) return;

    setIsScrolling((prev) => (prev ? prev : true));

    const maxScroll = contentHeight - windowHeight;
    const isAtTop = latest <= SCROLL_EDGE_THRESHOLD_PX;
    const isAtBottom = latest >= maxScroll - SCROLL_EDGE_THRESHOLD_PX;

    if (isAtTop || isAtBottom) {
      setIsBouncing((prev) => (prev ? prev : true));
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
      bounceTimeout.current = setTimeout(() => {
        setIsBouncing(false);
      }, BOUNCE_RESET_DELAY_MS);
    }

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, SCROLL_IDLE_DELAY_MS);
  });

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
    };
  }, []);

  const activeSectionData = SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0];
  const activeLabel = t(activeSectionData.key);

  return (
    <AnimatePresence>
      {hasScrollbar && isScrolling && (
        <motion.div
          style={{ y }}
          initial={BASE_MOTION}
          animate={{
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: isBouncing ? BOUNCE_SCALE_KEYFRAMES : 1,
          }}
          exit={BASE_MOTION}
          transition={{
            duration: isScrolling ? ENTER_DURATION : EXIT_DURATION,
            ease: isScrolling ? ENTER_EASE : EXIT_EASE,
            scale: {
              duration: BOUNCE_DURATION,
              ease: BOUNCE_EASE,
            }
          }}
          className={CONTAINER_CLASS}
        >
          <div className={LABEL_CLASS} style={{ textRendering: "geometricPrecision" }}>
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