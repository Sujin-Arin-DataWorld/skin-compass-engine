import { ShieldAlert } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

const DISCLAIMER_COPY = {
  de: "Diese KI-gestützte Analyse dient ausschließlich kosmetischen Zwecken und stellt keine medizinische Diagnose oder Behandlung dar (Kein Medizinprodukt). Bei Hauterkrankungen konsultieren Sie bitte einen Dermatologen.",
  en: "This AI-powered analysis is for cosmetic and wellness purposes only and does not constitute a medical diagnosis or treatment. For skin conditions, please consult a dermatologist.",
  ko: "본 AI 분석은 미용 및 웰니스 목적으로만 제공되며, 의학적 진단이나 치료를 대체하지 않습니다 (의료기기 아님). 피부 질환이 있는 경우 피부과 전문의와 상담하십시오."
};

export default function MedicalDisclaimer() {
  const { language } = useI18nStore();
  const lang = (language === 'de' || language === 'ko') ? language : 'en';

  return (
    <div className="w-full mt-8 p-4 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-start gap-3 backdrop-blur-md">
      <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-80" />
      <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wide">
        {DISCLAIMER_COPY[lang]}
      </p>
    </div>
  );
}
