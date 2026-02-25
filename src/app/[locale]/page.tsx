import { Hero } from "@/components/home/Hero";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { setRequestLocale } from 'next-intl/server';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="relative min-h-screen bg-background text-foreground selection:bg-accent/30">
      <Navbar />

      <ScrollProgress />

      <Hero />

      <ProjectsSection />

      <section id="games" className="min-h-[50vh] py-24 flex items-center justify-center border-t border-white/5">
         <div className="text-center text-foreground/40">
            <h2 className="text-2xl font-semibold mb-2">Games</h2>
            <p>Coming Soon</p>
         </div>
      </section>

      <section id="blog" className="min-h-[50vh] py-24 flex items-center justify-center border-t border-white/5">
         <div className="text-center text-foreground/40">
            <h2 className="text-2xl font-semibold mb-2">Blog</h2>
            <p>Coming Soon</p>
         </div>
      </section>
    </main>
  );
}