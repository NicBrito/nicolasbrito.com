"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
      duration: 0.38,
      ease: [0.32, 0.72, 0, 1],
    },
  },
};

const itemCascade: Variants = {
  closed: (direction: TransitionDirection = "overlay") => ({
    opacity: 0,
    x: direction === "forward" ? 16 : direction === "backward" ? -16 : 0,
    y: direction === "overlay" ? -18 : 0,
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
      duration: 0.32,
      ease: [0, 0, 0.58, 1],
    },
  },
  exit: (direction: TransitionDirection = "overlay") => ({
    opacity: 0,
    x: direction === "forward" ? -16 : direction === "backward" ? 16 : 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.22,
      ease: [0.42, 0, 1, 1],
    },
  }),
};

const staggerContainer: Variants = {
  open: (direction: TransitionDirection = "overlay") => ({
    transition: {
      staggerChildren: 0,
      ...(direction === "overlay" && { delayChildren: 0.06 }),
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
  const [activeSubmenu, setActiveSubmenu] = useState<MenuKey | null>(null);
  const [direction, setDirection] = useState<TransitionDirection>("overlay");
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const closeMenu = useCallback(() => {
    setDirection("overlay");
    setIsClosing(true);
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  }, []);

  const openSubmenu = useCallback((key: MenuKey) => {
    setDirection("forward");
    setActiveSubmenu(key);
  }, []);

  const goBack = useCallback(() => {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (activeSubmenu) {
          goBack();
        } else {
          closeMenu();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeSubmenu, goBack, closeMenu]);

  const currentSubmenu = activeSubmenu ? SUBMENU_CONFIG[activeSubmenu] : null;
  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      closeMenu();
      return;
    }

    setDirection("overlay");
    setActiveSubmenu(null);
    setIsOpen(true);
  }, [isOpen, closeMenu]);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? t("hamburger.close") : t("hamburger.open")}
        aria-expanded={isOpen}
        className="touch-menu-trigger relative z-60 ml-auto flex items-center justify-center size-10 -mr-2 rounded-full text-foreground/90 hover:text-foreground outline-none focus-visible:bg-white/20 transition-colors duration-200"
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
          setDirection("overlay");
        }}
      >
        {isOpen && (
          <motion.div
            variants={menuOverlay}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-x-0 top-0 z-50 bg-background overflow-hidden"
            style={{ willChange: "height", transform: "translateZ(0)" }}
          >
            <div className="mx-auto max-w-245 lg:max-w-300">
              <div className="flex items-end justify-between px-4 md:px-6 pt-6 pb-1 z-10">
                <AnimatePresence mode="wait" initial={false}>
                  {activeSubmenu ? (
                    <motion.button
                      key="back-button"
                      type="button"
                      aria-label={t("hamburger.back")}
                      initial={{ opacity: 0, x: 16, y: 0 }}
                      animate={
                        isClosing
                          ? {
                              opacity: 0,
                              x: 0,
                              y: -18,
                              transition: {
                                duration: 0.18,
                                ease: [0.42, 0, 1, 1],
                              },
                            }
                          : {
                              opacity: 1,
                              x: 0,
                              y: 0,
                              transition: {
                                duration: 0.25,
                                ease: [0, 0, 0.58, 1],
                              },
                            }
                      }
                      exit={
                        isClosing
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              x: 16,
                              y: 0,
                              transition: {
                                duration: 0.22,
                                ease: [0.42, 0, 1, 1],
                              },
                            }
                      }
                      className="flex items-center justify-center size-10 -ml-2 rounded-full outline-none focus-visible:bg-white/20 transition-colors duration-200 text-foreground/80 hover:text-foreground"
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
                  ) : (
                    <motion.span
                      key="header-spacer"
                      aria-hidden="true"
                      className="size-10 -ml-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div
                className="relative px-4 md:px-6 pt-[clamp(0.75rem,2.5vw,1.25rem)] overflow-y-auto"
                style={{
                  height: "calc(100dvh - 4rem)",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <AnimatePresence mode="sync">
                  {!activeSubmenu ? (
                    <motion.nav
                      key="main-menu"
                      aria-label={t("hamburger.main_menu")}
                      className="absolute inset-x-0 top-0"
                    >
                      <motion.ul
                        variants={staggerContainer}
                        initial="closed"
                        animate={isClosing ? "closed" : "open"}
                        exit="exit"
                        custom={direction}
                        className="touch-menu-list flex flex-col pl-[clamp(3rem,9vw,4.5rem)]"
                      >
                        {NAV_ITEMS.map((item) => (
                          <motion.li key={item.key} variants={itemCascade} custom={direction}>
                            {item.hasSubmenu ? (
                              <button
                                type="button"
                                onClick={() => openSubmenu(item.key as MenuKey)}
                                className="inline outline-none"
                              >
                                <span
                                  className="touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity cursor-pointer"
                                  style={{ textRendering: "geometricPrecision" }}
                                >
                                  {t(item.key)}
                                </span>
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={closeMenu}
                                className="inline outline-none"
                              >
                                <span
                                  className="touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
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
                    >
                      <motion.ul
                        variants={staggerContainer}
                        initial="closed"
                        animate={isClosing ? "closed" : "open"}
                        exit="exit"
                        custom={direction}
                        className="touch-menu-list flex flex-col pl-[clamp(3rem,9vw,4.5rem)]"
                      >
                        <motion.li variants={itemCascade} custom={direction}>
                          <Link
                            href={currentSubmenu!.href}
                            onClick={closeMenu}
                            className="inline outline-none"
                          >
                            <span
                              className="touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
                              style={{ textRendering: "geometricPrecision" }}
                            >
                              {t(currentSubmenu!.exploreKey)}
                            </span>
                          </Link>
                        </motion.li>

                        {currentSubmenu!.items.map((itemKey) => (
                          <motion.li key={itemKey} variants={itemCascade} custom={direction}>
                            <Link
                              href={currentSubmenu!.href}
                              onClick={closeMenu}
                              className="inline outline-none"
                            >
                              <span
                                className="touch-hamburger-text font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
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
