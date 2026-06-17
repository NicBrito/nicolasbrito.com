"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { NOISE_SVG } from "@/lib/assets";
import { cn } from "@/lib/utils";

import { GameCardActions } from "./GameCardActions";
import {
  CARD_STAGGER_S,
  CONTENT_Y_DEFAULT,
  EASE_ACCEL,
  EASE_CSS,
  EASE_IN,
  EASE_OUT,
  ORB_VARIANTS,
  TEXT_ENTER_S,
  type GameConfig,
} from "./constants";

export interface GameCardProps {
  game:           GameConfig;
  index:          number;
  total:          number;
  isActive:       boolean;
  isHoverActive:  boolean;
  started:        boolean;
  hasPointer:     boolean;
  reduced:        boolean;
  textVisible:    boolean;
  enterX:         number;
  exitX:          number;
  /** Duration (s) of the text/action exit animation. */
  exitDuration:    number;
  /** Delay (s) before the BUTTONS exit fires — creates a text-first stagger on manual swaps. */
  btnsExitDelay:   number;
  cardWidth:      number;
  variants:       Variants;
  title:          string;
  description:    string;
  viewLabel:      string;
  playLabel:      string;
  onHoverStart:   () => void;
  onHoverEnd:     () => void;
  onActivate:     () => void;
  /** Reports pointer hover over the action buttons (to pause autoplay). */
  onActionsHover: (hovered: boolean) => void;
  /**
   * True when this card is the one that just slid away on a manual swap AND
   * pointer hover was active at the moment of the swap. Holds the pointer-mode
   * buttons wrapper at { opacity:1, y:0 } through the exit delay so they don't
   * visibly retract while the card is still on screen.
   */
  isExitingWithHover: boolean;
  registerPrimary:    (el: HTMLElement | null) => void;
  registerSecondary:  (el: HTMLElement | null) => void;
  onPrimaryKeyDown:   (e: React.KeyboardEvent<HTMLElement>) => void;
  onSecondaryKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

/**
 * A single slide in the games carousel. Purely presentational: every piece of
 * state and every handler is supplied by `GamesSection`, which owns the
 * carousel's logic. Rendered for all games at once; the active one reveals its
 * text/actions while the rest sit as ambient, dimmed backdrops.
 */
export function GameCard({
  game,
  index,
  total,
  isActive,
  isHoverActive,
  started,
  hasPointer,
  reduced,
  textVisible,
  enterX,
  exitX,
  exitDuration,
  btnsExitDelay,
  cardWidth,
  variants,
  title,
  description,
  viewLabel,
  playLabel,
  onHoverStart,
  onHoverEnd,
  onActivate,
  onActionsHover,
  isExitingWithHover,
  registerPrimary,
  registerSecondary,
  onPrimaryKeyDown,
  onSecondaryKeyDown,
}: GameCardProps) {
  const hasImage = !!game.image;

  return (
    <motion.div
      custom={index * CARD_STAGGER_S}
      variants={variants}
      initial="hidden"
      animate={started ? ["visible", isHoverActive ? "hover" : "rest"] : "hidden"}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}`}
      aria-current={isActive ? "true" : undefined}
      onClick={onActivate}
      className={cn(
        "project-card group relative flex flex-col justify-end overflow-clip",
        "border border-white/5 bg-card",
        "shadow-sm transition-shadow duration-500",
        isHoverActive && "shadow-2xl",
      )}
      style={{
        width:         cardWidth,
        height:        "100%",
        flexShrink:    0,
        borderRadius:  "2rem",
        willChange:    "transform",
        pointerEvents: hasPointer ? "auto" : isActive ? "auto" : "none",
        cursor:        !isActive && hasPointer ? "pointer" : "default",
      }}
    >
      <div
        className="absolute inset-0 z-0 overflow-clip transform-gpu"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          className="absolute inset-0 w-full h-full z-0"
        >
          <motion.div variants={ORB_VARIANTS} custom={0.1} className="absolute inset-0">
            <div
              className={cn(
                "absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-15",
                "transform-gpu",
                game.colors.from,
              )}
            />
          </motion.div>

          <motion.div variants={ORB_VARIANTS} custom={0.3} className="absolute inset-0">
            <div
              className={cn(
                "absolute bottom-0 -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-15",
                "transform-gpu",
                game.colors.to,
              )}
            />
          </motion.div>

          {!hasImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                animate={isHoverActive ? { scale: 0.85 } : { scale: 0.8 }}
                transition={{ duration: 0.30, ease: EASE_CSS }}
                className="opacity-[0.05]"
              >
                <ImageIcon size={200} strokeWidth={0.5} />
              </motion.div>
            </motion.div>
          )}

          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url("${NOISE_SVG}")` }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
        </motion.div>

        {hasImage && (
          <motion.div
            className="absolute inset-0 w-full h-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Image
              src={game.image!}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none z-20"
              style={{
                backdropFilter:       "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                maskImage:            "linear-gradient(to top, black 50%, transparent 100%)",
                WebkitMaskImage:      "linear-gradient(to top, black 50%, transparent 100%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20 opacity-90" />
          </motion.div>
        )}
      </div>

      <motion.div
        className="relative z-30 flex flex-col p-8 md:p-12"
        animate={{ y: hasPointer && !isHoverActive && !isExitingWithHover ? CONTENT_Y_DEFAULT : 0 }}
        transition={{ y: { duration: 0.30, ease: EASE_CSS } }}
      >
        <AnimatePresence>
          {isActive && textVisible && (
            <motion.div
              key={`text-${game.id}`}
              initial={{ opacity: 0, x: reduced ? 0 : enterX }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x:       reduced ? 0 : exitX,
                transition: { duration: exitDuration, ease: EASE_IN },
              }}
              transition={{
                x:       { duration: TEXT_ENTER_S, ease: EASE_OUT },
                opacity: { duration: TEXT_ENTER_S * 0.7, ease: "easeOut" },
              }}
            >
              <h3 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg leading-tight">
                {title}
              </h3>
              <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-lg line-clamp-2 drop-shadow-md">
                {description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasPointer ? (
            isActive && (
              <motion.div
                key={`btns-ptr-${game.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={
                  (isHoverActive && textVisible) || isExitingWithHover
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 8 }
                }
                exit={{
                  opacity: 0,
                  x:       reduced ? 0 : exitX,
                  transition: { duration: exitDuration, delay: btnsExitDelay, ease: EASE_IN },
                }}
                transition={
                  isExitingWithHover
                    ? { duration: 0 }
                    : isHoverActive && textVisible
                      ? { duration: 0.30, ease: EASE_CSS, delay: 0.04 }
                      : { duration: 0.22, ease: EASE_ACCEL }
                }
                className="mt-[clamp(0.75rem,2vw,1.25rem)] flex flex-row flex-wrap items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]"
                style={{ pointerEvents: isHoverActive && textVisible ? "auto" : "none" }}
              >
                <GameCardActions
                  gameId={game.id}
                  isActive={isActive}
                  viewLabel={viewLabel}
                  playLabel={playLabel}
                  registerPrimary={registerPrimary}
                  registerSecondary={registerSecondary}
                  onPrimaryKeyDown={onPrimaryKeyDown}
                  onSecondaryKeyDown={onSecondaryKeyDown}
                  onHover={onActionsHover}
                />
              </motion.div>
            )
          ) : (
            isActive && textVisible && (
              <motion.div
                key={`btns-touch-${game.id}`}
                initial={{ opacity: 0, x: reduced ? 0 : enterX }}
                animate={{
                  opacity: 1,
                  x:       0,
                  transition: { delay: 0.18, duration: TEXT_ENTER_S, ease: EASE_OUT },
                }}
                exit={{
                  opacity: 0,
                  x:       reduced ? 0 : exitX,
                  transition: { duration: exitDuration, delay: btnsExitDelay, ease: EASE_IN },
                }}
                className="mt-[clamp(0.75rem,2vw,1.25rem)] flex flex-row flex-wrap items-center gap-[clamp(0.5rem,1.5vw,0.75rem)]"
              >
                <GameCardActions
                  gameId={game.id}
                  isActive={isActive}
                  viewLabel={viewLabel}
                  playLabel={playLabel}
                  registerPrimary={registerPrimary}
                  registerSecondary={registerSecondary}
                  onPrimaryKeyDown={onPrimaryKeyDown}
                  onSecondaryKeyDown={onSecondaryKeyDown}
                  onHover={onActionsHover}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
