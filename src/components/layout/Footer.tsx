import { Github, Linkedin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/Container";
import { SocialLink } from "@/components/ui/SocialLink";
import { SOCIAL_LINKS } from "@/lib/social";

// Footer-scale social buttons: a 20px glyph inside 10px of padding yields a
// 40x40 box — on the 8-pt grid, far above the 24x24 minimum target size
// (WCAG 2.5.8), and visibly quieter than the Hero's 56px pair. The primitive
// already ships its own reduced-motion-gated hover/focus feedback.
const SOCIAL_ICON_SIZE = 20;
const SOCIAL_BOX_CLASS = "p-2.5";

/**
 * Site `contentinfo` landmark: a coda of wordmark, social pair and legal line.
 * Static by design — no entry animation, so it contributes zero CLS.
 */
export async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label={t("aria_label")}
      className="w-full border-t border-white/5 bg-background pt-12 pb-[calc(3rem+env(safe-area-inset-bottom))] md:pt-16 md:pb-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <Container className="flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-6">
          <p className="text-base font-semibold leading-tight tracking-tight text-foreground/80">
            {t("name")}
          </p>

          <div className="flex items-center justify-center gap-4">
            <SocialLink
              href={SOCIAL_LINKS.linkedin}
              icon={<Linkedin size={SOCIAL_ICON_SIZE} strokeWidth={1.5} />}
              label={t("linkedin_label")}
              className={SOCIAL_BOX_CLASS}
            />
            <SocialLink
              href={SOCIAL_LINKS.github}
              icon={<Github size={SOCIAL_ICON_SIZE} strokeWidth={1.5} />}
              label={t("github_label")}
              className={SOCIAL_BOX_CLASS}
            />
          </div>
        </div>

        {/* /50 over --background composites to ~4.93:1 — AA for normal text. */}
        <p className="text-xs text-foreground/50">{t("copyright", { year })}</p>
      </Container>
    </footer>
  );
}
