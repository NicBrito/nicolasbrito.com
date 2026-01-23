"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useAnimation, useInView, Variants } from "framer-motion";

import { ProjectCard } from "@/components/ui/ProjectCard";

let hasAnimatedInSession = false;

const PROJECTS_DATA = [
  {
    id: "project-1",
    image: "",
    colSpan: "md:col-span-6",
    colors: {
      from: "bg-blue-600 dark:bg-blue-500",
      to: "bg-purple-600 dark:bg-purple-500",
    },
  },
  {
    id: "project-2",
    image: "",
    colSpan: "md:col-span-4",
    colors: {
      from: "bg-indigo-600 dark:bg-indigo-500",
      to: "bg-cyan-600 dark:bg-cyan-500",
    },
  },
  {
    id: "project-3",
    image: "",
    colSpan: "md:col-span-2",
    colors: {
      from: "bg-emerald-600 dark:bg-emerald-500",
      to: "bg-teal-600 dark:bg-teal-500",
    },
  },
  {
    id: "project-4",
    image: "",
    colSpan: "md:col-span-3",
    colors: {
      from: "bg-orange-600 dark:bg-orange-500",
      to: "bg-red-600 dark:bg-red-500",
    },
  },
  {
    id: "project-5",
    image: "",
    colSpan: "md:col-span-3",
    colors: {
      from: "bg-pink-600 dark:bg-pink-500",
      to: "bg-rose-600 dark:bg-rose-500",
    },
  },
];

const ANIMATIONS = {
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
  } as Variants,
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  } as Variants,
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
          variants={ANIMATIONS.container}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[550px]"
        >
          {PROJECTS_DATA.map((project, index) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              image={project.image || undefined}
              colSpan={project.colSpan}
              colors={project.colors}
              priority={index < 2}
              variants={ANIMATIONS.card}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}