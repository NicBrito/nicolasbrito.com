"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { type MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

type MenuKey = "projects" | "games";
type TransitionDirection = "forward" | "backward" | "overlay";

type NavItem = {
  key: string;
  href: string;
  hasSubmenu?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "projects", href: "/projects", hasSubmenu: true },
  { key: "games", href: "/games", hasSubmenu: true },
  { key: "blog", href: "/blog" },
];

const SUBMENU_CONFIG = {
  projects: {
    items: ["project_1", "project_2", "project_3", "project_4", "project_5"],
    href: "/projects",
    exploreKey: "actions.explore_all_projects",
  },
  games: {
    items: ["game_1", "game_2", "game_3", "game_4", "game_5"],
    href: "/games",
    exploreKey: "actions.explore_all_games",
  },
} as const;

const HAMBURGER_ICON_TRANSITION = {
  duration: 0.26,
  ease: [0.2, 0, 0.2, 1] as [number, number, number, number],
};

const menuOverlay: Variants = {
  closed: {
    height: 0,
    transition: {
      duration: 0.36,
      ease: [0.42, 0, 0.58, 1],
    },
  },
  open: {
    height: "100dvh",
    transition: {
      duration: 0.56,
      ease: [0.22, 0.68, 0, 1],
    },
  },
};

const itemCascade: Variants = {
  closed: (dirRef: MutableRefObject<TransitionDirection>) => ({
    opacity: 0,
    x: dirRef.current === "forward" ? 16 : dirRef.current === "backward" ? -16 : 0,
    y: dirRef.current === "overlay" ? -18 : 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.18,
      ease: [0.42, 0, 1, 1],
    },
  }),
  open: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (dirRef: MutableRefObject<TransitionDirection>) => ({
    opacity: 0,
    x: dirRef.current === "forward" ? -16 : dirRef.current === "backward" ? 16 : 0,
    filter: "blur(4px)",
    transition: {
      duration: dirRef.current === "overlay" ? 0.18 : 0.28,
      ease: [0.42, 0, 1, 1],
    },
  }),
};

const staggerContainer: Variants = {
  open: (dirRef: MutableRefObject<TransitionDirection>) => ({
    transition: {
      staggerChildren: 0,
      ...(dirRef.current === "overlay" && { delayChildren: 0.18, staggerChildren: 0.04 }),
    },
  }),
  closed: {
    transition: {
      staggerChildren: 0,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0,
    },
  },
};

export function HamburgerMenu() {
  const t = useTranslations("Navbar");
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<MenuKey | null>(null);
  const [direction, setDirection] = useState<TransitionDirection>("overlay");
  const directionRef = useRef<TransitionDirection>("overlay");
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    directionRef.current = "overlay";
    setDirection("overlay");
    setIsClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      triggerButtonRef.current?.focus();
    }, 180);
  }, []);

  const openSubmenu = useCallback((key: MenuKey) => {
    directionRef.current = "forward";
    setDirection("forward");
    setActiveSubmenu(key);
  }, []);

  const goBack = useCallback(() => {
    directionRef.current = "backward";
    setDirection("backward");
    setActiveSubmenu(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyboardNavigation = (event: KeyboardEvent) => {
      if (
        event.key === "Tab" ||
        event.key === "Enter" ||
        event.key === " " ||
        event.key.startsWith("Arrow")
      ) {
        setIsKeyboardNavigation(true);
      }
    };

    const handlePointerNavigation = () => {
      setIsKeyboardNavigation(false);
    };

    document.addEventListener("keydown", handleKeyboardNavigation);
    document.addEventListener("pointerdown", handlePointerNavigation);

    return () => {
      document.removeEventListener("keydown", handleKeyboardNavigation);
      document.removeEventListener("pointerdown", handlePointerNavigation);
    };
  }, []);

  useEffect(() => {
    if (isOpen && !activeSubmenu && !isClosing) {
      const timer = setTimeout(() => triggerButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeSubmenu, isClosing]);

  useEffect(() => {
    if (activeSubmenu) {
      const timer = setTimeout(() => backButtonRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [activeSubmenu]);

  useEffect(() => {
    if (!isOpen || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeSubmenu) {
          goBack();
        } else {
          closeMenu();
        }
        return;
      }

      if (e.key !== "Tab") return;

      const navItems = menuContentRef.current
        ? Array.from(
            menuContentRef.current.querySelectorAll<HTMLElement>("a[href], button")
          ).filter((el) => el.offsetParent !== null)
        : [];

      const focusable: HTMLElement[] = activeSubmenu
        ? [
            ...(backButtonRef.current ? [backButtonRef.current] : []),
            ...navItems,
            ...(triggerButtonRef.current ? [triggerButtonRef.current] : []),
          ]
        : [
            ...(triggerButtonRef.current ? [triggerButtonRef.current] : []),
            ...navItems,
          ];

      if (focusable.length === 0) return;

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();

      if (e.shiftKey) {
        const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
        focusable[prevIndex].focus();
      } else {
        const nextIndex =
          currentIndex < 0 || currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
        focusable[nextIndex].focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, activeSubmenu, goBack, closeMenu]);

  const currentSubmenu = activeSubmenu ? SUBMENU_CONFIG[activeSubmenu] : null;
  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      closeMenu();
      return;
    }

    directionRef.current = "overlay";
    setDirection("overlay");
    setActiveSubmenu(null);
    setIsOpen(true);
  }, [isOpen, closeMenu]);

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        aria-label={isOpen ? t("hamburger.close") : t("hamburger.open")}
        aria-expanded={isOpen}
        className={`touch-menu-trigger relative z-60 ml-auto flex items-center justify-center size-10 -mr-2 rounded-full text-foreground/90 hover:text-foreground outline-none transition-colors duration-200 ${isKeyboardNavigation ? "focus-visible:bg-white/20" : ""}`}
        onClick={handleTriggerClick}
      >
        <div className="touch-hamburger-glyph relative w-5.5 h-4.5">
          <motion.span
            className="absolute left-0 w-full h-[1.75px] bg-current rounded-full"
            animate={{
              top: isOpen ? "50%" : "0%",
              rotate: isOpen ? 45 : 0,
              y: isOpen ? "-50%" : "0%",
            }}
            transition={HAMBURGER_ICON_TRANSITION}
          />
          <motion.span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1.75px] bg-current rounded-full"
            animate={{ opacity: isOpen ? 0 : 1, scaleX: isOpen ? 0 : 1 }}
            transition={HAMBURGER_ICON_TRANSITION}
          />
          <motion.span
            className="absolute left-0 w-full h-[1.75px] bg-current rounded-full"
            animate={{
              bottom: isOpen ? "50%" : "0%",
              rotate: isOpen ? -45 : 0,
              y: isOpen ? "50%" : "0%",
            }}
            transition={HAMBURGER_ICON_TRANSITION}
          />
        </div>
      </button>

      <AnimatePresence
        onExitComplete={() => {
          setActiveSubmenu(null);
          directionRef.current = "overlay";
          setDirection("overlay");
        }}
      >
        {isOpen && (
          <motion.div
            variants={menuOverlay}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label={t("hamburger.main_menu")}
            className="fixed inset-x-0 top-0 z-50 bg-background overflow-x-hidden"
            style={{ willChange: "height", transform: "translateZ(0)" }}
          >
            <div className="mx-auto max-w-245 lg:max-w-300">
              <div className="flex items-end justify-between px-4 md:px-6 pt-6 pb-1 z-10">
                <motion.button
                  ref={backButtonRef}
                  type="button"
                  aria-label={t("hamburger.back")}
                  tabIndex={activeSubmenu && !isClosing ? 0 : -1}
                  initial={false}
                  animate={
                    activeSubmenu && !isClosing
                      ? {
                          opacity: 1,
                          x: 0,
                          y: 0,
                          filter: "blur(0px)",
                          transition: {
                            duration: 0.5,
                            delay: 0.28,
                            ease: [0.16, 1, 0.3, 1],
                          },
                        }
                      : isClosing
                        ? {
                            opacity: 0,
                            x: 0,
                            y: -18,
                            filter: "blur(4px)",
                            transition: {
                              duration: 0.18,
                              ease: [0.42, 0, 1, 1],
                            },
                          }
                        : {
                            opacity: 0,
                            x: 16,
                            y: 0,
                            filter: "blur(4px)",
                            transition: {
                              duration: direction === "backward" ? 0.28 : 0,
                              ease: [0.42, 0, 1, 1],
                            },
                          }
                  }
                  className={`flex items-center justify-center size-10 -ml-2 rounded-full outline-none transition-colors duration-200 text-foreground/80 hover:text-foreground ${isKeyboardNavigation ? "focus-visible:bg-white/20" : ""}`}
                  style={{ pointerEvents: activeSubmenu && !isClosing ? "auto" : "none" }}
                  onClick={goBack}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="touch-back-icon stroke-current"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11.25 3.75L5.75 9L11.25 14.25" />
                  </svg>
                </motion.button>
              </div>

              <div
                ref={menuContentRef}
                className="relative px-4 md:px-6 pt-[clamp(0.75rem,2.5vw,1.25rem)] overflow-y-auto"
                style={{
                  height: "calc(100dvh - 4rem)",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <AnimatePresence mode="wait">
                  {!activeSubmenu ? (
                    <motion.nav
                      key="main-menu"
                      aria-label={t("hamburger.main_menu")}
                      className="absolute inset-x-0 top-0"
                      exit={{ transition: { duration: 0.28 } }}
                    >
                      <motion.ul
                        variants={staggerContainer}
                        initial="closed"
                        animate={isClosing ? "closed" : "open"}
                        exit="exit"
                        custom={directionRef}
                        className="touch-menu-list flex flex-col pt-6 pl-[clamp(3rem,9vw,4.5rem)]"
                      >
                        {NAV_ITEMS.map((item) => (
                          <motion.li key={item.key} variants={itemCascade} custom={directionRef}>
                            {item.hasSubmenu ? (
                              <button
                                type="button"
                                onClick={() => openSubmenu(item.key as MenuKey)}
                                className="inline outline-none group"
                              >
                                <span
                                  className={`touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity cursor-pointer ${isKeyboardNavigation ? "group-focus-visible:opacity-70" : ""}`}
                                  style={{ textRendering: "geometricPrecision" }}
                                >
                                  {t(item.key)}
                                </span>
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={closeMenu}
                                className="inline outline-none group"
                              >
                                <span
                                  className={`touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity ${isKeyboardNavigation ? "group-focus-visible:opacity-70" : ""}`}
                                  style={{ textRendering: "geometricPrecision" }}
                                >
                                  {t(item.key)}
                                </span>
                              </Link>
                            )}
                          </motion.li>
                        ))}
                      </motion.ul>
                    </motion.nav>
                  ) : (
                    <motion.nav
                      key={`submenu-${activeSubmenu}`}
                      aria-label={t(activeSubmenu)}
                      className="absolute inset-x-0 top-0"
                      exit={{ transition: { duration: 0.28 } }}
                    >
                      <motion.ul
                        variants={staggerContainer}
                        initial="closed"
                        animate={isClosing ? "closed" : "open"}
                        exit="exit"
                        custom={directionRef}
                        className="touch-menu-list flex flex-col pt-6 pl-[clamp(3rem,9vw,4.5rem)]"
                      >
                        <motion.li variants={itemCascade} custom={directionRef}>
                          <Link
                            href={currentSubmenu!.href}
                            onClick={closeMenu}
                            className="inline outline-none group"
                          >
                            <span
                              className={`touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity ${isKeyboardNavigation ? "group-focus-visible:opacity-70" : ""}`}
                              style={{ textRendering: "geometricPrecision" }}
                            >
                              {t(currentSubmenu!.exploreKey)}
                            </span>
                          </Link>
                        </motion.li>

                        {currentSubmenu!.items.map((itemKey) => (
                          <motion.li key={itemKey} variants={itemCascade} custom={directionRef}>
                            <Link
                              href={currentSubmenu!.href}
                              onClick={closeMenu}
                              className="inline outline-none group"
                            >
                              <span
                                className={`touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity ${isKeyboardNavigation ? "group-focus-visible:opacity-70" : ""}`}
                                style={{ textRendering: "geometricPrecision" }}
                              >
                                {t(`menu.${itemKey}`)}
                              </span>
                            </Link>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}