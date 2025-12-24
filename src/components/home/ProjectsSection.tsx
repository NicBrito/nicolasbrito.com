"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Code, Cpu, Globe, Layers } from "lucide-react";
import Link from "next/link";

const PROJECTS = [
  {
    id: "saas-platform",
    title: "Enterprise SaaS Platform",
    summary: "Orquestração de fluxo de trabalho escalável para grandes empresas.",
    icon: Layers,
    gradient: "from-blue-500/20 to-purple-500/20",
  },
  {
    id: "ecommerce-engine",
    title: "Headless E-commerce Engine",
    summary: "API de alta performance para lojas virtuais globais.",
    icon: Globe,
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "ai-analyst",
    title: "AI Financial Analyst",
    summary: "LLM especializado em análise preditiva de mercado.",
    icon: Cpu,
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: "developer-tools",
    title: "Open Source DevTools",
    summary: "Utilitários CLI para acelerar o desenvolvimento React.",
    icon: Code,
    gradient: "from-gray-500/20 to-slate-500/20",
  },
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
};

export function ProjectsSection() {
  return (
    <section id="projects" className="w-full py-12 md:py-24 bg-background">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6">

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl md:text-4xl font-semibold mb-12 text-foreground tracking-tight"
        >
          Projetos em Destaque.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              variants={fadeUpVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-3xl",
                "bg-[#fbfbfd] dark:bg-[#1c1c1e]",
                "min-h-[500px] md:min-h-[600px]",
                "flex flex-col items-center text-center pt-16 md:pt-20"
              )}
            >
              <div className="px-8 max-w-md z-10">
                <h3 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
                  {project.title}
                </h3>
                <p className="text-lg text-foreground/70 mb-8 leading-relaxed font-medium">
                  {project.summary}
                </p>

                <div className="flex items-center justify-center gap-4 mb-12">
                  <Link href={`/projects/${project.id}`}>
                    <Button size="lg">
                      Ler mais
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/demo`}>
                    <Button variant="outline" size="lg">
                      Acessar Projeto
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[250px] md:h-[350px] w-full flex items-end justify-center pb-8 transition-transform duration-700 group-hover:scale-[1.02]">
                <div className={cn(
                  "w-[80%] h-full rounded-t-2xl bg-gradient-to-t flex items-center justify-center border-t border-l border-r border-white/20 shadow-sm",
                  project.gradient
                )}>
                    <project.icon className="w-24 h-24 text-foreground/20" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}