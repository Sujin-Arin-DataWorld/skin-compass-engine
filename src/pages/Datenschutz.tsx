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
            Sujin Park<br />
            (Skin Strategy Lab)<br />
            {/* TODO: Jin — 실제 주소로 교체 */}
            [Kurfürstenstraße] [14]<br />
            [60486] Frankfurt am Main, Deutschland<br />
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

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.1 Angeforderte OAuth-Bereiche und erhobene Daten (Data Accessed)</h3>
          <p className="mt-2">
            Skin Strategy Lab fordert bei der Anmeldung über Google ausschließlich die folgenden OAuth 2.0-Bereiche (Scopes) an:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><code>openid</code> — zur Authentifizierung über OpenID Connect</li>
            <li><code>email</code> — zum Abruf Ihrer E-Mail-Adresse</li>
            <li><code>profile</code> — zum Abruf Ihres Anzeigenamens und Profilbilds</li>
          </ul>
          <p className="mt-2">
            Es werden <strong>keine</strong> erweiterten (sensitive) oder eingeschränkten (restricted) Scopes angefordert.
          </p>
          <p className="mt-2">
            Die folgenden personenbezogenen Daten werden dabei aus Ihrem Google-Konto übermittelt:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>E-Mail-Adresse</strong> — zur eindeutigen Identifikation Ihres Kontos und für kontobezogene Mitteilungen.</li>
            <li><strong>Anzeigename (Vor- und Nachname)</strong> — zur Personalisierung Ihres Profils innerhalb der Anwendung.</li>
            <li><strong>Profilbild-URL</strong> — zur Anzeige Ihres Avatars in der Benutzeroberfläche.</li>
          </ul>
          <p className="mt-2">
            Über diese Angaben hinaus werden <strong>keine</strong> weiteren Daten aus Ihrem Google-Konto abgerufen.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.2 Verwendungszweck (Data Usage)</h3>
          <p className="mt-2">
            Die erhobenen Google-Nutzerdaten werden ausschließlich für folgende Zwecke verwendet:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Erstellung und Verwaltung Ihres Benutzerkontos bei Skin Strategy Lab.</li>
            <li>Authentifizierung und sicheres Einloggen über Supabase Auth.</li>
            <li>Personalisierung Ihrer Benutzeroberfläche (Anzeigename, Avatar).</li>
          </ul>
          <p className="mt-2">
            Die Datenverarbeitung erfolgt vollautomatisch über Supabase Auth. Es findet <strong>keine</strong> manuelle Einsichtnahme in Ihre Google-Nutzerdaten durch Mitarbeiter statt.
          </p>
          <p className="mt-2">
            Ihre Google-Nutzerdaten werden <strong>nicht</strong> verwendet für:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Werbung, Marketing oder Remarketing</li>
            <li>Profiling oder Verhaltensanalysen</li>
            <li>Training von KI-/ML-Modellen</li>
            <li>Datenanreicherung durch Drittquellen</li>
            <li>Weiterverkauf, Vermietung oder sonstige kommerzielle Verwertung</li>
          </ul>
          <p className="mt-2">
            Die Google-Nutzerdaten fließen <strong>nicht</strong> in die Hautdiagnose-Engine oder die Produktempfehlungslogik ein. Diese Systeme verarbeiten ausschließlich die von Ihnen im Fragebogen eingegebenen Hautdaten.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.3 Datenspeicherung und Sicherheit (Data Storage)</h3>
          <p className="mt-2">
            Ihre Google-Nutzerdaten werden an folgenden Orten gespeichert:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Serverseitig</strong>: In der Supabase-Authentifizierungsdatenbank (<code>auth.users</code>-Tabelle), gehostet auf Amazon Web Services (AWS) in der Region <strong>eu-central-1 (Frankfurt, Deutschland)</strong>.</li>
            <li><strong>Clientseitig</strong>: Im Local Storage Ihres Browsers (Schlüssel: <code>skin-strategy-auth</code>) zur Aufrechterhaltung Ihrer Sitzung. Diese Daten werden bei Abmeldung automatisch gelöscht.</li>
          </ul>
          <p className="mt-2">Sicherheitsmaßnahmen:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Sämtliche Datenübertragungen erfolgen über TLS-verschlüsselte Verbindungen (HTTPS).</li>
            <li>Der Datenbankzugriff ist durch Row Level Security (RLS) geschützt — jeder Nutzer kann ausschließlich auf seine eigenen Daten zugreifen.</li>
            <li>Die OAuth-Authentifizierung verwendet den PKCE-Standard (Proof Key for Code Exchange), um Token-Abfang-Angriffe zu verhindern.</li>
            <li>Access-Token werden serverseitig von Supabase verwaltet und nicht im Client-Code exponiert.</li>
          </ul>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.4 Datenweitergabe und Auftragsverarbeiter (Data Sharing)</h3>
          <p className="mt-2">
            Ihre Google-Nutzerdaten werden <strong>nicht</strong> an Dritte verkauft, vermietet oder zu Werbezwecken weitergegeben.
          </p>
          <p className="mt-2">
            Zur Bereitstellung des Dienstes setzen wir folgende Auftragsverarbeiter (Sub-processors) ein:
          </p>
          <table className="mt-3 w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 pr-4 font-medium text-foreground">Anbieter</th>
                <th className="text-left py-2 pr-4 font-medium text-foreground">Zweck</th>
                <th className="text-left py-2 pr-4 font-medium text-foreground">Standort</th>
                <th className="text-left py-2 font-medium text-foreground">Datentyp</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-4 font-medium">Supabase Inc.</td>
                <td className="py-2 pr-4">Authentifizierung &amp; Datenbank</td>
                <td className="py-2 pr-4">AWS eu-central-1 (Frankfurt)</td>
                <td className="py-2">E-Mail, Name, Avatar-URL</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 pr-4 font-medium">Vercel Inc.</td>
                <td className="py-2 pr-4">Frontend-Hosting &amp; CDN</td>
                <td className="py-2 pr-4">Edge (global)</td>
                <td className="py-2">Keine Google-Nutzerdaten gespeichert</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2">
            Es erfolgt <strong>keine</strong> Übermittlung Ihrer Google-Nutzerdaten in Drittstaaten außerhalb der EU/EWR zu Speicherzwecken. Die Supabase-Datenbankinstanz befindet sich ausschließlich in Frankfurt (eu-central-1).
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.5 Speicherdauer und Löschung (Data Retention &amp; Deletion)</h3>
          <p className="mt-2">
            Die aus Ihrem Google-Konto übermittelten Daten werden für die Dauer Ihrer Kontonutzung gespeichert.
          </p>
          <p className="mt-2">
            Bei Löschung Ihres Kontos werden sämtliche damit verbundenen personenbezogenen Daten — einschließlich der von Google erhaltenen Informationen — vollständig und unwiderruflich aus der Supabase-Datenbank sowie aus dem Local Storage gelöscht.
          </p>
          <p className="mt-2">
            Sie können Ihr Konto jederzeit über die Kontoeinstellungen löschen oder eine Löschung per E-Mail an{" "}
            <a href="mailto:datenschutz@skinstrategylab.de" className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">datenschutz@skinstrategylab.de</a> anfordern.
          </p>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.6 Rechtsgrundlage</h3>
          <p className="mt-2">
            Die Verarbeitung der Google-Nutzerdaten erfolgt auf Grundlage:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Ihrer <strong>Einwilligung</strong> gemäß Art. 6 Abs. 1 lit. a DSGVO (erteilt durch Klick auf „Mit Google anmelden").</li>
            <li>Der <strong>Vertragserfüllung</strong> gemäß Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Benutzerkontos und personalisierter Dienste).</li>
          </ul>

          <h3 className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">5.7 Einhaltung der Google API Services User Data Policy (Compliance)</h3>
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
          <h2 className="font-medium text-foreground">9. Kontakt für Datenschutzanfragen</h2>
          <p className="mt-2">Für Datenschutzanfragen erreichen Sie uns unter: datenschutz@skinstrategylab.de</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Datenschutz;
