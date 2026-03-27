/**
 * Agb.tsx — Allgemeine Geschäftsbedingungen (Terms of Service)
 *
 * German commercial law (§ 305 BGB) requires AGB to be clearly accessible.
 * This page provides multilingual Terms of Service content with proper
 * legal section numbering and professional typography.
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import { tokens } from "@/lib/designTokens";
import { useEffect } from "react";

// ── i18n content ────────────────────────────────────────────────────────────
const AGB_COPY = {
  ko: {
    pageTitle: "이용약관 | SkinStrategyLab",
    title: "이용약관",
    subtitle: "Allgemeine Geschäftsbedingungen (AGB)",
    lastUpdated: "최종 업데이트: 2026년 3월",
    sections: [
      {
        heading: "§ 1 적용 범위",
        paragraphs: [
          "본 이용약관은 Skin Strategy Lab(이하 '회사')이 운영하는 웹사이트 skinstrategylab.de를 통해 제공하는 모든 서비스 및 제품에 적용됩니다.",
          "본 약관에 동의하지 않으시면 서비스를 이용하실 수 없습니다. 서비스 이용 시 본 약관에 동의한 것으로 간주됩니다.",
        ],
      },
      {
        heading: "§ 2 계약 체결",
        paragraphs: [
          "웹사이트에 표시되는 제품 및 서비스 안내는 법적 구속력이 있는 청약이 아닌 주문을 위한 초대(invitatio ad offerendum)입니다.",
          "고객이 주문을 완료하면 회사가 주문 확인 이메일을 발송한 시점에 계약이 성립됩니다.",
        ],
      },
      {
        heading: "§ 3 가격 및 결제",
        paragraphs: [
          "모든 가격은 법정 부가가치세(VAT)를 포함한 총 금액이며, 별도의 배송비가 추가될 수 있습니다.",
          "결제는 웹사이트에 표시된 결제 수단으로만 가능합니다.",
        ],
      },
      {
        heading: "§ 4 배송",
        paragraphs: [
          "배송은 독일 및 EU 지역에 한하여 제공됩니다. 배송 예상 기간은 주문 확인 후 영업일 기준 3~7일입니다.",
          "천재지변 또는 물류 사정에 의한 지연에 대해서는 회사가 책임지지 않습니다.",
        ],
      },
      {
        heading: "§ 5 철회권 (Widerrufsrecht)",
        paragraphs: [
          "소비자는 제품 수령일로부터 14일 이내에 별도 사유 없이 계약을 철회할 수 있습니다.",
          "철회 시 제품은 미사용 원래 상태로 반환되어야 하며, 반환 배송비는 소비자가 부담합니다.",
        ],
      },
      {
        heading: "§ 6 피부 진단 서비스",
        paragraphs: [
          "AI 기반 피부 진단은 정보 제공 목적으로만 사용되며, 전문 피부과 의사의 진단을 대체하지 않습니다.",
          "진단에 사용된 얼굴 이미지는 AI 분석 직후 즉시 영구 삭제되며, 어떠한 형태로도 저장되지 않습니다.",
        ],
      },
      {
        heading: "§ 7 책임 제한",
        paragraphs: [
          "회사는 고의 또는 중과실에 의한 손해에 대해서만 책임을 집니다.",
          "피부 진단 결과에 기반한 개인적 결정에 대한 책임은 사용자에게 있습니다.",
        ],
      },
      {
        heading: "§ 8 준거법 및 관할",
        paragraphs: [
          "본 약관은 독일연방공화국 법률에 따라 해석되며, 관할 법원은 프랑크푸르트 암 마인(Frankfurt am Main)입니다.",
          "EU 온라인 분쟁 해결 플랫폼: https://ec.europa.eu/consumers/odr",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Terms of Service | SkinStrategyLab",
    title: "Terms of Service",
    subtitle: "Allgemeine Geschäftsbedingungen (AGB)",
    lastUpdated: "Last updated: March 2026",
    sections: [
      {
        heading: "§ 1 Scope",
        paragraphs: [
          "These Terms and Conditions apply to all services and products offered through the website skinstrategylab.de, operated by Skin Strategy Lab (hereinafter 'the Company').",
          "By using our services, you agree to these Terms. If you do not agree, you may not use the services.",
        ],
      },
      {
        heading: "§ 2 Conclusion of Contract",
        paragraphs: [
          "The presentation of products and services on our website does not constitute a legally binding offer, but an invitation to order (invitatio ad offerendum).",
          "A binding contract is formed when the Company sends an order confirmation email upon completion of your purchase.",
        ],
      },
      {
        heading: "§ 3 Prices and Payment",
        paragraphs: [
          "All prices include statutory value-added tax (VAT). Shipping costs may apply additionally and are displayed during checkout.",
          "Payment is only accepted through the methods displayed on the website.",
        ],
      },
      {
        heading: "§ 4 Shipping",
        paragraphs: [
          "Shipping is available to Germany and EU countries. Estimated delivery time is 3–7 business days after order confirmation.",
          "The Company is not liable for delays caused by force majeure or logistics disruptions.",
        ],
      },
      {
        heading: "§ 5 Right of Withdrawal",
        paragraphs: [
          "Consumers may withdraw from the contract within 14 days of receiving the product without stating a reason.",
          "Products must be returned in their original, unused condition. Return shipping costs are borne by the consumer.",
        ],
      },
      {
        heading: "§ 6 Skin Diagnosis Service",
        paragraphs: [
          "AI-powered skin diagnosis is provided for informational purposes only and does not replace professional dermatological consultation.",
          "Facial images used for AI analysis are permanently deleted immediately after processing and are never stored in any form.",
        ],
      },
      {
        heading: "§ 7 Limitation of Liability",
        paragraphs: [
          "The Company is liable only for damages caused by intent or gross negligence.",
          "Users are solely responsible for personal decisions made based on skin diagnosis results.",
        ],
      },
      {
        heading: "§ 8 Governing Law and Jurisdiction",
        paragraphs: [
          "These Terms are governed by the laws of the Federal Republic of Germany. The court of jurisdiction is Frankfurt am Main.",
          "EU Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr",
        ],
      },
    ],
  },
  de: {
    pageTitle: "AGB | SkinStrategyLab",
    title: "Allgemeine Geschäftsbedingungen",
    subtitle: "AGB",
    lastUpdated: "Stand: März 2026",
    sections: [
      {
        heading: "§ 1 Geltungsbereich",
        paragraphs: [
          "Diese Allgemeinen Geschäftsbedingungen gelten für alle über die Website skinstrategylab.de angebotenen Dienstleistungen und Produkte der Skin Strategy Lab (nachfolgend \u201eAnbieter\u201c).",
          "Mit der Nutzung unserer Dienste stimmen Sie diesen AGB zu. Wenn Sie nicht zustimmen, dürfen Sie die Dienste nicht nutzen.",
        ],
      },
      {
        heading: "§ 2 Vertragsschluss",
        paragraphs: [
          "Die Darstellung der Produkte und Dienstleistungen auf unserer Website stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum).",
          "Ein verbindlicher Vertrag kommt zustande, wenn der Anbieter eine Auftragsbestätigung per E-Mail versendet.",
        ],
      },
      {
        heading: "§ 3 Preise und Zahlung",
        paragraphs: [
          "Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Versandkosten können zusätzlich anfallen und werden im Bestellvorgang ausgewiesen.",
          "Die Zahlung erfolgt ausschließlich über die auf der Website angegebenen Zahlungsarten.",
        ],
      },
      {
        heading: "§ 4 Lieferung",
        paragraphs: [
          "Die Lieferung erfolgt innerhalb Deutschlands und der EU. Die voraussichtliche Lieferzeit beträgt 3–7 Werktage nach Auftragsbestätigung.",
          "Der Anbieter haftet nicht für Verzögerungen aufgrund höherer Gewalt oder logistischer Störungen.",
        ],
      },
      {
        heading: "§ 5 Widerrufsrecht",
        paragraphs: [
          "Verbraucher können den Vertrag innerhalb von 14 Tagen nach Erhalt der Ware ohne Angabe von Gründen widerrufen.",
          "Die Ware ist in ihrem ursprünglichen, unbenutzten Zustand zurückzusenden. Die Kosten der Rücksendung trägt der Verbraucher.",
        ],
      },
      {
        heading: "§ 6 Hautdiagnose-Service",
        paragraphs: [
          "Die KI-gestützte Hautdiagnose dient ausschließlich Informationszwecken und ersetzt keine professionelle dermatologische Beratung.",
          "Die für die KI-Analyse verwendeten Gesichtsbilder werden unmittelbar nach der Verarbeitung unwiderruflich gelöscht und in keiner Form gespeichert.",
        ],
      },
      {
        heading: "§ 7 Haftungsbeschränkung",
        paragraphs: [
          "Der Anbieter haftet nur für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit verursacht wurden.",
          "Für persönliche Entscheidungen, die auf den Ergebnissen der Hautdiagnose beruhen, trägt der Nutzer die alleinige Verantwortung.",
        ],
      },
      {
        heading: "§ 8 Anwendbares Recht und Gerichtsstand",
        paragraphs: [
          "Diese AGB unterliegen dem Recht der Bundesrepublik Deutschland. Gerichtsstand ist Frankfurt am Main.",
          "EU-Plattform zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr",
        ],
      },
    ],
  },
} as const;

// ─── Component ──────────────────────────────────────────────────────────────

export default function Agb() {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tok = tokens(isDark);

  const copy = AGB_COPY[language as keyof typeof AGB_COPY] ?? AGB_COPY.en;

  // Dynamic meta
  useEffect(() => {
    const prev = document.title;
    document.title = copy.pageTitle;
    return () => { document.title = prev; };
  }, [copy.pageTitle]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: tok.bg }}>
      <Navbar />
      <div className="mx-auto max-w-[760px] px-6 pt-24 pb-20">
        {/* Header */}
        <p
          className="text-[0.62rem] tracking-[0.3em] uppercase font-medium mb-4"
          style={{ color: tok.accent, fontFamily: "var(--font-sans)" }}
        >
          Skin Strategy Lab
        </p>
        <h1
          className="text-3xl md:text-4xl font-light mb-2"
          style={{ fontFamily: "var(--font-display)", color: tok.text }}
        >
          {copy.title}
        </h1>
        {language !== "de" && (
          <p
            className="text-sm italic mb-4"
            style={{ color: tok.textTertiary, fontFamily: "var(--font-sans)" }}
          >
            {copy.subtitle}
          </p>
        )}
        <p
          className="text-xs mb-12"
          style={{ color: tok.textTertiary, fontFamily: "var(--font-sans)" }}
        >
          {copy.lastUpdated}
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {copy.sections.map((section, i) => (
            <section key={i}>
              <h2
                className="text-lg md:text-xl font-medium mb-4"
                style={{ color: tok.text, fontFamily: "var(--font-display)" }}
              >
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className="text-sm leading-[1.8]"
                    style={{ color: tok.textSecondary, fontFamily: "var(--font-sans)" }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Divider + Operator info */}
        <div
          className="mt-16 pt-8 border-t text-xs space-y-1"
          style={{ borderColor: tok.border, color: tok.textTertiary, fontFamily: "var(--font-sans)" }}
        >
          <p className="font-medium" style={{ color: tok.textSecondary }}>Skin Strategy Lab</p>
          <p>Sujin Park · Frankfurt am Main, Deutschland</p>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:info@skinstrategylab.de"
              style={{ color: tok.accent }}
              className="hover:underline"
            >
              info@skinstrategylab.de
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
