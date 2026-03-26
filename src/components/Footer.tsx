import { Link } from "react-router-dom";
import { useI18nStore } from "@/store/i18nStore";

const FOOTER_LINKS = {
  impressum:  { ko: '회사 정보',         en: 'Legal Notice',   de: 'Impressum'    },
  datenschutz:{ ko: '개인정보 처리방침', en: 'Privacy Policy', de: 'Datenschutz'  },
  agb:        { ko: '이용약관',          en: 'Terms of Service', de: 'AGB'        },
} as const;

const Footer = () => {
  const { language } = useI18nStore();
  const lang = language as keyof typeof FOOTER_LINKS.impressum;

  const impressum   = FOOTER_LINKS.impressum[lang]   ?? FOOTER_LINKS.impressum.en;
  const datenschutz = FOOTER_LINKS.datenschutz[lang]  ?? FOOTER_LINKS.datenschutz.en;
  const agb         = FOOTER_LINKS.agb[lang]           ?? FOOTER_LINKS.agb.en;

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-4 px-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/impressum" className="hover:text-foreground transition-colors">{impressum}</Link>
          <Link to="/datenschutz" className="hover:text-foreground transition-colors">{datenschutz}</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">{agb}</Link>
        </div>
        <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
          POWERED BY KOREAN BIOMETRIC DATA SCIENCE — GERMANY
        </p>
        <p>© 2026 Skin Strategy Lab · skinstrategylab.de</p>
      </div>
    </footer>
  );
};

export default Footer;