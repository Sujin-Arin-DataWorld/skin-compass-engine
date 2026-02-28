import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Datenschutz = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="mx-auto max-w-[960px] px-6 pt-24 pb-16">
      <h1 className="font-display text-3xl text-foreground">Datenschutzerklärung</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-medium text-foreground">1. Verantwortlicher</h2>
          <p className="mt-2">[PLACEHOLDER]</p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p className="mt-2">
            Diese Website setzt keine Tracking-Cookies ohne Einwilligung ein.
            Ihre Hautanalyse-Daten werden ausschließlich lokal in Ihrem Browser verarbeitet
            und nicht an Server übertragen.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">3. Cookies</h2>
          <p className="mt-2">Notwendige Cookies: Einwilligungsstatus (cookie_consent)</p>
          <p>Analyse-Cookies: Nur nach ausdrücklicher Einwilligung</p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">4. Ihre Rechte (DSGVO Art. 15–22)</h2>
          <p className="mt-2">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
            Datenübertragbarkeit und Widerspruch.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">5. Kontakt Datenschutzbeauftragter</h2>
          <p className="mt-2">[PLACEHOLDER]</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Datenschutz;
