"use client";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, FileText, Github, Linkedin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const PORTFOLIO_URL = "https://portfolio.myapps.page/nicolasbrito";
const LINKEDIN_URL = "https://www.linkedin.com/in/nicolasbritobarros/";
const GITHUB_URL = "https://github.com/NicBrito";
const CV_PT = "/Currículo Nicolas.pdf";
const CV_EN = "/Nicolas's CV.pdf";

const BUTTON_BASE_CLASS = "inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none px-10 py-4 text-lg font-semibold tracking-tight min-w-[160px] md:min-w-[200px]";
const BUTTON_PRIMARY_CLASS = "bg-accent text-white hover:bg-accent/90 shadow-xl shadow-black/20";
const BUTTON_SECONDARY_CLASS = "bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-md shadow-lg shadow-black/5";
const SOCIAL_ICON_CLASS = "group relative p-4 rounded-[22%] bg-gradient-to-br from-white/10 to-white/5 border border-white/15 text-foreground/70 hover:text-white hover:from-white/15 hover:to-white/10 transition-colors duration-300 backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden";

const textVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

const tunnelVariant = {
  initial: {
    scale: 0.1,
    opacity: 0
  },
  animate: (i: number) => ({
    scale: [0.1, 2, 5],
    opacity: [0, 0.18, 0.18, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      delay: i * 2,
      ease: "easeInOut",
    },
  }),
};

const buttonTapAnimation = {
  scale: 0.95,
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const cvUrl = locale === "pt" ? CV_PT : CV_EN;

  return (
    <section id="home" className="relative w-full h-[100dvh] flex flex-col justify-center overflow-hidden bg-background">

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <div className="absolute w-[12vw] h-[12vw] bg-accent/20 rounded-full blur-[60px] opacity-50 animate-pulse" />

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={tunnelVariant}
            initial="initial"
            animate="animate"
            className="absolute rounded-full w-[35vw] h-[35vw] bg-accent/15 blur-[90px] mix-blend-screen dark:mix-blend-plus-lighter"
            style={{ willChange: "transform, opacity" }}
          />
        ))}

        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background/40" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      <Container className="relative z-20 flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.2 }}
          className="max-w-5xl space-y-8"
        >
          <div className="flex flex-col items-center justify-center -space-y-2 md:-space-y-4">
            <motion.h1
              variants={textVariants}
              className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter text-foreground leading-none"
            >
              {t('name')}
            </motion.h1>

            <motion.span
              variants={textVariants}
              className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/40 leading-tight pb-2"
            >
              {t('role')}
            </motion.span>
          </div>

          <motion.p
            variants={textVariants}
            className="mx-auto max-w-2xl text-lg md:text-2xl leading-relaxed text-foreground/60 font-medium pt-4"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={textVariants}
            className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12"
          >
            <motion.a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={buttonTapAnimation}
              className={cn(BUTTON_BASE_CLASS, BUTTON_PRIMARY_CLASS, "group gap-3 w-full md:w-auto")}
            >
              <Briefcase size={20} className="mb-0.5" />
              {t('portfolio')}
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1 ml-1" />
            </motion.a>

            <motion.a
              href={cvUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              whileTap={buttonTapAnimation}
              className={cn(BUTTON_BASE_CLASS, BUTTON_SECONDARY_CLASS, "gap-3 w-full md:w-auto")}
            >
              <FileText size={20} className="mb-0.5" />
              {t('cv')}
            </motion.a>
          </motion.div>
        </motion.div>
      </Container>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-30"
      >
        <motion.a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          whileTap={buttonTapAnimation}
          className={SOCIAL_ICON_CLASS}
          aria-label={t('linkedin_label')}
        >
          <Linkedin size={28} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300 relative z-10" />
        </motion.a>
        <motion.a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          whileTap={buttonTapAnimation}
          className={SOCIAL_ICON_CLASS}
          aria-label={t('github_label')}
        >
          <Github size={28} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300 relative z-10" />
        </motion.a>
      </motion.div>
    </section>
  );
}