import { Link } from "react-router-dom";

const Footer = () =>
  <footer className="border-t border-border py-8">
    <div className="mx-auto flex max-w-[960px] flex-col items-center gap-4 px-6 text-sm text-muted-foreground">
      <div className="flex flex-wrap justify-center gap-6">
        <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
        <a
          href="https://www.skinstrategylab.de/datenschutz"
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </a>
        <Link to="/about" className="hover:text-foreground transition-colors">AGB</Link>
      </div>
      <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground/70 uppercase">
        POWERED BY KOREAN BIOMETRIC DATA SCIENCE — GERMANY
      </p>
      <p>© 2026 Skin Strategy Lab · skinstrategylab.de
      </p>
    </div>
  </footer>;

export default Footer;