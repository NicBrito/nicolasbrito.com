"use client";

import { motion, Variants } from "framer-motion";
import { Briefcase, FileText, Github, Linkedin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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

export function Hero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const cvUrl = locale === "pt" ? ACTION_LINKS.resume.pt : ACTION_LINKS.resume.en;

  return (
    <section id="home" className="relative w-full h-[100dvh] flex flex-col justify-center overflow-hidden bg-background">

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background/40" />
        <div className="absolute bottom-0 left-0 right-0 h-32 sm:h-40 bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      <Container className="relative z-20 flex flex-col items-center text-center px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.2 }}
          className="max-w-5xl space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col items-center justify-center -space-y-1 sm:-space-y-2 md:-space-y-4">
            <motion.h1
              variants={textVariants}
              className="text-5xl sm:text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter text-foreground leading-none"
            >
              {t('name')}
            </motion.h1>

            <motion.span
              variants={textVariants}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/40 leading-tight pb-2"
            >
              {t('role')}
            </motion.span>
          </div>

          <motion.p
            variants={textVariants}
            className="mx-auto max-w-2xl text-base sm:text-lg md:text-2xl leading-relaxed text-foreground/60 font-medium pt-2 sm:pt-4 px-4 sm:px-0"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={textVariants}
            className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 sm:pt-12 px-4 sm:px-0"
          >
            <PrimaryButton
              href={ACTION_LINKS.portfolio}
              showArrow
              ariaLabel={t('portfolio')}
              className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg min-w-[160px] md:min-w-[200px] w-full md:w-auto"
            >
              <Briefcase size={20} className="mb-0.5" />
              {t('portfolio')}
            </PrimaryButton>

            <SecondaryButton
              href={cvUrl}
              download
              ariaLabel={t('cv')}
              className="px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg min-w-[160px] md:min-w-[200px] w-full md:w-auto"
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
        className="absolute bottom-8 sm:bottom-12 left-0 right-0 flex justify-center gap-4 sm:gap-6 z-30"
      >
        <SocialLink
          href={SOCIAL_LINKS.linkedin}
          icon={<Linkedin size={24} strokeWidth={1.5} className="sm:w-7 sm:h-7" />}
          label={t('linkedin_label')}
        />
        <SocialLink
          href={SOCIAL_LINKS.github}
          icon={<Github size={24} strokeWidth={1.5} className="sm:w-7 sm:h-7" />}
          label={t('github_label')}
        />
      </motion.div>
    </section>
  );
}