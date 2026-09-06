# Development Summary: Games Carousel

## 1. Overview & Objective

The **Games** section (`GamesSection.tsx`) is an autoplaying, fully navigable
carousel of selected games. It mirrors the design language of the Projects
section but is interaction-heavy: it must page **exactly one card per discrete
gesture** across every input method (trackpad, mouse wheel, touch, keyboard),
stay fluid under rapid input, and read as a single continuous motion rather
than a sequence of independent animations.

### Objective
- **One-gesture-one-card** navigation that never freezes under rapid input.
- **Continuous motion**: text, actions, track, and progress controls choreograph
  as one piece; no layout thrashing between an exit and the next entry.
- **Separation of concerns**: logic, presentation, autoplay, and gesture
  detection each live in their own unit.
- **Single source of truth** for every tunable timing and threshold.

### Architecture Location
```
src/components/home/
├── GamesSection.tsx              # Orchestrator: state machine + input routing
└── games/
    ├── GameCard.tsx              # Presentational slide (memoizable, pure)
    ├── GameCardActions.tsx       # The View / Play button pair
    ├── GamesProgressControls.tsx # Liquid-glass pill: dots + play/pause
    ├── useCarouselAutoplay.ts    # RAF progress loop
    ├── useCarouselWheel.ts       # Wheel / trackpad gesture → navigation
    └── constants.ts              # Data, easings, layout, timings, thresholds

src/lib/hooks/
└── useLiveRef.ts                 # Shared primitive: latest value in a ref
```

## 2. Architecture & Data Flow

`GamesSection` owns **logic only**. It holds the carousel's reactive state
(active index, direction, playback, visibility) and the paging state machine,
and routes all four input methods through a single advance function. Everything
visual is delegated.

### 2.1. The single advance path — `doAdvance(nextIndex, staged?)`
Every navigation — wheel, pan, keyboard, dot click, autoplay completion — funnels
through `doAdvance`, which takes one branch by **who triggered it**:

- **Autoplay (`staged = true`)** — the leisurely, elegant exit. The outgoing card
  finishes leaving before it is replaced, reading as one continuous motion:
  1. `t = 0` — hover lifts off: actions retract, the content lowers, the card shrinks.
  2. `t = HOVER_EXIT_MS` — the text slides out with a fade in the travel direction.
  3. `t = TEXT_EXIT_MS` — the track advances; text re-enters after `CARD_SETTLE_MS`.
- **Manual (`staged = false`** — keyboard, wheel, touch, dot/card click) — the
  *immediate* exit. The swap commits at once: the incoming card's text/actions
  enter without delay (no blank-card gap), while the outgoing card's text and
  actions **slide off in the travel direction with a fade**. The text leaves first
  (`MANUAL_TEXT_EXIT_S`); the actions follow a beat later (`BTN_EXIT_STAGGER_S`),
  as if pulled along by it. Nothing waits on a timer to swap, so navigation stays
  alive and snappy **even mid-entry**, by every input method. After the swap,
  autoplay **resumes automatically** from progress 0: `currentIndex` is passed
  as a reactive dep to `useCarouselAutoplay`, so its effect re-runs on every
  card change and restarts the RAF from the already-reset `progressRef.current`.
  `isPlaying` stays `true` throughout — no icon flicker, no manual "play" needed.
  The exit values ride on
  `immediateExit`, which **defaults true** and is only flipped false for autoplay's
  staged window — because `AnimatePresence` freezes a child's `exit` prop at
  removal, the manual value must already be set on the last render the card is
  present (a manual swap removes it in the very same commit).

  When the outgoing card had **pointer hover active** at the swap, its actions and
  content are held in place for the exit (`isExitingWithHover`, cleared after the
  exit window): without it `isHoverActive` would flip false in the same commit,
  Framer would capture the *retract* target, and the buttons would visibly drop
  before sliding away. Held, they simply ride off-screen and unmount.

Rapid bursts are inherently immediate (manual), so they page one card per press
with no freeze. `doAdvance` also stops autoplay synchronously (so a queued RAF
tick can't double-fire), resolves direction from `pendingIndexRef`, and clears the
previous staged timers, so input is never lost or queued.

Why split on trigger and not on hover/settle state: the staged choreography only
*reads* as elegant when its phases have room to breathe (autoplay's multi-second
cadence). Forcing it onto a manual move — where the user expects an instant
response — turns those phases into perceived lag. So manual is always immediate;
autoplay alone earns the staged exit.

### 2.2. `pendingIndexRef` — the in-flight target
React state is asynchronous; a burst of keypresses or swipes would all read the
same committed `currentIndex` and target the same neighbour. `pendingIndexRef`
is updated **synchronously** inside `doAdvance`, so each subsequent input chains
from the true in-flight destination. Press `→` five times quickly ⇒ advance five
cards, one per press. Every input handler computes its target from this ref.

### 2.3. `useLiveRef` (shared primitive)
Several imperative consumers (the RAF loop, event handlers) need the *latest*
value of reactive state without subscribing to it — re-subscribing would restart
a loop or re-bind a listener every render. `useLiveRef(value)` returns a ref kept
in sync via an effect. Used here for `currentIndex` and `isKeyboardFocused`, and
inside the autoplay hook to track the latest `onComplete`. It is generic and
belongs to the shared hook library, not this feature.

## 3. Input Methods (Interaction Excellence)

All four converge on `doAdvance`, guarded so they never compound.

### 3.1. Wheel / Trackpad — `useCarouselWheel`
A continuous trackpad swipe emits dozens of `wheel` events with a long momentum
tail; a mouse wheel emits discrete notches. To guarantee **one card per
gesture** while staying as responsive as the keyboard:
- Fire on the first threshold crossing (`TRIGGER_THRESHOLD`), then **lock**.
- While locked, every event **reschedules an idle timer** (`UNLOCK_IDLE_MS`);
  the gesture ends only when events stop for that window, reliably swallowing the
  whole momentum tail.
- The lock holds through **any same-direction wobble** — a single continuous
  movement always pages exactly one card, no matter how its velocity sags and
  surges. It breaks early, mid-tail, on one thing only: a **direction reversal**
  (an opposite-sign delta ≥ `REVERSAL_MIN` — the user swiping back), which makes
  rapid back-and-forth paging feel instant. (An earlier same-direction
  "re-acceleration" rule was removed: a normal movement's velocity dips tripped
  it repeatedly, paging several cards from one swipe.)
- Physical wheels (`deltaMode !== 0`) unlock immediately — each notch is already
  one discrete gesture.
- **Stability:** the listener and its idle-unlock timer are installed **exactly
  once**. `onNavigate` and `itemCount` are read through refs, so the effect's deps
  are all stable and a re-render can never tear it down. This closes a race where
  the flurry of hover / animation state updates a swipe triggers could re-create
  `onNavigate`, re-run the effect, clear the pending unlock timer, and strand
  `swipeLockedRef` true — silently swallowing every later trackpad event until a
  pause or reversal (the intermittent "stops responding" freeze).

### 3.2. Touch / Pointer drag — `onPanEnd`
A pan commits when it clears either a distance (`PAN_DISTANCE_PX`) **or** a
velocity (`PAN_VELOCITY_PXS`) threshold, then sets a short `SWIPE_LOCK_MS`
re-entrancy guard on its **own** `panLockedRef` (with a stored, cleared timer) —
deliberately *not* shared with the wheel's lock. Pan (touch) and wheel
(trackpad/mouse) never co-occur, so a separate lock keeps one handler's timer
from ever flipping the other's state.

### 3.3. Keyboard
Arrow keys page from `pendingIndexRef` (responsive under rapid presses); `Tab` /
`Shift+Tab` move through the action buttons and across cards; `Space` toggles
playback; `↓` enters the progress dots. Focusing the section pauses autoplay and
reveals actions; a genuine click (tracked via `isMouseDownRef`) does **not**
trigger keyboard mode.

Cross-card focus (`pendingFocusRef`) is applied the moment the destination card
becomes active — keyed on `currentIndex`, with `focus({ preventScroll: true })` —
**not** after it settles. Active cards always render their actions, so the target
button exists immediately; focusing it then keeps arrow-key paging alive *through*
the entry animation. Waiting for settle (the old behaviour) let the outgoing
card's button unmount first, stranding focus on `<body>` and freezing the
keyboard for ~1s — the bug this path fixes.

## 4. Motion & Performance

- **Autoplay** (`useCarouselAutoplay`) runs a single `requestAnimationFrame`
  loop that writes the active dot's fill width **imperatively** — zero React
  re-renders per frame. Progress is preserved across pause so playback resumes
  in place. The caller re-arms it by toggling `enabled`, gated on visibility,
  play state, keyboard focus, **and hover over the action buttons** (`buttonsHovered`).
  That hover is detected **pixel-perfectly on the button elements themselves**
  (`onMouseEnter`/`Leave` forwarded through `Primary`/`SecondaryButton` →
  `GameCardActions` → `onActionsHover`), not on the full-width row that wraps them,
  so only the buttons pause rotation. Hovering the *card* deliberately does **not**
  pause — that lets a hovered slide auto-advance and play its staged hover-exit —
  while hovering an *action* pauses so it can't slide out from under a click.
- **GPU compositing without waste** — the ambient gradient orbs use `transform-gpu`
  to stay on their own layer (so the 120–140px blur isn't re-rasterised while the
  track slides) but carry **no `will-change`**: they animate only once on entry,
  and a standing `will-change` on ten elements is pure memory pressure.
- **`AnimatePresence`** (default mode) wraps the card's text and actions. Each
  presence holds at most one child and cross-card transitions use separate
  presences per card, so there is no simultaneous enter/exit to thrash layout;
  default mode keeps the staged exit's tuned positioning exact.
- **`will-change: transform`** only — the cards animate transform (hover scale),
  never `filter`; advertising a filter that never changes wastes GPU memory.
- **React Compiler** (`babel-plugin-react-compiler`) handles render-level
  memoization, so `GameCard` stays a plain pure component without hand-written
  `memo`.
- **Custom cubic-bezier easings** throughout (`EASE_OUT`, `EASE_IN`, `EASE_CSS`,
  `EASE_ACCEL`); the only spring is the configured (non-default) `CARD_SPRING`
  on the track translation.
- **Deferred load rejected (2026-09-05):** `next/dynamic` was measured and
  reverted — first-load JS regressed 266.8 → 273.7 KB gz because Next
  re-hoisted the split chunk into the shared bundle (`decisions.md`, 2026-09-05).

## 5. Configuration

Every tunable lives at the top of `games/constants.ts`, grouped into labelled
sections: **Data** (`GAMES`, `GAME_DURATIONS`), **Easings**, **Layout &
dimensions** (8-point grid; card peek math), **Timings**, **Interaction**
(`PAN_*`, `SWIPE_LOCK_MS`, `FOCUS_DELAY_MS`), **Springs**, **Variants**, and
**Surfaces & queries**. Gesture-detection constants specific to the wheel
(`TRIGGER_THRESHOLD`, `UNLOCK_IDLE_MS`, `GESTURE_GAP_MS`) live at the top of
`useCarouselWheel.ts` next to the logic they govern.

Control chrome colours are semantic CSS variables (`--carousel-*`,
`--glass-surface`) defined in `globals.css`; no hardcoded colours exist in the
components.

## 6. Accessibility (A11y)

- The track is a `region` with `aria-roledescription="carousel"`; each card is a
  `group` / `slide` with `aria-current` on the active one.
- The progress pill is a `tablist`; dots are `tab`s with `aria-selected`.
- Auto-rotation **pauses on keyboard focus and on hovering an action button**;
  it also stops when the section is out of the viewport. The play/pause control
  lets the user stop it outright — satisfying the APG rotation requirements.
  Manual navigation no longer permanently pauses autoplay: the carousel
  auto-resumes after each swipe (restart via `currentIndex` dep). The icon
  expression is `isPlaying && isInView && !buttonsHovered`: it shows "play" when
  rotation is genuinely idle (user paused, scrolled away, or buttons are hovered)
  and "pause" only while the RAF is actually advancing.
- `useReducedMotion` collapses every entrance/slide to a simple fade.
- All controls expose i18n `aria-label`s via `next-intl` (`Games` namespace in
  `messages/en.json` and `pt.json`); no strings are hardcoded.

## 7. Final State (Checkpoint)

- `GamesSection.tsx` reduced from a 732-line god component to a ~455-line
  orchestrator; ~200 lines of card markup extracted to `GameCard.tsx`.
- Autoplay extracted to `useCarouselAutoplay`; the latest-value pattern unified
  behind `useLiveRef`.
- The bug-prone wheel/trackpad gesture logic is locked down by a deterministic
  unit suite (`useCarouselWheel.test.ts`, fake-timer driven): one card per
  gesture, momentum-tail suppression, same-direction dip-then-surge staying one
  card, gap-reset chaining, idle unlock, direction reversal, vertical
  pass-through, range clamping, and per-notch mouse-wheel handling.
- Exit choreography splits cleanly by trigger: autoplay stages (actions → text →
  swap); manual is immediate, text and actions sliding off in the travel direction
  with the actions trailing the text by `BTN_EXIT_STAGGER_S`. Autoplay pauses on
  action-hover (not card-hover) and resumes automatically after each manual move
  (via `currentIndex` dep in `useCarouselAutoplay`). The play/pause icon is honest
  across all states: it shows "play" when rotation is genuinely idle (explicitly
  paused, viewport not intersecting, or buttons hovered) and "pause" only while
  the RAF loop is running.
- Verified: `tsc --noEmit` clean, `eslint src/` clean, full suite green at HEAD
  (`npm test`), `next build` succeeds with React Compiler enabled.
