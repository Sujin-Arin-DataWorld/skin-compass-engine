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
          <h2 className="font-medium text-foreground">2. Hosting und Server-Log-Files</h2>
          <p className="mt-2">
            Der Anbieter der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Files. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">3. Erhebung und Speicherung personenbezogener Daten (Hautanalyse)</h2>
          <p className="mt-2">
            Diese Website setzt keine Tracking-Cookies ohne Einwilligung ein. Ihre Hautanalyse-Daten werden ausschließlich lokal in Ihrem Browser verarbeitet und nicht an Server übertragen.
          </p>
          <p className="mt-2 font-medium text-primary">
            Die Verarbeitung Ihrer Hautdaten erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">4. SSL/TLS-Verschlüsselung</h2>
          <p className="mt-2">
            Diese Seite nutzt eine SSL- bzw TLS-Verschlüsselung, um die Sicherheit der Datenverarbeitung zu gewährleisten.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">5. Cookies</h2>
          <p className="mt-2">Notwendige Cookies: Einwilligungsstatus (cookie_consent)</p>
          <p>Analyse-Cookies: Nur nach ausdrücklicher Einwilligung</p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">6. Ihre Rechte (DSGVO Art. 15–22)</h2>
          <p className="mt-2">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
          </p>
          <p className="mt-2 font-medium">
            Beschwerderecht: Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">7. Kontakt Datenschutzbeauftragter</h2>
          <p className="mt-2">[PLACEHOLDER]</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Datenschutz;
