"use client";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  key: string;
  href: string;
  hasDropdown?: boolean;
};

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

type MenuKey = keyof typeof MENU_CONFIG;

const gridContainerVariants: Variants = {
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
};

const columnVariants: Variants = {
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
};

const contentItemVariants: Variants = {
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
};

const letterVariants: Variants = {
  initial: {
    opacity: 0,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.02,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    position: "absolute",
    transition: {
      duration: 0.06,
      ease: "linear"
    }
  }
};

const MorphingLabel = ({
  text,
  className,
  layoutIdPrefix
}: {
  text: string;
  className?: string;
  layoutIdPrefix: string;
}) => {
  const characters = text.split("");

  return (
    <div className={cn("inline-flex whitespace-nowrap", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {characters.map((char, i) => {
          const uniqueKey = `${layoutIdPrefix}-${char}-${i}`;

          return (
            <motion.span
              key={uniqueKey}
              variants={letterVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                "inline-block whitespace-pre",
                "will-change-opacity"
              )}
              style={{
                zIndex: 1
              }}
            >
              {char}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export function Navbar() {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const currentMenu = activeMenu ? MENU_CONFIG[activeMenu] : null;

  return (
    <>
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            style={{ willChange: "opacity" }}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="absolute top-0 inset-x-0 z-50 w-full"
        onMouseLeave={() => setActiveMenu(null)}
      >
        <motion.div
          className="relative z-50 border-b"
          animate={{
            backgroundColor: activeMenu ? "var(--background)" : "transparent",
            borderBottomColor: activeMenu ? "transparent" : "transparent"
          }}
          transition={{
            duration: activeMenu ? 0.2 : 0.6,
            ease: [0.32, 0.72, 0, 1]
          }}
        >
          <Container className="flex items-end justify-between md:justify-center h-auto pt-6 pb-1">
            <ul className="hidden md:flex items-center gap-12">
              {NAV_ITEMS.map((item) => (
                <li key={item.key} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "text-sm font-medium tracking-wide transition-colors duration-150 antialiased block leading-none",
                      activeMenu
                        ? (activeMenu === item.key ? "text-foreground" : "text-foreground/70")
                        : (pathname === item.href ? "text-white" : "text-white/70 hover:text-white")
                    )}
                    onMouseEnter={() => {
                      if (item.hasDropdown) setActiveMenu(item.key as MenuKey);
                      else setActiveMenu(null);
                    }}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
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
                className="absolute bottom-0 left-0 w-full h-[1px] bg-black/5 dark:bg-white/5 z-50"
              />

              <Container className="py-14">
                <motion.div
                  key="static-content-wrapper"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-12 gap-8 w-full"
                >

                  <motion.div
                    className="col-span-3 col-start-3 flex flex-col gap-3"
                    variants={columnVariants}
                  >
                    <motion.div
                      variants={contentItemVariants}
                      className="text-xs font-semibold text-foreground/50 mb-1 uppercase tracking-wider relative min-h-[1.5em] flex items-center overflow-hidden"
                    >
                      <MorphingLabel
                        text={t(currentMenu.exploreTitleKey)}
                        layoutIdPrefix="header-explore"
                        className="text-xs font-semibold"
                      />
                    </motion.div>

                    <motion.div variants={contentItemVariants}>
                      <Link
                        href={currentMenu.href}
                        className="block group w-fit"
                      >
                        <div className="text-2xl font-bold text-foreground/75 tracking-tight group-hover:text-foreground transition-colors duration-200 min-h-[1.5em] flex items-center overflow-hidden">
                          <MorphingLabel
                            text={t(currentMenu.exploreActionKey)}
                            layoutIdPrefix="action-explore"
                            className="text-2xl font-bold"
                          />
                        </div>
                      </Link>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="col-span-4 flex flex-col gap-4 pl-12"
                    variants={columnVariants}
                  >
                    <motion.div
                      variants={contentItemVariants}
                      className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wider relative min-h-[1.5em] flex items-center overflow-hidden"
                    >
                      <MorphingLabel
                        text={t(currentMenu.selectedTitleKey)}
                        layoutIdPrefix="header-selected"
                        className="text-xs font-semibold"
                      />
                    </motion.div>

                    <div className="flex flex-col gap-3.5 relative">
                      {currentMenu.items.map((itemKey, index) => (
                        <motion.div
                          key={index}
                          variants={contentItemVariants}
                        >
                          <Link
                            href={`${currentMenu.href}`}
                            className="group block w-fit"
                          >
                            <div className="text-[15px] font-medium text-foreground/75 group-hover:text-foreground transition-colors duration-200 flex items-center overflow-hidden h-6">
                              <MorphingLabel
                                text={t(`menu.${itemKey}`)}
                                layoutIdPrefix={`item-${index}`}
                                className="text-[15px] font-medium"
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