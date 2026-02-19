"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";

import { ProjectCard } from "@/components/ui/ProjectCard";

const PROJECTS = [
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

const ELEGANT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const ANIMATIONS = {
  heading: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.78, ease: ELEGANT_EASE },
    },
  } as Variants,
  headingReduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.25, ease: [0.2, 0, 0.2, 1] },
    },
  } as Variants,
  card: {
    hidden: {
      opacity: 0,
      y: 40,
      filter: "blur(3px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.88,
        ease: ELEGANT_EASE,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.24,
        ease: [0.2, 0, 0.2, 1],
      },
    },
  } as Variants,
  cardReduced: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.2, 0, 0.2, 1],
      },
    },
    hover: {
      scale: 1.01,
      transition: {
        duration: 0.2,
        ease: [0.2, 0, 0.2, 1],
      },
    },
  } as Variants,
  cardsContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.08,
      },
    },
  } as Variants,
};

export function ProjectsSection() {
  const t = useTranslations("Projects");
  const shouldReduceMotion = useReducedMotion();

  const headingVariants = shouldReduceMotion ? ANIMATIONS.headingReduced : ANIMATIONS.heading;
  const cardVariants = shouldReduceMotion ? ANIMATIONS.cardReduced : ANIMATIONS.card;

  return (
    <section
      id="projects"
      aria-labelledby="projects-section-title"
      className="relative w-full overflow-hidden bg-background py-20 md:py-32"
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={headingVariants}
          className="mb-10 md:mb-24"
        >
          <h2
            id="projects-section-title"
            className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground"
            style={{ textRendering: "geometricPrecision" }}
          >
            {t("section_title")}
          </h2>
        </motion.div>

        <motion.div
          variants={ANIMATIONS.cardsContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          className="grid grid-cols-1 gap-5 auto-rows-[500px] sm:gap-6 sm:auto-rows-[540px] md:grid-cols-6"
        >
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              image={project.image || undefined}
              colSpan={project.colSpan}
              colors={project.colors}
              priority={index < 2}
              variants={cardVariants}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}