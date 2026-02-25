"use client";

import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { Container } from "@/components/ui/Container";
import { MorphingLabel } from "@/components/ui/MorphingLabel";
import { morphingLabelSpeed } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  key: string;
  href: string;
  hasDropdown?: boolean;
};

type MenuKey = keyof typeof MENU_CONFIG;

const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "projects", href: "/projects", hasDropdown: true },
  { key: "games", href: "/games", hasDropdown: true },
  { key: "blog", href: "/blog" },
];

const MENU_CONFIG = {
  projects: {
    id: 0,
    items: ["project_1", "project_2", "project_3", "project_4", "project_5"],
    href: "/projects",
    exploreTitleKey: "headers.explore_projects",
    exploreActionKey: "actions.explore_all_projects",
    selectedTitleKey: "headers.selected_projects"
  },
  games: {
    id: 1,
    items: ["game_1", "game_2", "game_3", "game_4", "game_5"],
    href: "/games",
    exploreTitleKey: "headers.explore_games",
    exploreActionKey: "actions.explore_all_games",
    selectedTitleKey: "headers.selected_games"
  }
} as const;

const ANIMATIONS = {
  gridContainer: {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.15,
        staggerChildren: 0
      }
    },
    exit: {
      opacity: 1,
      transition: {
        when: "afterChildren"
      }
    }
  } as Variants,
  column: {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    },
    exit: {
      opacity: 1,
      transition: {
        staggerChildren: 0
      }
    }
  } as Variants,
  contentItem: {
    hidden: {
      opacity: 0,
      y: 8,
      filter: "blur(12px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.4,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    },
    exit: {
      opacity: 0,
      y: 0,
      filter: "blur(10px)",
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  } as Variants,
};

export function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [focusedNavItem, setFocusedNavItem] = useState<string | null>(null);
  const currentMenu = activeMenu ? MENU_CONFIG[activeMenu] : null;

  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const dropdownItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const escKeyPressedRef = useRef(false);

  const setNavItemRef = useCallback((key: string, el: HTMLAnchorElement | null) => {
    if (el) {
      navItemRefs.current.set(key, el);
    } else {
      navItemRefs.current.delete(key);
    }
  }, []);

  const setDropdownItemRef = useCallback((key: string, el: HTMLAnchorElement | null) => {
    if (el) {
      dropdownItemRefs.current.set(key, el);
    } else {
      dropdownItemRefs.current.delete(key);
    }
  }, []);

  const exploreItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  const setExploreItemRef = useCallback((key: string, el: HTMLAnchorElement | null) => {
    if (el) {
      exploreItemRefs.current.set(key, el);
    } else {
      exploreItemRefs.current.delete(key);
    }
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (activeMenu) {
      timeout = setTimeout(() => {
        setIsNavbarVisible(true);
      }, 0);
    } else {
      timeout = setTimeout(() => {
        setIsNavbarVisible(false);
      }, 850);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [activeMenu]);

  const handleDropdownKeyDown = useCallback((
    e: React.KeyboardEvent,
    itemIndex: number,
    menuKey: MenuKey
  ) => {
    const menuConfig = MENU_CONFIG[menuKey];
    const isLastItem = itemIndex === menuConfig.items.length - 1;
    const currentNavIndex = NAV_ITEMS.findIndex(item => item.key === menuKey);

    if (e.key === "Escape") {
      e.preventDefault();
      escKeyPressedRef.current = true;
      const navRef = navItemRefs.current.get(menuKey);
      if (navRef) {
        navRef.focus();
      }
      setActiveMenu(null);
      setFocusedNavItem(menuKey);
    } else if (e.key === "Tab" && !e.shiftKey && isLastItem) {
      const nextNavItem = NAV_ITEMS[currentNavIndex + 1];

      if (nextNavItem) {
        e.preventDefault();
        setActiveMenu(null);
        setTimeout(() => {
          const nextRef = navItemRefs.current.get(nextNavItem.key);
          if (nextRef) {
            nextRef.focus();
          }
        }, 100);
      } else {
        setActiveMenu(null);
        setFocusedNavItem(null);
      }
    } else if (e.key === "Tab" && e.shiftKey && itemIndex === 0) {
      e.preventDefault();
      const exploreLink = exploreItemRefs.current.get(`${menuKey}-explore`);
      if (exploreLink) {
        exploreLink.focus();
      }
    }
  }, []);

  const handleNavItemFocus = useCallback((item: NavItem) => {
    setFocusedNavItem(item.key);
  }, []);

  const handleNavItemBlur = useCallback((e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isMovingWithinNavbar = relatedTarget?.closest('nav[role="navigation"]');

    if (!isMovingWithinNavbar) {
      setFocusedNavItem(null);
      setActiveMenu(null);
      escKeyPressedRef.current = false;
    } else {
      setFocusedNavItem(null);
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusedElement = document.activeElement as HTMLElement;
        const nav = document.querySelector('nav[role="navigation"]');

        if (!nav?.contains(focusedElement) && focusedElement !== document.body) {
          escKeyPressedRef.current = false;
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleNavItemKeyDown = useCallback((
    e: React.KeyboardEvent,
    item: NavItem,
    itemIndex: number
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setActiveMenu(null);
      setFocusedNavItem(null);
    } else if (e.key === "Tab" && !e.shiftKey) {
      if (item.hasDropdown && !escKeyPressedRef.current) {
        e.preventDefault();
        setActiveMenu(item.key as MenuKey);
        setTimeout(() => {
          const exploreLink = exploreItemRefs.current.get(`${item.key}-explore`);
          if (exploreLink) {
            exploreLink.focus();
          }
        }, 100);
      } else if (item.key === "blog") {
        e.preventDefault();
        setActiveMenu(null);
        setFocusedNavItem(null);
        setTimeout(() => {
          const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const focusableElements = Array.from(
            document.querySelectorAll(focusableSelector)
          ) as HTMLElement[];

          const nav = document.querySelector('nav[role="navigation"]');
          const navBottom = nav?.getBoundingClientRect().bottom || 0;

          const nextElement = focusableElements.find(el => {
            const isInNav = nav?.contains(el);
            const rect = el.getBoundingClientRect();
            return !isInNav && rect.top >= navBottom - 10;
          });

          if (nextElement) {
            nextElement.focus();
          }
        }, 0);
      } else if (escKeyPressedRef.current) {
        escKeyPressedRef.current = false;
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      if (item.hasDropdown && activeMenu === item.key) {
        e.preventDefault();
        setActiveMenu(null);
      } else if (itemIndex === 0 && activeMenu === null) {
        setFocusedNavItem(null);
      }
    }
  }, [activeMenu]);

  const handleExploreKeyDown = useCallback((
    e: React.KeyboardEvent,
    menuKey: MenuKey
  ) => {
    const menuConfig = MENU_CONFIG[menuKey];

    if (e.key === "Escape") {
      e.preventDefault();
      escKeyPressedRef.current = true;
      const navRef = navItemRefs.current.get(menuKey);
      if (navRef) {
        navRef.focus();
      }
      setActiveMenu(null);
      setFocusedNavItem(menuKey);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const firstItemKey = `${menuKey}-${menuConfig.items[0]}`;
      const firstDropdownItem = dropdownItemRefs.current.get(firstItemKey);
      if (firstDropdownItem) {
        firstDropdownItem.focus();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      const navRef = navItemRefs.current.get(menuKey);
      if (navRef) {
        navRef.focus();
      }
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
            style={{ willChange: "opacity" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.nav
        role="navigation"
        aria-label="Main navigation"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="absolute top-0 inset-x-0 z-50 w-full"
        onMouseLeave={() => {
          if (!focusedNavItem) {
            setActiveMenu(null);
          }
        }}
      >
        <motion.div
          className="relative z-50 border-b border-white/0"
          animate={{
            backgroundColor: isNavbarVisible ? "var(--background)" : "transparent",
            borderBottomColor: isNavbarVisible ? "transparent" : "transparent"
          }}
          transition={{
            duration: isNavbarVisible ? 0.2 : 0.8,
            ease: "easeInOut"
          }}
        >
          <Container className="flex items-end justify-center h-auto pt-6 pb-1">
            <ul className="touch-desktop-nav items-center gap-[clamp(1.5rem,4vw,3rem)] flex-wrap justify-center">
              {NAV_ITEMS.map((item, index) => (
                <li key={item.key} className="relative">
                  <Link
                    ref={(el) => setNavItemRef(item.key, el)}
                    href={item.href}
                    data-nav-item
                    tabIndex={0}
                    aria-haspopup={item.hasDropdown ? "menu" : undefined}
                    aria-expanded={item.hasDropdown && activeMenu === item.key ? true : undefined}
                    className={cn(
                      "text-[clamp(0.75rem,2vw,0.9375rem)] font-medium tracking-wide transition-all duration-300 antialiased block leading-none",
                      "py-1.5 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-full",
                      "outline-none focus:bg-white/20 focus-visible:bg-white/20",
                      isNavbarVisible
                        ? (
                            activeMenu === item.key || focusedNavItem === item.key
                              ? "text-foreground"
                              : "text-foreground/70 hover:text-foreground focus:text-foreground focus-visible:text-foreground"
                          )
                        : (pathname === item.href || focusedNavItem === item.key ? "text-white" : "text-white/70 hover:text-white focus:text-white focus-visible:text-white")
                    )}
                    onMouseEnter={() => {
                      if (item.hasDropdown) setActiveMenu(item.key as MenuKey);
                      else setActiveMenu(null);
                    }}
                    onFocus={() => handleNavItemFocus(item)}
                    onBlur={handleNavItemBlur}
                    onKeyDown={(e) => handleNavItemKeyDown(e, item, index)}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
            <HamburgerMenu />
          </Container>
        </motion.div>

        <AnimatePresence>
          {activeMenu && currentMenu && (
            <motion.div
              layoutId="dropdown-background"
              initial={{ opacity: 1, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{
                opacity: 1,
                height: 0,
                transition: {
                  delay: 0.2,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 40,
                  mass: 1
                }
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 40,
                mass: 1,
              }}
              className="absolute top-full left-0 w-full bg-background overflow-hidden z-40"
              style={{ transformOrigin: "top" }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="absolute bottom-0 left-0 w-full h-px bg-white/5 z-50"
              />

              <Container className="py-[clamp(2rem,5vw,3.5rem)]">
                <motion.div
                  key="static-content-wrapper"
                  variants={ANIMATIONS.gridContainer}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-1 sm:grid-cols-12 gap-[clamp(1.5rem,3vw,2rem)] w-full"
                >

                  <motion.div
                    className="col-span-1 sm:col-span-3 sm:col-start-3 flex flex-col gap-3"
                    variants={ANIMATIONS.column}
                  >
                    <motion.div
                        variants={ANIMATIONS.contentItem}
                      className="text-xs font-semibold text-foreground/50 mb-1 uppercase tracking-wider relative min-h-[1.5em] flex items-center overflow-hidden"
                    >
                      <MorphingLabel
                        text={t(currentMenu.exploreTitleKey)}
                        layoutIdPrefix="header-explore"
                        className="text-xs font-semibold"
                          animationDuration={morphingLabelSpeed.default}
                      />
                    </motion.div>

                      <motion.div variants={ANIMATIONS.contentItem}>
                      <Link
                        ref={(el) => setExploreItemRef(`${activeMenu}-explore`, el)}
                        href={currentMenu.href}
                        className={cn(
                          "block group w-fit",
                          "py-1 px-2 -mx-2 rounded-full",
                          "outline-none focus:bg-white/20 focus-visible:bg-white/20",
                          "transition-all duration-200"
                        )}
                        data-dropdown-item
                        tabIndex={0}
                        onKeyDown={(e) => handleExploreKeyDown(e, activeMenu!)}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          const isMovingWithinNavbar = relatedTarget?.closest('nav[role="navigation"]');

                          if (!isMovingWithinNavbar) {
                            setActiveMenu(null);
                            setFocusedNavItem(null);
                          }
                        }}
                      >
                        <div className="text-[clamp(1.25rem,3.75vw,2rem)] font-bold text-foreground/75 tracking-tight group-hover:text-foreground group-focus:text-foreground group-focus-visible:text-foreground transition-colors duration-200 min-h-[1.5em] flex items-center overflow-hidden">
                          <MorphingLabel
                            text={t(currentMenu.exploreActionKey)}
                            layoutIdPrefix="action-explore"
                            className="text-[clamp(1.25rem,3.75vw,2rem)] font-bold"
                              animationDuration={morphingLabelSpeed.default}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="col-span-1 sm:col-span-4 sm:col-start-7 flex flex-col gap-4 pl-0 sm:pl-12"
                    variants={ANIMATIONS.column}
                  >
                    <motion.div
                        variants={ANIMATIONS.contentItem}
                      className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wider relative min-h-[1.5em] flex items-center overflow-hidden"
                    >
                      <MorphingLabel
                        text={t(currentMenu.selectedTitleKey)}
                        layoutIdPrefix="header-selected"
                        className="text-xs font-semibold"
                          animationDuration={morphingLabelSpeed.default}
                      />
                    </motion.div>

                    <div className="flex flex-col gap-3.5 relative">
                      {currentMenu.items.map((itemKey, index) => (
                        <motion.div
                          key={index}
                          variants={ANIMATIONS.contentItem}
                        >
                          <Link
                            ref={(el) => setDropdownItemRef(`${activeMenu}-${itemKey}`, el)}
                            href={`${currentMenu.href}`}
                            data-dropdown-item
                            tabIndex={0}
                            className={cn(
                              "group block w-fit",
                              "py-1 px-2 -mx-2 rounded-full",
                              "outline-none focus:bg-white/20 focus-visible:bg-white/20",
                              "transition-all duration-200"
                            )}
                            onKeyDown={(e) => handleDropdownKeyDown(e, index, activeMenu!)}
                            onBlur={(e) => {
                              const relatedTarget = e.relatedTarget as HTMLElement;
                              const isMovingWithinNavbar = relatedTarget?.closest('nav[role="navigation"]');

                              if (!isMovingWithinNavbar) {
                                setActiveMenu(null);
                                setFocusedNavItem(null);
                              }
                            }}
                          >
                            <div className="text-[clamp(0.8125rem,2.5vw,1rem)] font-medium text-foreground/75 group-hover:text-foreground group-focus:text-foreground group-focus-visible:text-foreground transition-colors duration-200 flex items-center overflow-hidden h-6">
                              <MorphingLabel
                                text={t(`menu.${itemKey}`)}
                                layoutIdPrefix={`item-${index}`}
                                className="text-[clamp(0.8125rem,2.5vw,1rem)] font-medium"
                                animationDuration={morphingLabelSpeed.default}
                              />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}