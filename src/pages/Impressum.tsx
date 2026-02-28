import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Impressum = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="mx-auto max-w-[960px] px-6 pt-24 pb-16">
      <h1 className="font-display text-3xl text-foreground">Impressum</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Angaben gemäß § 5 TMG</p>
        <p>[Name / Unternehmensname]: [PLACEHOLDER]</p>
        <p>[Adresse]: [PLACEHOLDER]</p>
        <p>[Kontakt]: [PLACEHOLDER]</p>
        <p>[E-Mail]: [PLACEHOLDER]</p>
        <p className="mt-6 font-medium text-foreground">
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
        </p>
        <p>[PLACEHOLDER]</p>
        <p className="mt-6 font-medium text-foreground">Haftungsausschluss / Disclaimer:</p>
        <p>
          Die Inhalte dieser Website dienen ausschließlich zu Informationszwecken
          und ersetzen keine ärztliche Beratung oder Diagnose.
        </p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Impressum;
