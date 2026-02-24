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
    <section
      id="home"
      className="relative w-full min-h-dvh flex flex-col justify-center overflow-hidden bg-background pt-[calc(clamp(5rem,calc(4.5rem+2.5vw),6.5rem)+env(safe-area-inset-top))] pb-[calc(clamp(7rem,calc(6rem+4.2vw),9.5rem)+env(safe-area-inset-bottom))]"
    >

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background/40" />
        <div className="absolute bottom-0 left-0 right-0 h-[clamp(8rem,20vw,10rem)] bg-gradient-to-t from-background to-transparent z-10" />
      </div>

      <Container className="relative z-20 flex flex-col items-center text-center px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.2 }}
          className="max-w-5xl space-y-[clamp(1.5rem,4vw,2rem)]"
        >
          <div className="flex flex-col items-center justify-center -space-y-1 sm:-space-y-2">
            <motion.h1
              variants={textVariants}
              className="text-[clamp(2.5rem,calc(0.333rem+10.833vw),9rem)] font-bold tracking-tighter text-foreground leading-none"
            >
              {t('name')}
            </motion.h1>

            <motion.span
              variants={textVariants}
              className="text-[clamp(1.5rem,7.5vw,6rem)] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/40 leading-tight pb-2"
            >
              {t('role')}
            </motion.span>
          </div>

          <motion.p
            variants={textVariants}
            className="mx-auto max-w-2xl text-[clamp(1rem,calc(0.75rem+0.9375vw),1.5rem)] leading-relaxed text-foreground/60 font-medium pt-[clamp(0.5rem,1.5vw,1rem)] px-4 sm:px-0"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={textVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-[clamp(1rem,2.5vw,1.5rem)] pt-[clamp(1.5rem,6vw,3rem)] px-4 sm:px-0"
          >
            <PrimaryButton
              href={ACTION_LINKS.portfolio}
              showArrow
              ariaLabel={t('portfolio')}
              className="px-[clamp(2rem,4vw,2.5rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(1rem,calc(0.875rem+0.3125vw),1.125rem)] w-full sm:w-auto sm:min-w-[200px] max-w-[280px]"
            >
              <Briefcase size={20} className="mb-0.5" />
              {t('portfolio')}
            </PrimaryButton>

            <SecondaryButton
              href={cvUrl}
              download
              ariaLabel={t('cv')}
              className="px-[clamp(2rem,4vw,2.5rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(1rem,calc(0.875rem+0.3125vw),1.125rem)] w-full sm:w-auto sm:min-w-[200px] max-w-[280px]"
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
        className="absolute bottom-[clamp(2rem,5vw,3rem)] left-0 right-0 flex justify-center gap-[clamp(1rem,2vw,1.5rem)] z-30"
      >
        <SocialLink
          href={SOCIAL_LINKS.linkedin}
          icon={<Linkedin size={24} strokeWidth={1.5} className="w-[clamp(1.5rem,3.5vw,1.75rem)] h-[clamp(1.5rem,3.5vw,1.75rem)]" />}
          label={t('linkedin_label')}
        />
        <SocialLink
          href={SOCIAL_LINKS.github}
          icon={<Github size={24} strokeWidth={1.5} className="w-[clamp(1.5rem,3.5vw,1.75rem)] h-[clamp(1.5rem,3.5vw,1.75rem)]" />}
          label={t('github_label')}
        />
      </motion.div>
    </section>
  );
}