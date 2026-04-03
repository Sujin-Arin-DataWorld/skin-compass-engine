import { useI18nStore } from "@/store/i18nStore";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SilkBackground from "@/components/SilkBackground";
import { Link } from "react-router-dom";

export default function Widerrufsbelehrung() {
  const { language } = useI18nStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <SilkBackground />
      <Navbar />

      <main className="pt-32 pb-20 relative z-10 mx-auto max-w-3xl px-6 md:px-12">
        {/* Header */}
        <div className="mb-12 border-b border-border/50 pb-8">
          <p className="text-xs tracking-[0.2em] font-medium uppercase mb-4 text-primary">
            SkinStrategyLab
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light mb-6">
            {language === 'ko' ? '청약철회 안내' : language === 'de' ? 'Widerrufsbelehrung' : 'Right of Withdrawal'}
          </h1>
          <p className="text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
            {language === 'ko'
              ? '유럽 연합 및 독일 법률(BGB)에 따른 소비자 청약철회 권리 안내입니다.'
              : language === 'de'
                ? 'Verbraucher-Widerrufsrecht nach dem Bürgerlichen Gesetzbuch (BGB).'
                : 'Consumer right of withdrawal under EU and German law (BGB).'}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {language === 'ko' ? '청약철회권 (Widerrufsrecht)' : language === 'de' ? 'Widerrufsrecht' : 'Right of Withdrawal'}
            </h2>
            <p className="mb-4">
              {language === 'ko'
                ? "고객님은 사유를 불문하고 14일 이내에 본 계약을 철회할 권리가 있습니다. 청약철회 기한은 고객님 또는 고객님이 지정한 제3자(운송인 제외)가 상품을 수령한 날로부터 14일입니다."
                : language === 'de'
                  ? "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat."
                  : "You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period will expire after 14 days from the day on which you acquire, or a third party other than the carrier and indicated by you acquires, physical possession of the goods."}
            </p>
            <p>
              {language === 'ko'
                ? "청약철회권을 행사하려면 당사(SkinStrategyLab, Kurfürstenstraße 14 60486 Frankfurt am Main, 이메일: info@skinstrategylab.com)에 명확한 의사표시(예: 하단 양식을 이용한 이메일)를 해야 합니다."
                : language === 'de'
                  ? "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (SkinStrategyLab, Kurfürstenstraße 14 60486 Frankfurt am Main, E-Mail: info@skinstrategylab.com) mittels einer eindeutigen Erklärung über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist."
                  : "To exercise the right of withdrawal, you must inform us (SkinStrategyLab, Kurfürstenstraße 14 60486 Frankfurt am Main, Email: info@skinstrategylab.com) of your decision to withdraw from this contract by an unequivocal statement (e.g. an e-mail)."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {language === 'ko' ? '청약철회의 효과' : language === 'de' ? 'Folgen des Widerrufs' : 'Effects of Withdrawal'}
            </h2>
            <p className="mb-4">
              {language === 'ko'
                ? "당사는 귀하로부터 수령한 모든 결제 대금(표준 배송비를 초과하는 추가 배송비 제외)을 계약 철회 통지를 받은 날로부터 14일 이내에 환불합니다. 훼손된 제품(특히 개봉된 화장품)은 위생 및 건강 보호를 이유로 반품이 불가할 수 있습니다."
                : language === 'de'
                  ? "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Kosmetikprodukte, deren Versiegelung nach der Lieferung entfernt wurde, sind aus Gründen des Gesundheitsschutzes oder der Hygiene von der Rückgabe ausgeschlossen."
                  : "If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery, without undue delay and in any event not later than 14 days from the day on which we are informed about your decision to withdraw from this contract. Cosmetic products that have been unsealed after delivery are exempt from return for reasons of health protection or hygiene."}
            </p>
          </section>

          <section className="mt-12 p-6 md:p-8 rounded-2xl bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {language === 'ko' ? '청약철회 양식 (Muster-Widerrufsformular)' : language === 'de' ? 'Muster-Widerrufsformular' : 'Standard Withdrawal Form'}
            </h2>
            <p className="text-sm mb-6 text-foreground/70">
              {language === 'ko'
                ? "본 양식을 복사하여 이메일로 보내주시면 됩니다."
                : language === 'de'
                  ? "Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück."
                  : "Complete and return this form only if you wish to withdraw from the contract."}
            </p>

            <div className="font-mono text-xs md:text-sm p-4 bg-background border border-border rounded-lg text-foreground/80 overflow-x-auto whitespace-pre">
              {language === 'de' ? (
                `An:
SkinStrategyLab GmbH
123 Musterstraße
60486 Frankfurt am Main
E-Mail: info@skinstrategylab.com

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*):

______________________________________________
______________________________________________

Bestellt am (*) / erhalten am (*): _________________

Name des/der Verbraucher(s): ____________________

Anschrift des/der Verbraucher(s):
______________________________________________
______________________________________________

Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):

_________________________

Datum: _________________

(*) Unzutreffendes streichen.`
              ) : language === 'ko' ? (
                `수신:
SkinStrategyLab GmbH
123 Musterstraße
60486 Frankfurt am Main
이메일: info@skinstrategylab.com

본인/당사(*)는 다음 상품의 구매(*)/서비스 제공(*)에 대한 계약을 철회합니다:

______________________________________________
______________________________________________

주문일(*)/수령일(*): _________________

소비자 성명: ____________________

소비자 주소:
______________________________________________
______________________________________________

소비자 서명 (종이 문서인 경우):

_________________________

일자: _________________

(*) 해당하지 않는 내용 삭제`
              ) : (
                `To:
SkinStrategyLab GmbH
123 Musterstraße
60486 Frankfurt am Main
Email: info@skinstrategylab.com

I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*) / for the provision of the following service (*):

______________________________________________
______________________________________________

Ordered on (*) / received on (*): _________________

Name of consumer(s): ____________________

Address of consumer(s):
______________________________________________
______________________________________________

Signature of consumer(s) (only if this form is notified on paper):

_________________________

Date: _________________

(*) Delete as appropriate.`
              )}
            </div>
          </section>

          <p className="text-sm text-center pt-8 border-t border-border/50">
            <Link to="/agb" className="text-primary hover:underline hover:text-primary/80 transition-colors">
              {language === 'ko' ? '전체 약관(AGB) 보기' : language === 'de' ? 'Zurück zu den AGB' : 'Back to Terms & Conditions (AGB)'}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
