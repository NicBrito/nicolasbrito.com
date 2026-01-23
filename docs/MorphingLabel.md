# MorphingLabel Component

## 1. Overview & Objective

The **MorphingLabel** is a reusable UI component that implements letter-by-letter text animations using Framer Motion. This component was extracted from the `Navbar` and `ScrollProgress` components to centralize morphing animation logic, facilitating maintenance and promoting code reuse throughout the project.

### Purpose
- **Smooth text animation:** Each text character animates independently with opacity transitions
- **Reusability:** Shared component used across multiple sections of the site
- **Centralized Maintenance:** Single source of truth for the morphing effect
- **Performance:** Leverages GPU-accelerated transforms from Framer Motion

### Architecture Location
```
src/components/ui/MorphingLabel.tsx
```

Positioned in `src/components/ui/` as a design system primitive, following the convention established for reusable UI components like `Button` and `Container`.

## 2. Visual Implementations

### Animation Characteristics

#### Entry Animation
- **Default Duration:** `0.2s`
- **Easing:** `easeOut` (smooth initial acceleration)
- **Transition:** Opacity 0 → 1

#### Exit Animation
- **Default Duration:** `0.15s`
- **Easing:** `easeIn` (smooth deceleration)
- **Transition:** Opacity 1 → 0

#### Customization
The component accepts custom durations via the `animationDuration` prop:
```typescript
<MorphingLabel
  text="Hello World"
  layoutIdPrefix="example"
  animationDuration={{ animate: 0.1, exit: 0.08 }}
/>
```

**Example usage in ScrollProgress:**
- Entry: `0.1s` (faster for immediate visual feedback)
- Exit: `0.08s` (near-instantaneous transition)

**Example usage in Navbar:**
- Uses default values (`0.2s` / `0.15s`) for more elegant transition

### Layout Animation
- Uses `layout="position"` for GPU-accelerated animations
- `AnimatePresence mode="popLayout"` prevents layout thrashing during rapid state changes
- `whitespace-pre` preserves spaces without additional DOM nodes

## 3. Props API

### TypeScript Interface

```typescript
export interface MorphingLabelProps {
  /** Text to be displayed with morphing animation */
  text: string;

  /** Unique prefix for layout IDs (prevents conflicts) */
  layoutIdPrefix: string;

  /** Optional Tailwind classes for styling */
  className?: string;

  /** Custom animation durations (in seconds) */
  animationDuration?: {
    /** Duration for entry animation */
    animate?: number;
    /** Duration for exit animation */
    exit?: number;
  };
}
```

### Properties

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-----------|
| `text` | `string` | ✅ | - | Text to be rendered |
| `layoutIdPrefix` | `string` | ✅ | - | Unique prefix to avoid layout ID collisions |
| `className` | `string` | ❌ | - | Custom Tailwind classes |
| `animationDuration` | `object` | ❌ | `{ animate: 0.2, exit: 0.15 }` | Custom timings |

## 4. Architecture & Performance

### Technical Implementation

#### Character Division
```typescript
const characters = text.split("");
```
Splits text into individual characters for independent animation.

#### Variant Generation
```typescript
const createLetterVariants = (duration: {
  animate: number;
  exit: number;
}): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.animate,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.exit,
      ease: "easeIn",
    },
  },
});
```
Factory function that creates variants with custom durations.

#### Rendering
```tsx
<div className={cn("inline-flex whitespace-nowrap", className)}>
  <AnimatePresence mode="popLayout" initial={false}>
    {characters.map((char, i) => (
      <motion.span
        key={`${layoutIdPrefix}-${i}-${char}`}
        variants={letterVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        layout="position"
        className="inline-block whitespace-pre"
      >
        {char}
      </motion.span>
    ))}
  </AnimatePresence>
</div>
```

### Performance Optimizations

#### GPU Acceleration
- `layout="position"` offloads to GPU (transforms `x` and `y` properties)
- Avoids expensive layout repaints

#### Unique Keys
```typescript
key={`${layoutIdPrefix}-${i}-${char}`}
```
Combines prefix + index + character to ensure efficient React reconciliation.

#### AnimatePresence Mode
```typescript
mode="popLayout"
```
Prevents layout shift during rapid state changes, essential for smooth transitions.

#### Whitespace Handling
- `whitespace-nowrap`: Prevents line breaks
- `whitespace-pre`: Preserves spaces without extra DOM elements

### Usage Patterns

#### In Navbar
```tsx
<MorphingLabel
  text={t(item.key)}
  className="tracking-wide font-black"
  layoutIdPrefix={`nav-${item.key}`}
/>
```

#### In ScrollProgress
```tsx
<MorphingLabel
  text={activeLabel}
  layoutIdPrefix={`scroll-section-${activeSection}`}
  animationDuration={{ animate: 0.1, exit: 0.08 }}
/>
```

## 5. Testing Coverage

### Tests Implemented
File: `src/components/ui/MorphingLabel.test.tsx`

- ✅ Individual character rendering
- ✅ Correct text division
- ✅ Custom class application
- ✅ Whitespace preservation
- ✅ Unique layout prefixes
- ✅ Custom animation durations
- ✅ Default animation values

**Execution:**
```bash
npm run test
```

**Result:**
- 7 tests passing
- Coverage: 100% of critical functionality

## 6. Migration Impact

### Files Created

1. **New:**
   - `src/components/ui/MorphingLabel.tsx`
   - `src/components/ui/MorphingLabel.test.tsx`

2. **Refactored:**
   - `src/components/layout/Navbar.tsx`
     - Removed local `MorphingLabel` component
     - Removed `letterVariants`
     - Added shared component import

   - `src/components/layout/ScrollProgress.tsx`
     - Removed local `MorphingLabel` component
     - Removed `letterVariants`
     - Added shared component import
     - Configured custom `animationDuration`

### Refactoring Benefits

#### Maintainability
- **Before:** 2 identical implementations in different files
- **After:** 1 centralized implementation + dedicated tests
- **Impact:** Fixes and improvements applied in a single place

#### Reusability
- Component available for new features
- Standardized and documented API
- Flexible props for different contexts

#### Consistency
- Uniform behavior across the site
- Centralized animation timings
- Simplified global adjustments

#### Performance
- Eliminated code duplication (~40 lines per file)
- Reduced bundle size
- Better tree-shaking for optimized builds

## 7. Design System Integration

### Component Hierarchy

```
src/components/
├── ui/                     # Design System Primitives
│   ├── Button.tsx         # Primary action
│   ├── Container.tsx      # Layout wrapper
│   └── MorphingLabel.tsx  # Animated text ⬅️ NEW
├── layout/                # Global components
│   ├── Navbar.tsx         # USES MorphingLabel
│   └── ScrollProgress.tsx # USES MorphingLabel
└── home/                  # Page components
    ├── Hero.tsx
    └── ProjectsSection.tsx
```

### Principles Followed

1. **Atomic Design:** MorphingLabel is an atom (primitive)
2. **Single Responsibility:** Does one thing well
3. **Composition over Inheritance:** Composition via props
4. **Props Interface:** Exported TypeScript interface
5. **Testing:** Tests colocated with component

## 8. Future Enhancements

### Possible Extensions

1. **Stagger Animation:**
   ```typescript
   staggerDelay?: number; // Delay between characters
   ```

2. **Direction Control:**
   ```typescript
   direction?: 'ltr' | 'rtl'; // Animation direction
   ```

3. **Transform Effects:**
   ```typescript
   effects?: {
     blur?: boolean;
     scale?: boolean;
     y?: number;
   }
   ```

4. **Color Morphing:**
   ```typescript
   colorTransition?: {
     from: string;
     to: string;
   }
   ```

### Considerations
Extensions should maintain:
- GPU-accelerated performance
- Simple and intuitive API
- Backward compatibility
- Adequate test coverage

---

**Last Updated:** January 2026
**Component Version:** 1.0.0
**Status:** ✅ Production
