import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18nStore } from "@/store/i18nStore";

/* ─────────────────────────────────────────────────────────────────────────────
 * Multilingual Privacy Policy — DE (DSGVO) · EN (GDPR) · KO (PIPA)
 *
 * Each language returns an array of { title, content } sections rendered by
 * the <Datenschutz> component. The component itself is 100 % data-driven,
 * keeping layout / animations / Navbar / Footer identical across languages.
 * ───────────────────────────────────────────────────────────────────────── */

const EFFECTIVE_DATE = "27. März 2026";

/* ── German (DSGVO) ──────────────────────────────────────────────────────── */
const DE = {
    heading: "Datenschutzerklärung",
    effectiveDate: `Stand: ${EFFECTIVE_DATE}`,
    sections: [
        {
            title: "1. Verantwortlicher",
            blocks: [
                `Verantwortlicher für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:\nSujin Park\n(Skin Strategy Lab)\nKurfürstenstraße 14\n60486 Frankfurt am Main, Deutschland\nE-Mail: datenschutz@skinstrategylab.de`,
            ],
        },
        {
            title: "2. Hosting und Server-Log-Files",
            blocks: [
                "Der Anbieter der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Files. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
            ],
        },
        {
            title: "3. Erhebung und Speicherung personenbezogener Daten (Hautanalyse)",
            blocks: [
                "Diese Website setzt keine Tracking-Cookies ohne Einwilligung ein. Ihre Hautanalyse-Daten werden ausschließlich zur Bereitstellung der personalisierten Ergebnisse verarbeitet.",
                "##Die Verarbeitung Ihrer Hautdaten erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO.",
            ],
        },
        {
            title: "3a. KI-Hautanalyse — Verarbeitung biometrischer Daten (Gesichtsbilder)",
            blocks: [
                "Im Rahmen der KI-Hautanalyse können Sie ein Foto Ihres Gesichts aufnehmen oder hochladen. Dieses Gesichtsbild wird als biometrisches Datum gemäß Art. 9 DSGVO behandelt.",
                "##Null-Speicherung-Garantie (Zero Data Retention):",
                "• Das Gesichtsbild wird über eine TLS-verschlüsselte Verbindung (HTTPS) an unsere KI-Analyse-API übertragen.",
                "• Die Analyse erfolgt in Echtzeit — das Bild wird ausschließlich zur sofortigen Auswertung verarbeitet.",
                "• Nach Abschluss der Analyse wird das Gesichtsbild sofort und unwiderruflich dauerhaft gelöscht.",
                "• Das Gesichtsbild wird NICHT auf unseren Servern, in der Datenbank, im Cloud-Speicher oder an einem anderen Ort gespeichert.",
                "• Es erfolgt keine Weitergabe des Bildes an Dritte.",
                "Die Rechtsgrundlage für die Verarbeitung ist Ihre ausdrückliche Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO, die Sie vor der Aufnahme des Fotos erteilen.",
            ],
        },
        {
            title: "3b. Datenspeicherung und Löschfristen (Data Retention)",
            blocks: [
                "Wir verarbeiten und speichern Ihre personenbezogenen Daten nur so lange, wie dies zur Erreichung des Speicherungszwecks erforderlich ist oder sofern dies durch gesetzliche Aufbewahrungsfristen (z. B. nach HGB oder AO) vorgeschrieben wurde.",
                "##Zero Data Retention Policy für Gesundheitsdaten:",
                "• Biometrische Daten (Gesichtsbilder) werden unmittelbar nach der Echtzeitanalyse unwiderruflich gelöscht. Es gibt keine Zwischenspeicherung auf unseren Servern.",
                "• Die errechneten Analyseergebnisse (Scores) werden an Ihr Nutzerkonto gebunden und können jederzeit in den Kontoeinstellungen vollständig gelöscht werden.",
                "• Ohne Nutzerkonto erstellte Analysen werden zur Aufrechterhaltung der Sitzungs-Funktionalität lokal (Local/Session Storage) gespeichert und serverseitig nach 90 Tagen durch automatisierte Routinen (pg_cron) gelöscht oder anonymisiert."
            ],
        },
        {
            title: "4. Registrierung und Kundenkonto",
            blocks: [
                "Wenn Sie ein Konto auf unserer Website erstellen, verarbeiten wir Ihre E-Mail-Adresse und Ihren Namen zur Verwaltung Ihres Profils und Ihrer Bestellungen (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO).",
            ],
        },
        {
            title: "5. Anmeldung über Google (Google OAuth 2.0) – Google API Services User Data Policy",
            blocks: [
                "###5.1 Angeforderte OAuth-Bereiche und erhobene Daten (Data Accessed)",
                "Skin Strategy Lab fordert bei der Anmeldung über Google ausschließlich die folgenden OAuth 2.0-Bereiche (Scopes) an:",
                "• openid — zur Authentifizierung über OpenID Connect\n• email — zum Abruf Ihrer E-Mail-Adresse\n• profile — zum Abruf Ihres Anzeigenamens und Profilbilds",
                "Es werden keine erweiterten (sensitive) oder eingeschränkten (restricted) Scopes angefordert.",
                "Die folgenden personenbezogenen Daten werden dabei aus Ihrem Google-Konto übermittelt:",
                "• E-Mail-Adresse — zur eindeutigen Identifikation Ihres Kontos und für kontobezogene Mitteilungen.\n• Anzeigename (Vor- und Nachname) — zur Personalisierung Ihres Profils innerhalb der Anwendung.\n• Profilbild-URL — zur Anzeige Ihres Avatars in der Benutzeroberfläche.",
                "Über diese Angaben hinaus werden keine weiteren Daten aus Ihrem Google-Konto abgerufen.",
                "###5.2 Verwendungszweck (Data Usage)",
                "Die erhobenen Google-Nutzerdaten werden ausschließlich für folgende Zwecke verwendet:",
                "• Erstellung und Verwaltung Ihres Benutzerkontos bei Skin Strategy Lab.\n• Authentifizierung und sicheres Einloggen über Supabase Auth.\n• Personalisierung Ihrer Benutzeroberfläche (Anzeigename, Avatar).",
                "Die Datenverarbeitung erfolgt vollautomatisch über Supabase Auth. Es findet keine manuelle Einsichtnahme in Ihre Google-Nutzerdaten durch Mitarbeiter statt.",
                "Ihre Google-Nutzerdaten werden NICHT verwendet für:",
                "• Werbung, Marketing oder Remarketing\n• Profiling oder Verhaltensanalysen\n• Training von KI-/ML-Modellen\n• Datenanreicherung durch Drittquellen\n• Weiterverkauf, Vermietung oder sonstige kommerzielle Verwertung",
                "Die Google-Nutzerdaten fließen NICHT in die Hautanalyse-Engine oder die Produktempfehlungslogik ein.",
                "###5.3 Datenspeicherung und Sicherheit (Data Storage)",
                "Ihre Google-Nutzerdaten werden an folgenden Orten gespeichert:",
                "• Serverseitig: In der Supabase-Authentifizierungsdatenbank (auth.users-Tabelle), gehostet auf Amazon Web Services (AWS) in der Region eu-central-1 (Frankfurt, Deutschland).\n• Clientseitig: Im Local Storage Ihres Browsers (Schlüssel: skin-strategy-auth) zur Aufrechterhaltung Ihrer Sitzung.",
                "Sicherheitsmaßnahmen:",
                "• Sämtliche Datenübertragungen erfolgen über TLS-verschlüsselte Verbindungen (HTTPS).\n• Der Datenbankzugriff ist durch Row Level Security (RLS) geschützt.\n• Die OAuth-Authentifizierung verwendet den PKCE-Standard.\n• Access-Token werden serverseitig von Supabase verwaltet.",
                "###5.4 Datenweitergabe und Auftragsverarbeiter (Data Sharing)",
                "Ihre Google-Nutzerdaten werden nicht an Dritte verkauft, vermietet oder zu Werbezwecken weitergegeben. Zur Bereitstellung des Dienstes setzen wir folgende Auftragsverarbeiter (Sub-processors) ein:",
                "##TABLE",
                "Es erfolgt keine Übermittlung Ihrer Google-Nutzerdaten in Drittstaaten außerhalb der EU/EWR zu Speicherzwecken.",
                "###5.5 Speicherdauer und Löschung (Data Retention & Deletion)",
                "Die aus Ihrem Google-Konto übermittelten Daten werden für die Dauer Ihrer Kontonutzung gespeichert. Bei Löschung Ihres Kontos werden sämtliche personenbezogenen Daten vollständig und unwiderruflich gelöscht.",
                "Sie können Ihr Konto jederzeit über die Kontoeinstellungen löschen oder per E-Mail an datenschutz@skinstrategylab.de anfordern.",
                "###5.6 Rechtsgrundlage",
                "Die Verarbeitung der Google-Nutzerdaten erfolgt auf Grundlage:",
                "• Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.\n• Der Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO.",
                "###5.7 Einhaltung der Google API Services User Data Policy (Compliance)",
                "Die Nutzung von über Google APIs erhaltenen Informationen durch Skin Strategy Lab erfolgt in Übereinstimmung mit der Google API Services User Data Policy, einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use Requirements).",
                "##GOOGLE_COMPLIANCE",
            ],
        },
        {
            title: "6. SSL/TLS-Verschlüsselung",
            blocks: [
                "Diese Seite nutzt eine SSL- bzw TLS-Verschlüsselung, um die Sicherheit der Datenverarbeitung zu gewährleisten.",
            ],
        },
        {
            title: "7. Cookies",
            blocks: [
                "Notwendige Cookies: Einwilligungsstatus, Login-Status (Local Storage). Es werden keine externen Tracking-Cookies ohne explizite Einwilligung gesetzt.",
            ],
        },
        {
            title: "8. Ihre Rechte (DSGVO Art. 15–22)",
            blocks: [
                "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.",
                "##Beschwerderecht: Sie haben gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.",
            ],
        },
        {
            title: "9. Kontakt für Datenschutzanfragen",
            blocks: [
                "Für Datenschutzanfragen erreichen Sie uns unter: datenschutz@skinstrategylab.de",
            ],
        },
    ],
};

/* ── English (GDPR) ──────────────────────────────────────────────────────── */
const EN = {
    heading: "Privacy Policy",
    effectiveDate: `Effective: March 27, 2026`,
    sections: [
        {
            title: "1. Data Controller",
            blocks: [
                `The data controller for this website under the General Data Protection Regulation (GDPR) is:\nSujin Park\n(Skin Strategy Lab)\nKurfürstenstraße 14\n60486 Frankfurt am Main, Germany\nEmail: datenschutz@skinstrategylab.de`,
            ],
        },
        {
            title: "2. Hosting and Server Log Files",
            blocks: [
                "The hosting provider automatically collects and stores information in server log files. Legal basis: Article 6(1)(f) GDPR.",
            ],
        },
        {
            title: "3. Collection and Storage of Personal Data (Skin Analysis)",
            blocks: [
                "This website does not use tracking cookies without consent. Your skin analysis data is processed solely to provide personalised results.",
                "##Processing of your skin data is based on your explicit consent under Article 9(2)(a) GDPR.",
            ],
        },
        {
            title: "3a. AI Skin Analysis — Processing of Biometric Data (Facial Images)",
            blocks: [
                "As part of our AI skin analysis, you may take or upload a photo of your face. This facial image is treated as biometric data under Article 9 GDPR.",
                "##Zero Data Retention Guarantee:",
                "• The facial image is transmitted via a TLS-encrypted connection (HTTPS) to our AI analysis API.",
                "• Analysis occurs in real-time — the image is processed solely for immediate evaluation.",
                "• Upon completion of the analysis, the facial image is instantly and irreversibly permanently deleted.",
                "• The facial image is NOT stored on our servers, in the database, in cloud storage, or at any other location.",
                "• The image is never shared with third parties.",
                "The legal basis for processing is your explicit consent under Article 9(2)(a) GDPR, given before taking the photo.",
            ],
        },
        {
            title: "3b. Data Storage and Deletion Periods (Data Retention)",
            blocks: [
                "We process and store your personal data only as long as necessary to achieve the purpose of storage or as required by statutory retention periods.",
                "##Zero Data Retention Policy for Health Data:",
                "• Biometric data (facial images) are irreversibly deleted immediately after the real-time analysis. There is no intermediate storage on our servers.",
                "• Calculated analysis results (scores) are tied to your user account and can be completely deleted in the account settings at any time.",
                "• Analyses created without a user account are stored locally (Local/Session Storage) to maintain session functionality and are deleted or anonymized server-side after 90 days by automated routines (pg_cron)."
            ],
        },
        {
            title: "4. Registration and User Account",
            blocks: [
                "When you create an account, we process your email address and name to manage your profile and orders (legal basis: Article 6(1)(b) GDPR).",
            ],
        },
        {
            title: "5. Sign-in via Google (Google OAuth 2.0) – Google API Services User Data Policy",
            blocks: [
                "###5.1 Requested OAuth Scopes and Data Accessed",
                "Skin Strategy Lab requests only the following OAuth 2.0 scopes when signing in via Google:",
                "• openid — for authentication via OpenID Connect\n• email — to retrieve your email address\n• profile — to retrieve your display name and profile picture",
                "No sensitive or restricted scopes are requested.",
                "The following personal data is transmitted from your Google account:",
                "• Email address — for unique account identification and account-related communications.\n• Display name (first and last name) — for personalising your profile.\n• Profile picture URL — for displaying your avatar in the user interface.",
                "No additional data is retrieved from your Google account.",
                "###5.2 Data Usage",
                "Google user data is used exclusively for:",
                "• Creating and managing your Skin Strategy Lab account.\n• Authentication and secure sign-in via Supabase Auth.\n• Personalising your user interface (display name, avatar).",
                "Processing is fully automated via Supabase Auth. No staff member manually accesses your Google user data.",
                "Your Google user data is NOT used for:",
                "• Advertising, marketing, or remarketing\n• Profiling or behavioural analysis\n• AI/ML model training\n• Data enrichment from third-party sources\n• Sale, rental, or other commercial exploitation",
                "Google user data does NOT feed into the skin analysis engine or product recommendation logic.",
                "###5.3 Data Storage and Security",
                "Your Google user data is stored at:",
                "• Server-side: In the Supabase authentication database (auth.users table), hosted on Amazon Web Services (AWS) in the eu-central-1 region (Frankfurt, Germany).\n• Client-side: In your browser's Local Storage (key: skin-strategy-auth) for session management.",
                "Security measures:",
                "• All data transfers use TLS-encrypted connections (HTTPS).\n• Database access is protected by Row Level Security (RLS).\n• OAuth uses the PKCE standard (Proof Key for Code Exchange).\n• Access tokens are managed server-side by Supabase.",
                "###5.4 Data Sharing and Sub-processors",
                "Your Google user data is not sold, rented, or shared for advertising. We use the following sub-processors:",
                "##TABLE",
                "No Google user data is transferred outside the EU/EEA for storage purposes.",
                "###5.5 Data Retention and Deletion",
                "Google account data is retained for the duration of your account. Upon account deletion, all personal data is completely and irreversibly deleted.",
                "You can delete your account from Account Settings or by emailing datenschutz@skinstrategylab.de.",
                "###5.6 Legal Basis",
                "Processing of Google user data is based on:",
                "• Your consent under Article 6(1)(a) GDPR.\n• Contract performance under Article 6(1)(b) GDPR.",
                "###5.7 Google API Services User Data Policy Compliance",
                "Skin Strategy Lab's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
                "##GOOGLE_COMPLIANCE",
            ],
        },
        {
            title: "6. SSL/TLS Encryption",
            blocks: [
                "This website uses SSL/TLS encryption to ensure the security of data processing.",
            ],
        },
        {
            title: "7. Cookies",
            blocks: [
                "Necessary cookies: consent status, login status (Local Storage). No external tracking cookies are set without explicit consent.",
            ],
        },
        {
            title: "8. Your Rights (GDPR Art. 15–22)",
            blocks: [
                "You have the right to access, rectification, erasure, restriction of processing, data portability, and objection.",
                "##Right to lodge a complaint: Under Art. 77 GDPR, you have the right to file a complaint with a data protection supervisory authority.",
            ],
        },
        {
            title: "9. Contact for Privacy Inquiries",
            blocks: [
                "For privacy inquiries, please contact us at: datenschutz@skinstrategylab.de",
            ],
        },
    ],
};

/* ── Korean (PIPA 개인정보 보호법) ──────────────────────────────────────── */
const KO = {
    heading: "개인정보 처리방침",
    effectiveDate: `시행일: 2026년 3월 27일`,
    sections: [
        {
            title: "제1조 (개인정보 처리 목적)",
            blocks: [
                "Skin Strategy Lab(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다:",
                "• 회원 가입 및 관리: 이메일 주소, 이름을 통한 회원 식별 및 계정 관리\n• 피부 분석 서비스 제공: 설문 응답 데이터 기반 10축 피부 벡터 분석 및 맞춤형 제품 추천\n• AI 피부 분석: 얼굴 사진을 활용한 AI 기반 실시간 피부 분석 (아래 제3조 참조)\n• 주문 처리 및 배송: 구매 내역 관리, 배송지 저장",
            ],
        },
        {
            title: "제2조 (수집하는 개인정보 항목 및 수집 방법)",
            blocks: [
                "회사는 다음의 개인정보를 수집합니다:",
                "**필수 수집 항목:**\n• Google 계정 연동 시: 이메일 주소, 이름(성·이름), 프로필 사진 URL\n• 이메일 가입 시: 이메일 주소, 이름, 비밀번호(암호화 저장)\n• 피부 분석 시: 설문 응답 데이터, 피부 축 점수, 피부 등급",
                "**민감정보 (선택):**\n• AI 피부 분석 이용 시: 얼굴 사진 (생체인식정보에 해당, 제3조에 따라 별도 동의 후 즉시 파기)",
                "**자동 수집 항목:**\n• 접속 로그, 브라우저 정보, IP 주소 (서버 로그 파일)",
            ],
        },
        {
            title: "제3조 (AI 피부 분석 — 민감정보(생체인식정보) 처리)",
            blocks: [
                "회사의 AI 피부 분석 기능 이용 시 이용자의 얼굴 사진이 처리됩니다. 얼굴 사진은 「개인정보 보호법」 제23조에 따른 민감정보(생체인식정보)에 해당합니다.",
                "##영구 삭제 보장 (Zero Data Retention):",
                "• 얼굴 사진은 TLS 암호화 연결(HTTPS)을 통해 AI 분석 API로 전송됩니다.",
                "• 분석은 실시간으로 수행되며, 사진은 즉각적인 분석 목적으로만 처리됩니다.",
                "• 분석 완료 즉시 얼굴 사진은 영구적으로 파기되며, 복원이 불가능합니다.",
                "• 얼굴 사진은 서버, 데이터베이스, 클라우드 저장소 등 어떠한 저장소에도 보관되지 않습니다.",
                "• 제3자에게 얼굴 사진이 제공되지 않습니다.",
                "처리의 법적 근거: 「개인정보 보호법」 제23조에 따른 이용자의 명시적 동의 (사진 촬영 전 별도 동의 취득).",
            ],
        },
        {
            title: "제3b조 데이터 보관 및 파기 기간 (Data Retention)",
            blocks: [
                "회사는 데이터 보관 목적을 달성하는 데 필요한 기간 동안 또는 법정 보관 의무 기간(예: 전자상거래법 등)에 따라 이용자의 개인정보를 처리 및 보유합니다.",
                "##건강 데이터에 대한 영구 삭제 보장 정책 (Zero Data Retention Policy):",
                "• 생체 데이터(얼굴 사진)는 실시간 분석 직후 복원할 수 없도록 영구적으로 파기됩니다. 당사 서버에는 어떠한 임시 저장도 이루어지지 않습니다.",
                "• 산출된 분석 결과(점수)는 귀하의 사용자 계정에 연결되며, 계정 설정에서 언제든지 완전히 삭제할 수 있습니다.",
                "• 사용자 계정 없이 생성된 분석 결과는 세션 기능 유지를 위해 기기에 로컬로(Local/Session Storage) 저장되며, 서버 측 데이터는 90일 후 자동화된 매크로(pg_cron)에 의해 삭제되거나 익명화됩니다."
            ],
        },
        {
            title: "제4조 (개인정보의 국외 이전)",
            blocks: [
                "회사는 서비스 제공을 위해 이용자의 개인정보를 아래와 같이 국외로 이전합니다:",
                "##개인정보 국외 이전 상세:",
                "• 이전받는 자: Supabase Inc. (미국)\n• 이전되는 국가: 독일 (EU)\n• 이전 항목: 이메일 주소, 이름, 프로필 사진 URL, 피부 분석 데이터\n• 이전 목적: 인증, 데이터베이스 관리 및 서비스 제공\n• 이전 방법: TLS 암호화를 통한 네트워크 전송\n• 보관 장소: Amazon Web Services (AWS) eu-central-1 리전 (독일 프랑크푸르트)\n• 보유 및 이용 기간: 회원 탈퇴 시까지 (탈퇴 시 즉시 파기)",
                "독일은 EU/EEA 회원국으로 GDPR(일반 데이터 보호 규정)이 적용되는 국가이며, 개인정보 보호 수준이 국내법과 동등 이상입니다.",
                "이용자는 개인정보 국외 이전에 대한 동의를 언제든지 철회할 수 있으며, 이 경우 서비스 이용이 제한될 수 있습니다.",
            ],
        },
        {
            title: "제5조 (Google OAuth 2.0을 통한 로그인)",
            blocks: [
                "회사는 Google OAuth 2.0을 통한 소셜 로그인을 제공합니다. 요청되는 권한(Scopes)은 다음과 같습니다:",
                "• openid — OpenID Connect 인증\n• email — 이메일 주소 조회\n• profile — 표시 이름 및 프로필 사진 조회",
                "민감하거나 제한된 추가 권한은 요청하지 않습니다.",
                "Google로부터 수신한 데이터는 계정 관리 및 UI 개인화 목적으로만 사용되며, 광고·마케팅·AI 학습·제3자 판매 등에 일체 사용되지 않습니다.",
                "##Google API Services User Data Policy 준수",
                "##GOOGLE_COMPLIANCE",
            ],
        },
        {
            title: "제6조 (개인정보의 보유 및 이용 기간)",
            blocks: [
                "이용자의 개인정보는 회원 탈퇴 시까지 보유합니다. 회원 탈퇴 시 모든 개인정보는 즉시 파기됩니다.",
                "AI 피부 분석을 위한 얼굴 사진은 분석 완료 즉시 파기되며, 별도로 보관하지 않습니다.",
                "이용자는 계정 설정에서 직접 계정을 삭제하거나, datenschutz@skinstrategylab.de로 삭제를 요청할 수 있습니다.",
            ],
        },
        {
            title: "제7조 (개인정보의 파기 절차 및 방법)",
            blocks: [
                "• 파기 절차: 보유 기간 만료 또는 회원 탈퇴 시 해당 정보를 지체 없이 파기합니다.\n• 파기 방법: 전자적 파일은 재생이 불가능한 기술적 방법으로 삭제하며, 데이터베이스의 RPC 함수(delete_account_cascade)를 통해 연관 데이터를 일괄 삭제합니다.",
            ],
        },
        {
            title: "제8조 (정보주체의 권리·의무 및 행사 방법)",
            blocks: [
                "이용자(정보주체)는 회사에 대해 다음의 권리를 행사할 수 있습니다:",
                "• 개인정보 열람 요구\n• 오류 등이 있을 경우 정정 요구\n• 삭제 요구\n• 처리 정지 요구",
                "권리 행사는 개인정보 보호법 시행령 제41조 제1항에 따라 서면, 이메일 등을 통해 가능하며, 회사는 이에 지체 없이 조치합니다.",
                "문의: datenschutz@skinstrategylab.de",
            ],
        },
        {
            title: "제9조 (개인정보의 안전성 확보 조치)",
            blocks: [
                "회사는 개인정보의 안전성 확보를 위해 다음의 기술적·관리적 조치를 이행합니다:",
                "• 모든 데이터 전송은 TLS (HTTPS) 암호화를 통해 이루어집니다.\n• 데이터베이스는 Row Level Security (RLS) 정책으로 보호됩니다.\n• OAuth 인증에 PKCE(Proof Key for Code Exchange) 표준을 적용합니다.\n• Access Token은 서버 측에서 Supabase가 관리하며, 클라이언트에 노출되지 않습니다.\n• 비밀번호는 단방향 암호화(해싱) 처리하여 저장합니다.",
            ],
        },
        {
            title: "제10조 (쿠키)",
            blocks: [
                "필수 쿠키: 동의 상태, 로그인 상태(Local Storage). 명시적 동의 없이 외부 트래킹 쿠키를 설정하지 않습니다.",
            ],
        },
        {
            title: "제11조 (개인정보 보호 책임자 및 고충 처리)",
            blocks: [
                "개인정보 보호 책임자: Sujin Park\n이메일: datenschutz@skinstrategylab.de",
                "기타 개인정보 침해 신고·상담:",
                "• 개인정보침해신고센터 (privacy.kisa.or.kr / ☎ 118)\n• 대검찰청 사이버수사과 (spo.go.kr / ☎ 1301)\n• 경찰청 사이버안전국 (police.go.kr / ☎ 182)",
            ],
        },
    ],
};

/* ── Lookup ───────────────────────────────────────────────────────────────── */
const POLICY: Record<string, typeof DE> = { de: DE, en: EN, ko: KO };

/* ── Sub-processor table (shared across all languages) ────────────────────── */
function SubProcessorTable({ lang }: { lang: string }) {
    const isKo = lang === "ko";
    const isDe = lang === "de";

    const headers = isKo
        ? ["제공받는 자", "목적", "위치", "데이터 유형"]
        : isDe
            ? ["Anbieter", "Zweck", "Standort", "Datentyp"]
            : ["Provider", "Purpose", "Location", "Data Type"];

    const rows = [
        isKo
            ? ["Supabase Inc.", "인증 및 데이터베이스", "AWS eu-central-1 (프랑크푸르트, 독일)", "이메일, 이름, 아바타 URL"]
            : isDe
                ? ["Supabase Inc.", "Authentifizierung & Datenbank", "AWS eu-central-1 (Frankfurt)", "E-Mail, Name, Avatar-URL"]
                : ["Supabase Inc.", "Authentication & Database", "AWS eu-central-1 (Frankfurt)", "Email, Name, Avatar URL"],
        isKo
            ? ["Vercel Inc.", "프론트엔드 호스팅 & CDN", "Edge (글로벌)", "Google 사용자 데이터 저장 없음"]
            : isDe
                ? ["Vercel Inc.", "Frontend-Hosting & CDN", "Edge (global)", "Keine Google-Nutzerdaten gespeichert"]
                : ["Vercel Inc.", "Frontend Hosting & CDN", "Edge (global)", "No Google user data stored"],
    ];

    return (
        <table className="mt-3 w-full text-sm border-collapse">
            <thead>
                <tr className="border-b border-border/30">
                    {headers.map((h) => (
                        <th key={h} className="text-left py-2 pr-4 font-medium text-foreground">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/20">
                        {row.map((cell, j) => (
                            <td key={j} className={`py-2 pr-4${j === 0 ? " font-medium" : ""}`}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/* ── Google compliance statement (mandatory English + localised intro) ───── */
function GoogleComplianceBlock({ lang }: { lang: string }) {
    const intro = lang === "ko"
        ? "Skin Strategy Lab의 Google API를 통해 수신한 정보의 사용 및 기타 앱으로의 전송은"
        : lang === "de"
            ? "Die Nutzung von über Google APIs erhaltenen Informationen durch Skin Strategy Lab erfolgt in Übereinstimmung mit der"
            : "Skin Strategy Lab's use and transfer to any other app of information received from Google APIs will adhere to the";

    return (
        <p className="mt-2 font-medium text-primary">
            {intro}{" "}
            <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
                Google API Services User Data Policy
            </a>
            {lang === "ko"
                ? "를 준수하며, 제한적 사용(Limited Use) 요건을 포함합니다."
                : lang === "de"
                    ? ", einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use Requirements)."
                    : ", including the Limited Use requirements."}
        </p>
    );
}

/* ── Renderer ─────────────────────────────────────────────────────────────── */
function renderBlock(block: string, lang: string, idx: number) {
    // Special tokens
    if (block === "##TABLE") return <SubProcessorTable key={idx} lang={lang} />;
    if (block === "##GOOGLE_COMPLIANCE") return <GoogleComplianceBlock key={idx} lang={lang} />;

    // Sub-heading (###)
    if (block.startsWith("###")) {
        return (
            <h3 key={idx} className="mt-4 font-medium text-foreground text-xs uppercase tracking-wider opacity-80">
                {block.slice(3).trim()}
            </h3>
        );
    }

    // Highlighted paragraph (##)
    if (block.startsWith("##")) {
        return (
            <p key={idx} className="mt-2 font-medium text-primary">
                {block.slice(2).trim()}
            </p>
        );
    }

    // Bullet list (lines starting with •)
    if (block.includes("\n") && block.trim().startsWith("•")) {
        return (
            <ul key={idx} className="mt-2 list-disc pl-5 space-y-1">
                {block.split("\n").filter((l) => l.trim()).map((line, li) => (
                    <li key={li}>{renderBoldInline(line.replace(/^•\s*/, ""))}</li>
                ))}
            </ul>
        );
    }

    // Multi-line plain (address-like block)
    if (block.includes("\n")) {
        return (
            <p key={idx} className="mt-2" style={{ whiteSpace: "pre-line" }}>
                {renderBoldInline(block)}
            </p>
        );
    }

    // Regular paragraph
    return <p key={idx} className="mt-2">{renderBoldInline(block)}</p>;
}

/** Process **bold** markers inside a string */
function renderBoldInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return text;
    return (
        <>
            {parts.map((part, i) =>
                part.startsWith("**") && part.endsWith("**")
                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                    : part
            )}
        </>
    );
}

/* ── Component ────────────────────────────────────────────────────────────── */
const Datenschutz = () => {
    const { language } = useI18nStore();
    const p = POLICY[language] ?? POLICY.de;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div style={{ maxWidth: '960px', marginInline: 'auto', padding: 'clamp(20px, 6vw, 40px)', paddingTop: '96px', paddingBottom: '64px' }}>
                <h1 className="font-display text-3xl text-foreground">{p.heading}</h1>
                <p className="mt-2 text-xs text-muted-foreground">{p.effectiveDate}</p>

                <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
                    {p.sections.map((section, si) => (
                        <section key={si}>
                            <h2 className="font-medium text-foreground">{section.title}</h2>
                            {section.blocks.map((block, bi) => renderBlock(block, language, bi))}
                        </section>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Datenschutz;
