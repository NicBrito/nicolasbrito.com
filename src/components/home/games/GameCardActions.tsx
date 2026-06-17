"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

interface GameCardActionsProps {
  gameId: string;
  isActive: boolean;
  viewLabel: string;
  playLabel: string;
  registerPrimary: (el: HTMLElement | null) => void;
  registerSecondary: (el: HTMLElement | null) => void;
  onPrimaryKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onSecondaryKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  /** Pixel-perfect pointer hover over a button itself (not the row around it). */
  onHover: (hovered: boolean) => void;
}

const ACTION_BUTTON_CLASS =
  "rounded-full px-6 py-3.5 sm:py-3 text-[15px] sm:text-sm font-medium focus-visible:ring-offset-card";

/**
 * The "View Game" / "Play Now" pair rendered inside every active game card.
 * Shared by the pointer and touch branches so the markup lives in one place.
 */
export function GameCardActions({
  gameId,
  isActive,
  viewLabel,
  playLabel,
  registerPrimary,
  registerSecondary,
  onPrimaryKeyDown,
  onSecondaryKeyDown,
  onHover,
}: GameCardActionsProps) {
  const enter = () => onHover(true);
  const leave = () => onHover(false);

  return (
    <>
      <PrimaryButton
        ref={registerPrimary}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={onPrimaryKeyDown}
        onMouseEnter={enter}
        onMouseLeave={leave}
        href={`/games/${gameId}`}
        target="_self"
        rel={undefined}
        className={ACTION_BUTTON_CLASS}
      >
        {viewLabel}
      </PrimaryButton>
      <SecondaryButton
        ref={registerSecondary}
        tabIndex={isActive ? 0 : -1}
        onKeyDown={onSecondaryKeyDown}
        onMouseEnter={enter}
        onMouseLeave={leave}
        href={`/games/${gameId}/play`}
        target="_self"
        rel={undefined}
        className={ACTION_BUTTON_CLASS}
      >
        {playLabel}
      </SecondaryButton>
    </>
  );
}
