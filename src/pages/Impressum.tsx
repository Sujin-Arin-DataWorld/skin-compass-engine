import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Impressum = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="mx-auto max-w-[960px] px-6 pt-24 pb-16">
      <h1 className="font-display text-3xl text-foreground">Impressum</h1>
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="font-medium text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
          <div className="space-y-1">
            <p>Skin Strategy Lab GmbH</p>
            <p>Musterstraße 123</p>
            <p>10115 Berlin</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-3">Kontakt</h2>
          <div className="space-y-1">
            <p>Telefon: +49 (0) 30 12345678</p>
            <p>E-Mail: <a href="mailto:kontakt@skinstrategylab.de" className="text-primary hover:underline">kontakt@skinstrategylab.de</a></p>
          </div>
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-3">Vertreten durch</h2>
          <div className="space-y-1">
            <p>Dr. med. Beispiel Name (Geschäftsführer)</p>
          </div>
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-3">Registereintrag</h2>
          <div className="space-y-1">
            <p>Eintragung im Handelsregister.</p>
            <p>Registergericht: Amtsgericht Berlin (Charlottenburg)</p>
            <p>Registernummer: HRB 123456 B</p>
          </div>
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-3">Umsatzsteuer-ID</h2>
          <div className="space-y-1">
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
            <p>DE 999 999 999</p>
          </div>
        </section>

        <section className="pt-8 border-t border-border/50 text-xs">
          <h3 className="font-medium text-foreground mb-2">Haftungsausschluss (Disclaimer)</h3>
          <p className="mb-4">
            Die Inhalte dieser Website (insbesondere die Hautanalyse) dienen ausschließlich zu Informationszwecken und ersetzen keine professionelle medizinische Beratung, Diagnose oder Behandlung.
          </p>
          <p>
            Wir sind gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
          </p>
        </section>

      </div>
    </div>
    <Footer />
  </div>
);

export default Impressum;
