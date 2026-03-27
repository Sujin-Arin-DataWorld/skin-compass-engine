import { Link } from "react-router-dom";
import { useI18nStore } from "@/store/i18nStore";

const FOOTER_LINKS = {
  about:      { ko: '회사 소개',         en: 'About Us',        de: 'Über uns'     },
  impressum:  { ko: '법적 고지',         en: 'Legal Notice',    de: 'Impressum'    },
  datenschutz:{ ko: '개인정보 처리방침', en: 'Privacy Policy',  de: 'Datenschutz'  },
  agb:        { ko: '이용약관',          en: 'Terms of Service', de: 'AGB'         },
} as const;

type Lang = keyof typeof FOOTER_LINKS.about;

const LINKS: { key: keyof typeof FOOTER_LINKS; to: string }[] = [
  { key: "about",       to: "/about" },
  { key: "impressum",   to: "/impressum" },
  { key: "datenschutz", to: "/datenschutz" },
  { key: "agb",         to: "/agb" },
];

const Footer = () => {
  const { language } = useI18nStore();
  const lang = (language as Lang) || "en";

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-4 px-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
          {LINKS.map(({ key, to }) => (
            <Link
              key={key}
              to={to}
              className="hover:text-foreground transition-colors"
            >
              {FOOTER_LINKS[key][lang] ?? FOOTER_LINKS[key].en}
            </Link>
          ))}
        </div>
        <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
          POWERED BY KOREAN BIOMETRIC DATA SCIENCE — GERMANY
        </p>
        <p translate="no" className="notranslate">© 2026 Skin Strategy Lab · skinstrategylab.de</p>
      </div>
    </footer>
  );
};

export default Footer;