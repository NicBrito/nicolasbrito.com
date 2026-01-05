"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useAnimation, useInView, Variants } from "framer-motion";
import { ArrowUpRight, ImageIcon, MousePointer2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

let hasAnimatedInSession = false;

const ASSETS = {
  noise: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E",
};

const PROJECTS_DATA = [
  {
    id: "project-1",
    image: "/projects/1.png",
    colSpan: "md:col-span-6",
    colors: {
      from: "bg-blue-600 dark:bg-blue-500",
      to: "bg-purple-600 dark:bg-purple-500",
    },
  },
  {
    id: "project-2",
    image: "/projects/project-2.jpg",
    colSpan: "md:col-span-4",
    colors: {
      from: "bg-indigo-600 dark:bg-indigo-500",
      to: "bg-cyan-600 dark:bg-cyan-500",
    },
  },
  {
    id: "project-3",
    image: "/projects/project-3.jpg",
    colSpan: "md:col-span-2",
    colors: {
      from: "bg-emerald-600 dark:bg-emerald-500",
      to: "bg-teal-600 dark:bg-teal-500",
    },
  },
  {
    id: "project-4",
    image: "/projects/project-4.jpg",
    colSpan: "md:col-span-3",
    colors: {
      from: "bg-orange-600 dark:bg-orange-500",
      to: "bg-red-600 dark:bg-red-500",
    },
  },
  {
    id: "project-5",
    image: "/projects/project-5.jpg",
    colSpan: "md:col-span-3",
    colors: {
      from: "bg-pink-600 dark:bg-pink-500",
      to: "bg-rose-600 dark:bg-rose-500",
    },
  },
];

const ANIMATION_VARIANTS: { container: Variants; card: Variants } = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  },
  card: {
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
  },
};

const ORB_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (customDelay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.8,
      delay: customDelay,
      ease: [0.2, 0.8, 0.2, 1],
    }
  })
};

const BUTTON_TAP_ANIMATION = {
  scale: 0.95,
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

export function ProjectsSection() {
  const t = useTranslations("Projects");
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [shouldSkipAnimation] = useState(hasAnimatedInSession);

  useEffect(() => {
    if (shouldSkipAnimation) {
      controls.set("visible");
    } else if (isInView) {
      controls.start("visible");
      hasAnimatedInSession = true;
    }
  }, [controls, isInView, shouldSkipAnimation]);

  return (
    <section id="projects" className="w-full py-32 bg-background relative overflow-hidden">
      <div className="w-full max-w-[1280px] mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
            {t("section_title")}
          </h2>
        </motion.div>

        <motion.div
          ref={ref}
          variants={ANIMATION_VARIANTS.container}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[550px]"
        >
          {PROJECTS_DATA.map((project, index) => (
            <ProjectCard key={project.id} config={project} priority={index < 2} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProjectCard({ config, priority }: { config: (typeof PROJECTS_DATA)[0]; priority: boolean }) {
  const t = useTranslations("Projects");
  const hasImage = !!config.image;
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imgRef = useRef<HTMLImageElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
         setImageStatus('loaded');
      }
    }
  }, []);

  const showFallback = !hasImage || imageStatus !== 'loaded';

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.card}
      whileHover="hover"
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-[40px]",
        "border border-black/5 dark:border-white/5",
        "bg-[#f5f5f7] dark:bg-[#101010]",
        "shadow-sm hover:shadow-2xl transition-shadow duration-500",
        config.colSpan
      )}
      style={{ willChange: "transform, filter" }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden transform-gpu" style={{ transform: "translate3d(0,0,0)" }}>
        <AnimatePresence mode="popLayout">
          {showFallback && (
            <motion.div
              key="fallback"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 w-full h-full z-0"
            >
              <motion.div
                variants={ORB_VARIANTS}
                custom={0.1}
                className="absolute inset-0"
              >
                <div
                  className={cn(
                    "absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-20 dark:opacity-15",
                    "transform-gpu will-change-transform",
                    config.colors.from
                  )}
                />
              </motion.div>

              <motion.div
                variants={ORB_VARIANTS}
                custom={0.3}
                className="absolute inset-0"
              >
                <div
                  className={cn(
                    "absolute bottom-0 -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 dark:opacity-15",
                    "transform-gpu will-change-transform",
                    config.colors.to
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="opacity-[0.03] dark:opacity-[0.05] scale-[0.8] transform group-hover:scale-[0.85] transition-transform duration-1000">
                  <ImageIcon size={200} strokeWidth={0.5} />
                </div>
              </motion.div>

              <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("${ASSETS.noise}")` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {hasImage && (
          <motion.div
            className="absolute inset-0 w-full h-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: imageStatus === 'loaded' ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Image
              ref={imgRef}
              src={config.image!}
              alt={t(`items.${config.id}.alt`)}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imageStatus === 'loaded' ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
            />

            <div
              className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none z-20"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)'
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20 opacity-90" />
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] pointer-events-none z-20" />
          </motion.div>
        )}
      </div>

      <div className="relative z-30 p-10 flex flex-col gap-4 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0">
        <div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">
            {t(`items.${config.id}.title`)}
          </h3>
          <p className="text-lg text-white/90 font-medium leading-relaxed max-w-lg line-clamp-2 drop-shadow-md">
            {t(`items.${config.id}.description`)}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2 transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
          <Link href={`/projects/${config.id}`} className="flex-1 sm:flex-none outline-none" tabIndex={-1}>
            <Button
              className={cn(
                "w-full rounded-full px-6 h-12 font-medium shadow-xl",
                "bg-accent text-white hover:bg-accent/90 border-none",
                "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:ring-transparent",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              whileTap={BUTTON_TAP_ANIMATION}
            >
              {t("view_case")}
              <MousePointer2 size={16} className="ml-2" />
            </Button>
          </Link>

          <Link href={`/projects/${config.id}/demo`} className="flex-1 sm:flex-none outline-none" tabIndex={-1}>
            <Button
              variant="secondary"
              className={cn(
                "w-full rounded-full px-6 h-12 font-medium shadow-lg",
                "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md shadow-lg shadow-black/5",
                "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:ring-transparent",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              whileTap={BUTTON_TAP_ANIMATION}
            >
              {t("visit_site")}
              <ArrowUpRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}