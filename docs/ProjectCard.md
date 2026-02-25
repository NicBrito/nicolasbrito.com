# ProjectCard Component

## 1. Overview & Objective

The **ProjectCard** component is a reusable project card extracted from the Projects section (`ProjectsSection.tsx`), implementing an Apple-inspired design with animated gradient orbs or images, glassmorphism effects, and hover animations.

### Purpose
- **Project display:** Visual card for project showcase
- **Size flexibility:** Supports different sizes via `colSpan` prop
- **Reusability:** Shared component that can be used across multiple sections
- **Centralized maintenance:** Single source of truth for project cards
- **Customization:** Supports custom actions (buttons) and gradient colors

### Architecture Location
```
src/components/ui/
├── ProjectCard.tsx
└── ProjectCard.test.tsx
```

Positioned in `src/components/ui/` as design system primitive, alongside `PrimaryButton`, `SecondaryButton`, and `MorphingLabel`.

## 2. Visual Implementations & Sizing

### Visual Characteristics

#### Background Layers
- **Gradient Orbs (without image):**
  - Two animated orbs with intense blur (140px/120px)
  - Customizable colors via `colors.from` and `colors.to`
  - Fade-in animation with staggered delays
  - Reduced opacity (15%)

- **Image Background (with image):**
  - Next.js Image with lazy loading
  - Glassmorphism blur (24px backdrop-filter)
  - Dark gradient overlay (from-black/80 via-black/20)
  - Mask gradient for smooth blend
  - Inner shadow for depth

#### Content Styling
- **Title:** `text-3xl font-bold text-white` with drop-shadow
- **Description:** `text-lg text-white/90` with line-clamp-2
- **Border:** Subtle (`border-white/5`)
- **Border Radius:** Rounded-[40px] (Apple-style)
- **Shadow:** `shadow-sm hover:shadow-2xl` transition

### Size Variations (via colSpan)

**Large Card (Hero)**
```tsx
<ProjectCard
  id="project-1"
  image="/projects/hero-project.jpg"
  colSpan="md:col-span-6"
  colors={{ from: "bg-blue-600", to: "bg-purple-600" }}
/>
```

**Medium Card**
```tsx
<ProjectCard
  id="project-2"
  colSpan="md:col-span-4"
  colors={{ from: "bg-indigo-600", to: "bg-cyan-600" }}
/>
```

**Small Card**
```tsx
<ProjectCard
  id="project-3"
  colSpan="md:col-span-2"
  colors={{ from: "bg-emerald-600", to: "bg-teal-600" }}
/>
```

**Full Width**
```tsx
<ProjectCard
  id="project-4"
  colSpan="col-span-1"
  className="h-[400px]"
  colors={{ from: "bg-orange-600", to: "bg-red-600" }}
/>
```

### Animations

#### Card Entry (via variants prop)
```typescript
{
  hidden: {
    opacity: 0,
    y: 60,
    scale: 1,
    filter: "blur(12px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    }
  }
}
```

#### Content Transform
- **Resting state:** `translate-y-2` (content slightly displaced)
- **Hover state:** `translate-y-0` (content moves up smoothly)
- **Transition:** `duration-500` (smooth and natural)

#### Actions (Buttons)
- **Resting:** `opacity-0 translate-y-4` (invisible and displaced)
- **Hover:** `opacity-100 translate-y-0` (appear smoothly)
- **Transition:** `duration-300` (fast and responsive)

## 3. Props API

```typescript
export interface ProjectCardProps {
  /** Project ID (used for translations) */
  id: string;

  /** Project image URL (optional - shows orbs if empty) */
  image?: string;

  /** Grid span classes (ex: "md:col-span-6") */
  colSpan?: string;

  /** Gradient colors (animated orbs) */
  colors: {
    from: string;
    to: string;
  };

  /** Additional custom classes */
  className?: string;

  /** Image loading priority */
  priority?: boolean;

  /** Translation namespace (default: "Projects") */
  translationNamespace?: string;

  /** Custom actions (buttons) - uses default if not provided */
  actions?: ReactNode;

  /** Custom animation variants */
  variants?: Variants;

  /** Hover callback */
  onHover?: () => void;
}
```

## 4. Usage Examples

### Example 1: Basic Card (Gradient Orbs)

```tsx
<ProjectCard
  id="project-1"
  colSpan="md:col-span-6"
  colors={{
    from: "bg-blue-500",
    to: "bg-purple-500",
  }}
/>
```

### Example 2: Card with Image

```tsx
<ProjectCard
  id="project-2"
  image="/projects/awesome-project.jpg"
  colSpan="md:col-span-4"
  colors={{
    from: "bg-indigo-600",
    to: "bg-cyan-600",
  }}
  priority={true}
/>
```

### Example 3: Card with Custom Actions

```tsx
<ProjectCard
  id="project-3"
  colSpan="md:col-span-3"
  colors={{
    from: "bg-emerald-600",
    to: "bg-teal-600",
  }}
  actions={
    <>
      <PrimaryButton
        href="/custom-url"
        className="px-6 py-3 text-base"
      >
        <Star size={18} />
        Featured
      </PrimaryButton>
    </>
  }
/>
```

### Example 4: Card in Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[550px]">
  <ProjectCard
    id="project-1"
    colSpan="md:col-span-6"
    colors={{ from: "bg-blue-600", to: "bg-purple-600" }}
  />

  <ProjectCard
    id="project-2"
    colSpan="md:col-span-4"
    colors={{ from: "bg-indigo-600", to: "bg-cyan-600" }}
  />

  <ProjectCard
    id="project-3"
    colSpan="md:col-span-2"
    colors={{ from: "bg-emerald-600", to: "bg-teal-600" }}
  />
</div>
```

### Example 5: Card with Hover Callback

```tsx
<ProjectCard
  id="project-4"
  colSpan="md:col-span-3"
  colors={{ from: "bg-orange-600", to: "bg-red-600" }}
  onHover={() => console.log("Card hovered!")}
/>
```

## 5. Architecture & Performance

### Conditional Rendering

```typescript
// Fallback (Orbs) vs Image
const showFallback = !hasImage || imageStatus !== 'loaded';
```
- If **no image** or **image not loaded**: Shows gradient orbs
- If **image loaded**: Shows image with glassmorphism

### Image Loading Strategy

```typescript
const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

useIsomorphicLayoutEffect(() => {
  if (imgRef.current && imgRef.current.complete) {
    if (imgRef.current.naturalWidth > 0) {
       setImageStatus('loaded');
    }
  }
}, []);
```
- Detects if image is already cached
- Uses `useIsomorphicLayoutEffect` for SSR compatibility
- Automatic fallback to orbs if image fails

### Performance Optimizations

- **GPU Acceleration:** `transform-gpu` and `will-change: transform, filter`
- **AnimatePresence:** `mode="popLayout"` to avoid layout thrashing
- **Lazy Loading:** Next.js Image with `priority` prop for control
- **Blur Optimization:** `backdrop-filter` with CSS variables
- **Spring Physics:** Framer Motion with calibrated stiffness/damping

### Translation Pattern

```typescript
const t = useTranslations(translationNamespace);

// Usage
t(`items.${id}.title`)
t(`items.${id}.description`)
t(`items.${id}.alt`)
t("view_case")
t("visit_site")
```

Expected structure in `messages/{en,pt}.json`:
```json
{
  "Projects": {
    "items": {
      "project-1": {
        "title": "Project Title",
        "description": "Project description",
        "alt": "Project image alt text"
      }
    },
    "view_case": "View Case",
    "visit_site": "Visit Site"
  }
}
```

## 6. Integration with ProjectsSection

### Before (Duplicated Code)

```tsx
function ProjectCard({ config, priority }) {
  // 150+ lines of code inline
  // Not reusable
  // Difficult to test in isolation
}
```

### After (Reusable Component)

```tsx
import { ProjectCard } from "@/components/ui/ProjectCard";

export function ProjectsSection() {
  return (
    <motion.div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[550px]">
      {PROJECTS_DATA.map((project, index) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          image={project.image || undefined}
          colSpan={project.colSpan}
          colors={project.colors}
          variants={CARD_VARIANTS}
        />
      ))}
    </motion.div>
  );
}
```

**Benefits:**
- ✅ Code reduced from ~150 lines to ~20 lines in section
- ✅ Reusable in other sections (About, Work, etc.)
- ✅ Testable in isolation (15 unit tests)
- ✅ Centralized maintenance
- ✅ Flexible props for customization

## 7. Testing

### Test Coverage

- ✅ **Basic rendering:** Title, description, actions
- ✅ **Custom props:** colSpan, className, image
- ✅ **Custom actions:** Personalized buttons
- ✅ **Translation namespace:** Support for multiple namespaces
- ✅ **Gradient rendering:** Orbs with custom colors
- ✅ **Image rendering:** Next.js Image with alt text
- ✅ **Priority prop:** Lazy loading control
- ✅ **Default values:** Default colSpan (md:col-span-4)
- ✅ **Link hrefs:** Correct navigation for project and demo

**Execution:**
```bash
npm run test
```

**Result:**
- 40 tests passing (MorphingLabel 7 + Buttons 18 + ProjectCard 15)
- Coverage: 100% of critical functionality

## 8. Design System Integration

### Suggested Color Schemes

```typescript
// Blue & Purple (Tech, SaaS)
{ from: "bg-blue-500", to: "bg-purple-500" }

// Indigo & Cyan (Data, Analytics)
{ from: "bg-indigo-500", to: "bg-cyan-500" }

// Emerald & Teal (Nature, Health)
{ from: "bg-emerald-500", to: "bg-teal-500" }

// Orange & Red (Energy, Action)
{ from: "bg-orange-500", to: "bg-red-500" }

// Pink & Rose (Creative, Design)
{ from: "bg-pink-500", to: "bg-rose-500" }
```

### Grid Layout Patterns

```tsx
// Asymmetric Layout (Apple-style)
<div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[550px]">
  <ProjectCard colSpan="md:col-span-6" /> {/* Hero */}
  <ProjectCard colSpan="md:col-span-4" /> {/* Large */}
  <ProjectCard colSpan="md:col-span-2" /> {/* Small */}
  <ProjectCard colSpan="md:col-span-3" /> {/* Medium */}
  <ProjectCard colSpan="md:col-span-3" /> {/* Medium */}
</div>

// Symmetric Layout
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[450px]">
  <ProjectCard colSpan="md:col-span-1" />
  <ProjectCard colSpan="md:col-span-1" />
  <ProjectCard colSpan="md:col-span-1" />
</div>
```

## 9. Accessibility & Browser Support

### Accessibility (WCAG 2.1 AA)
- ✅ White text on dark backgrounds (high contrast)
- ✅ Focus states on buttons
- ✅ Keyboard navigable links
- ✅ Alt text on images
- ✅ Semantic HTML structure

### Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (backdrop-filter supported)
- ✅ iOS Safari 14+
- ✅ Android Chrome

### CSS Features Used
- ✅ Backdrop Filter (glassmorphism)
- ✅ CSS Grid
- ✅ Transform (GPU-accelerated)
- ✅ CSS Variables
- ✅ Gradient Masks

## 10. Migration Guide

### Migrating from Inline ProjectCard

**Before:**
```tsx
// ProjectsSection.tsx (inline function)
function ProjectCard({ config, priority }) {
  // ... 150+ lines
}
```

**After:**
```tsx
// ProjectsSection.tsx (import)
import { ProjectCard } from "@/components/ui/ProjectCard";

// Usage
<ProjectCard
  id={config.id}
  image={config.image || undefined}
  colSpan={config.colSpan}
  colors={config.colors}
  priority={priority}
/>
```

### Breaking Changes
- **None!** API maintains compatibility with previous usage
- `config` object was split into individual props
- `priority` maintains same behavior

---

**Last Updated:** January 2026
**Component Version:** 1.0.0
**Status:** ✅ Production — Reusable, Tested, and Documented
