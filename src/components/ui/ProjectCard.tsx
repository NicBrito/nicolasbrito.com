"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ASSETS = {
  noise: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E",
};

const DEFAULT_CARD_VARIANTS: Variants = {
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
      duration: 0.28,
      ease: [0.2, 0, 0.2, 1],
    },
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

export interface ProjectCardProps {
  id: string;
  image?: string;
  colSpan?: string;
  colors: {
    from: string;
    to: string;
  };
  className?: string;
  priority?: boolean;
  translationNamespace?: string;
  actions?: ReactNode;
  variants?: Variants;
  onHover?: () => void;
}

export function ProjectCard({
  id,
  image,
  colSpan = "xl:col-span-4",
  colors,
  className,
  priority = false,
  translationNamespace = "Projects",
  actions,
  variants = DEFAULT_CARD_VARIANTS,
  onHover,
}: ProjectCardProps) {
  const t = useTranslations(translationNamespace);
  const hasImage = !!image;
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

  const defaultActions = (
    <>
      <PrimaryButton
        href={`/projects/${id}`}
        target="_self"
        rel={undefined}
        className="rounded-full px-6 py-3 text-sm font-medium"
      >
        {t("view_case")}
      </PrimaryButton>

      <SecondaryButton
        href={`/projects/${id}/demo`}
        target="_self"
        rel={undefined}
        className="rounded-full px-6 py-3 text-sm font-medium"
      >
        {t("visit_site")}
      </SecondaryButton>
    </>
  );

  return (
    <motion.div
      variants={variants}
      whileHover="hover"
      onHoverStart={onHover}
      className={cn(
        "project-card group relative flex flex-col justify-end overflow-hidden rounded-4xl sm:rounded-[40px]",
        "xl:min-w-[22rem]",
        "border border-white/5",
        "bg-[#101010]",
        "shadow-sm hover:shadow-2xl transition-shadow duration-450",
        colSpan,
        className
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
                    "absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[140px] opacity-15",
                    "transform-gpu will-change-transform",
                    colors.from
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
                    "absolute bottom-0 -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-15",
                    "transform-gpu will-change-transform",
                    colors.to
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="opacity-[0.05] scale-[0.8] transform group-hover:scale-[0.85] transition-transform duration-1000">
                  <ImageIcon size={200} strokeWidth={0.5} />
                </div>
              </motion.div>

              <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("${ASSETS.noise}")` }}
              />

              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
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
              src={image!}
              alt={t(`items.${id}.alt`)}
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

            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-20 opacity-90" />

            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] pointer-events-none z-20" />
          </motion.div>
        )}
      </div>

      <div className="project-card-content relative z-30 flex flex-col gap-3.5 p-7 sm:p-10 transform transition-transform duration-500">
        <div>
          <h3 className="mb-2 text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
            {t(`items.${id}.title`)}
          </h3>
          <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-lg line-clamp-2 drop-shadow-md">
            {t(`items.${id}.description`)}
          </p>
        </div>

        <div className="project-card-actions mt-2 flex flex-row flex-wrap items-center gap-2.5 transition-all duration-300 opacity-100 translate-y-0 pointer-events-auto">
          {actions || defaultActions}
        </div>
      </div>
    </motion.div>
  );
}