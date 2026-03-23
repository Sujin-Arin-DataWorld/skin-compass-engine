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
          <p className="mt-2">
            Verantwortlicher für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:<br />
            Skin Strategy Lab GmbH<br />
            Musterstraße 123<br />
            10115 Berlin, Deutschland<br />
            E-Mail: datenschutz@skinstrategylab.de
          </p>
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
            Diese Website setzt keine Tracking-Cookies ohne Einwilligung ein. Ihre Hautanalyse-Daten werden ausschließlich zur Bereitstellung der personalisierten Ergebnisse verarbeitet.
          </p>
          <p className="mt-2 font-medium text-primary">
            Die Verarbeitung Ihrer Hautdaten erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">4. Registrierung und Kundenkonto</h2>
          <p className="mt-2">
            Wenn Sie ein Konto auf unserer Website erstellen, verarbeiten wir Ihre E-Mail-Adresse und Ihren Namen zur Verwaltung Ihres Profils und Ihrer Bestellungen (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO).
          </p>
        </section>

        {/* ── Google OAuth & Google API Services User Data ─────────────── */}
        <section>
          <h2 className="font-medium text-foreground">5. Anmeldung über Google (Google OAuth 2.0) – Google API Services User Data Policy</h2>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.1 Welche Google-Nutzerdaten wir erheben</h3>
          <p className="mt-2">
            Wenn Sie sich über „Mit Google anmelden" (Google Sign-In / Google OAuth 2.0) registrieren oder einloggen, erhalten wir ausschließlich die folgenden Daten aus Ihrem Google-Konto:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>E-Mail-Adresse</strong> – zur eindeutigen Identifikation Ihres Kontos und für kontobezogene Mitteilungen.</li>
            <li><strong>Anzeigename (Vor- und Nachname)</strong> – zur Personalisierung Ihres Profils innerhalb der Anwendung.</li>
            <li><strong>Profilbild-URL</strong> – zur Anzeige Ihres Avatars in der Benutzeroberfläche.</li>
          </ul>
          <p className="mt-2">
            Es werden keine weiteren Google-API-Bereiche (Scopes) über die grundlegenden Profil- und E-Mail-Informationen hinaus angefordert.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.2 Zweck der Datenverarbeitung</h3>
          <p className="mt-2">
            Die erhobenen Google-Nutzerdaten werden ausschließlich für folgende Zwecke verwendet:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Erstellung und Verwaltung Ihres Benutzerkontos bei Skin Strategy Lab.</li>
            <li>Authentifizierung und sicheres Einloggen.</li>
            <li>Personalisierung Ihrer Hautpflege-Empfehlungen und Ihres Nutzererlebnisses.</li>
          </ul>
          <p className="mt-2">
            Die Daten werden <strong>nicht</strong> für Werbezwecke, Profiling oder sonstige Zwecke verwendet, die über die genannten hinausgehen.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.3 Datenweitergabe und Drittanbieter</h3>
          <p className="mt-2">
            Ihre Google-Nutzerdaten werden <strong>nicht</strong> an Dritte verkauft, vermietet oder zu Werbezwecken weitergegeben. Die Daten werden in einer von Supabase gehosteten Datenbank gespeichert und ausschließlich zur Bereitstellung des Dienstes verwendet.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.4 Speicherdauer und Löschung</h3>
          <p className="mt-2">
            Die aus Ihrem Google-Konto übermittelten Daten werden für die Dauer Ihrer Kontonutzung gespeichert. Bei Löschung Ihres Kontos werden sämtliche damit verbundenen personenbezogenen Daten – einschließlich der von Google erhaltenen Informationen – vollständig und unwiderruflich gelöscht.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.5 Rechtsgrundlage</h3>
          <p className="mt-2">
            Die Verarbeitung der Google-Nutzerdaten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sowie zur Erfüllung des Nutzungsvertrages (Art. 6 Abs. 1 lit. b DSGVO).
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.6 Einhaltung der Google API Services User Data Policy</h3>
          <p className="mt-2">
            Die Nutzung von über Google APIs erhaltenen Informationen durch Skin Strategy Lab erfolgt in Übereinstimmung mit der{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Google API Services User Data Policy
            </a>
            , einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use Requirements).
          </p>
          <p className="mt-2 font-medium text-primary">
            Skin Strategy Lab's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">6. SSL/TLS-Verschlüsselung</h2>
          <p className="mt-2">
            Diese Seite nutzt eine SSL- bzw TLS-Verschlüsselung, um die Sicherheit der Datenverarbeitung zu gewährleisten.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">7. Cookies</h2>
          <p className="mt-2">Notwendige Cookies: Einwilligungsstatus, Login-Status (Local Storage)</p>
          <p>Es werden keine externen Tracking-Cookies ohne explizite Einwilligung gesetzt.</p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">8. Ihre Rechte (DSGVO Art. 15–22)</h2>
          <p className="mt-2">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
          </p>
          <p className="mt-2 font-medium">
            Beschwerderecht: Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-foreground">9. Kontakt Datenschutzbeauftragter</h2>
          <p className="mt-2">Unseren Datenschutzbeauftragten erreichen Sie unter: datenschutz@skinstrategylab.de</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Datenschutz;
