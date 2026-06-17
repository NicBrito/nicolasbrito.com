---
module: design
status: TRIGGERED ON ALL UI/UX AND FRONTEND TASKS
load: frontend-architect, i18n-a11y-steward; Copilot applyTo src/components/**, src/app/**
summary: UI/UX hierarchy, 8-point grid, typography limits, interactive states, semantic theming (light/dark depth), glassmorphism, WCAG AA.
---

# Design Rules

> Canonical source. Load only for UI/UX and frontend work.

* **UI/UX Fundamentals & Hierarchy:** You MUST use visual signifiers (size, color, and position) to establish a clear hierarchy. Prioritize content over decoration.
* **Grid & Whitespace:** Strict adherence to an 8-Point (or 4-Point) Grid system is REQUIRED for all margins, padding, and layout dimensions to ensure visual breathing room.
* **Typography:** Use a single system sans-serif font family. For header typography, you MUST tighten letter spacing (-2% to -3%) and set line height between 110% and 120% for a professional look. Limit the entire design to a maximum of 6 font sizes.
* **Interactive States & Proportions:** All interactive elements MUST have explicitly defined UI responses for all states (default, hover, active/pressed, disabled, and focus/loading). Buttons should generally use a 2:1 padding ratio (horizontal to vertical). Icons MUST match the line-height of their adjacent text (e.g., 24px icon for 24px line-height).
* **Theming, Color & Depth:** * Hardcoded hex/RGB values are STRICTLY FORBIDDEN; use semantic CSS variables (e.g., `var(--primary-action)`).
    * Use semantic colors purposefully (e.g., blue for trust, red for danger).
    * **Light Mode:** Convey depth using soft, high-blur, low-opacity shadows.
    * **Dark Mode:** Do NOT use shadows for depth; instead, use lighter surface background colors to create elevation against dark backgrounds.
* **Visual Language:** Enforce Glassmorphism (background blur, variable transparency) and continuous curvature (Squircles).
* **Accessibility (A11y):** You MUST verify WCAG AA text-to-background contrast ratios and include precise `aria-labels` and roles for all interactive elements.
