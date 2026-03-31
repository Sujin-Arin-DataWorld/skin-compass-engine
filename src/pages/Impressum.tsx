import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Impressum = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div style={{ maxWidth: '960px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)', paddingTop: '96px', paddingBottom: '64px' }}>
      <h1 className="font-display text-3xl text-foreground">Impressum</h1>
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="font-medium text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Sujin Park</p>
            <p>(Skin Strategy Lab)</p>
            {/* TODO: Jin — 실제 주소로 교체 */}
            <p>Kurfürstenstraße 14</p>
            <p>60486 Frankfurt am Main</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="font-medium text-foreground mb-3">Kontakt</h2>
          <div className="space-y-1">
            <p>E-Mail: <a href="mailto:info@skinstrategylab.de" className="text-primary hover:underline">info@skinstrategylab.de</a></p>
          </div>
        </section>

        <section className="pt-8 border-t border-border/50 text-xs">
          <h3 className="font-medium text-foreground mb-2">Haftungsausschluss (Disclaimer)</h3>
          <p className="mb-4">
            Die Inhalte dieser Website (insbesondere die Hautanalyse) dienen ausschließlich kosmetischen und informativen Zwecken und stellen keine medizinische Diagnose oder Behandlung dar.
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
