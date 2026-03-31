import { Sparkles } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

export default function AiGeneratedBadge() {
  const { language } = useI18nStore();
  const text = language === 'de' ? 'KI-Generiert' : language === 'ko' ? 'AI 생성됨' : 'AI-Generated';

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-4 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm w-fit">
      <Sparkles className="w-3 h-3 text-primary" />
      <span className="text-[9px] uppercase tracking-[0.15em] text-primary font-bold">
        {text}
      </span>
    </div>
  );
}
