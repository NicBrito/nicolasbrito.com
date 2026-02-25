"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type MenuKey = "projects" | "games";

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
  duration: 0.3,
  ease: [0.2, 0, 0.2, 1] as [number, number, number, number],
};

const menuOverlay: Variants = {
  closed: {
    height: 0,
    transition: {
      duration: 0.62,
      ease: [0.4, 0.0, 0.2, 1],
      when: "afterChildren",
    },
  },
  open: {
    height: "100dvh",
    transition: {
      duration: 0.48,
      ease: [0.2, 0, 0.2, 1],
      when: "beforeChildren",
    },
  },
};

const menuContent: Variants = {
  closed: {
    opacity: 0,
    y: -6,
    filter: "blur(8px)",
    transition: {
      duration: 0.24,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  open: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.32,
      delay: 0.08,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  },
};

const itemCascade: Variants = {
  closed: {
    opacity: 0,
    y: -10,
    filter: "blur(12px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  open: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.28,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  },
};

const staggerContainer: Variants = {
  closed: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const submenuSlideForward: Variants = {
  initial: {
    x: 34,
    opacity: 0,
    filter: "blur(10px)",
  },
  animate: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.26,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  },
  exit: {
    x: -28,
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

const submenuSlideBackward: Variants = {
  initial: {
    x: -34,
    opacity: 0,
    filter: "blur(10px)",
  },
  animate: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.26,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  },
  exit: {
    x: 28,
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

const submenuStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
};

export function HamburgerMenu() {
  const t = useTranslations("Navbar");
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<MenuKey | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setActiveSubmenu(null);
    setIsOpen(false);
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

  const slideVariants = direction === "forward" ? submenuSlideForward : submenuSlideBackward;
  const currentSubmenu = activeSubmenu ? SUBMENU_CONFIG[activeSubmenu] : null;
  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      closeMenu();
      return;
    }

    setDirection("forward");
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            variants={menuOverlay}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-x-0 top-0 z-50 bg-background overflow-hidden"
            style={{ willChange: "height" }}
          >
            <motion.div
              className="mx-auto max-w-[980px] lg:max-w-[1200px]"
              variants={menuContent}
            >
              <div className="flex items-end justify-between px-4 md:px-6 pt-6 pb-1 z-10">
                <AnimatePresence mode="wait" initial={false}>
                  {activeSubmenu ? (
                    <motion.button
                      key="back-button"
                      type="button"
                      aria-label={t("hamburger.back")}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.22, ease: [0.2, 0.65, 0.3, 0.9] }}
                      className="flex items-center justify-center size-10 -ml-2 rounded-full outline-none focus-visible:bg-white/20 transition-colors duration-200 text-foreground/80 hover:text-foreground"
                      onClick={goBack}
                    >
                      <svg
                        width="26"
                        height="26"
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
                className="relative px-4 md:px-6 pt-6 overflow-y-auto"
                style={{
                  height: "calc(100dvh - 4rem)",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {!activeSubmenu ? (
                    <motion.nav
                      key="main-menu"
                      variants={staggerContainer}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      aria-label="Main menu"
                    >
                      <ul className="touch-menu-list flex flex-col gap-y-2 pl-6 sm:pl-8">
                        {NAV_ITEMS.map((item) => (
                          <motion.li key={item.key} variants={itemCascade}>
                            {item.hasSubmenu ? (
                              <button
                                type="button"
                                onClick={() => openSubmenu(item.key as MenuKey)}
                                className="inline outline-none"
                              >
                                <span
                                  className="touch-hamburger-text text-[clamp(1.4375rem,6.2vw,1.95rem)] font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity cursor-pointer"
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
                                  className="touch-hamburger-text text-[clamp(1.4375rem,6.2vw,1.95rem)] font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
                                  style={{ textRendering: "geometricPrecision" }}
                                >
                                  {t(item.key)}
                                </span>
                              </Link>
                            )}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.nav>
                  ) : (
                    <motion.nav
                      key={`submenu-${activeSubmenu}`}
                      variants={submenuStagger}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      aria-label={t(activeSubmenu)}
                    >
                      <ul className="touch-menu-list flex flex-col gap-y-2 pl-6 sm:pl-8">
                        <motion.li variants={slideVariants}>
                          <Link
                            href={currentSubmenu!.href}
                            onClick={closeMenu}
                            className="inline outline-none"
                          >
                            <span
                              className="touch-hamburger-text text-[clamp(1.4375rem,6.2vw,1.95rem)] font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
                              style={{ textRendering: "geometricPrecision" }}
                            >
                              {t(currentSubmenu!.exploreKey)}
                            </span>
                          </Link>
                        </motion.li>

                        {currentSubmenu!.items.map((itemKey) => (
                          <motion.li key={itemKey} variants={slideVariants}>
                            <Link
                              href={currentSubmenu!.href}
                              onClick={closeMenu}
                              className="inline outline-none"
                            >
                              <span
                                className="touch-hamburger-text text-[clamp(1.4375rem,6.2vw,1.95rem)] font-bold text-foreground tracking-tight leading-relaxed hover:opacity-70 transition-opacity"
                                style={{ textRendering: "geometricPrecision" }}
                              >
                                {t(`menu.${itemKey}`)}
                              </span>
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
