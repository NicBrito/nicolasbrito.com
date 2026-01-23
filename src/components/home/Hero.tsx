"use client";

import { useLocale, useTranslations } from "next-intl";
import { Briefcase, FileText, Github, Linkedin } from "lucide-react";
import { motion, Variants } from "framer-motion";

import { Container } from "@/components/ui/Container";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SocialLink } from "@/components/ui/SocialLink";

const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/nicolasbritobarros/",
  github: "https://github.com/NicBrito",
};

const ACTION_LINKS = {
  portfolio: "https://portfolio.myapps.page/nicolasbrito",
  resume: {
    pt: "/resume/Currículo Nicolas.pdf",
    en: "/resume/Nicolas's CV.pdf",
  },
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

const tunnelVariant: Variants = {
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

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const cvUrl = locale === "pt" ? ACTION_LINKS.resume.pt : ACTION_LINKS.resume.en;

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
            <PrimaryButton
              href={ACTION_LINKS.portfolio}
              showArrow
              className="px-10 py-4 text-lg min-w-[160px] md:min-w-[200px] w-full md:w-auto"
            >
              <Briefcase size={20} className="mb-0.5" />
              {t('portfolio')}
            </PrimaryButton>

            <SecondaryButton
              href={cvUrl}
              download
              className="px-10 py-4 text-lg min-w-[160px] md:min-w-[200px] w-full md:w-auto"
            >
              <FileText size={20} className="mb-0.5" />
              {t('cv')}
            </SecondaryButton>
          </motion.div>
        </motion.div>
      </Container>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-30"
      >
        <SocialLink
          href={SOCIAL_LINKS.linkedin}
          icon={<Linkedin size={28} strokeWidth={1.5} />}
          label={t('linkedin_label')}
        />
        <SocialLink
          href={SOCIAL_LINKS.github}
          icon={<Github size={28} strokeWidth={1.5} />}
          label={t('github_label')}
        />
      </motion.div>
    </section>
  );
}