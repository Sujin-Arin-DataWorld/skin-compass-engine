import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border py-8">
    <div className="mx-auto flex max-w-[960px] flex-col items-center gap-4 px-6 text-sm text-muted-foreground">
      <div className="flex gap-6">
        <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
        <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
      </div>
      <p>© 2025 Skin Strategy Lab · skinstrategylab.de</p>
    </div>
  </footer>
);

export default Footer;
