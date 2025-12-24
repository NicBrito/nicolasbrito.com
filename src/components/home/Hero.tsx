"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, FileText, Github, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section id="home" className="relative w-full h-[100dvh] flex flex-col justify-center overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-accent/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <Container className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15 }}
          className="max-w-4xl space-y-8"
        >
          <div className="flex flex-col items-center gap-0">
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-foreground leading-none"
            >
              Nicolas Brito
            </motion.h1>

            <motion.span
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground/80 to-foreground/40 leading-tight mt-2"
            >
              {t('role')}
            </motion.span>
          </div>

          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-xl md:text-2xl leading-relaxed text-foreground/70 font-medium"
          >
            {t('description')}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10"
          >
            <Button size="xl" className="group gap-3 w-full md:w-auto shadow-lg shadow-accent/20">
              <Briefcase size={20} className="mb-0.5" />
              {t('portfolio')}
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1 ml-1" />
            </Button>

            <Button variant="secondary" size="xl" className="gap-3 w-full md:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10">
              <FileText size={20} className="mb-0.5" />
              {t('cv')}
            </Button>
          </motion.div>
        </motion.div>
      </Container>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1, ease: "easeOut" }}
        className="absolute bottom-12 left-0 right-0 flex justify-center gap-8"
      >
        <a
          href="https://www.linkedin.com/in/nicolasbritobarros/"
          target="_blank"
          rel="noreferrer"
          className="text-foreground/40 hover:text-[#0077b5] transition-colors duration-300 transform hover:scale-110"
          aria-label="LinkedIn"
        >
          <Linkedin size={28} strokeWidth={1.5} />
        </a>
        <a
          href="https://github.com/NicBrito"
          target="_blank"
          rel="noreferrer"
          className="text-foreground/40 hover:text-white transition-colors duration-300 transform hover:scale-110"
          aria-label="GitHub"
        >
          <Github size={28} strokeWidth={1.5} />
        </a>
      </motion.div>
    </section>
  );
}