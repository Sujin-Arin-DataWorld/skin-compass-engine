import { motion } from "framer-motion";
import LabCard from "./LabCard";
import { useI18nStore, translations } from "@/store/i18nStore";

interface SkinPatch {
  id: string;
  label: string;
  description: string;
  pattern: string;
  severity: number;
}

interface SkinZoomSelectorProps {
  selected: string | null;
  onSelect: (patchId: string, severity: number) => void;
}

/** Skin-brown base for all patches; pore dots use darker brown tones. */
const SKIN_BG = "hsla(25, 40%, 68%, 0.40)";
const SKIN_BG_DARK = "hsla(25, 30%, 50%, 0.25)";

const renderPatchSVG = (pattern: string) => {
  const poreColor = "hsla(20, 35%, 38%, 0.45)";
  const poreColorDark = "hsla(20, 30%, 32%, 0.60)";

  return (
    <svg viewBox="0 0 80 80" className="w-full h-full rounded-lg">
      <rect width="80" height="80" fill={SKIN_BG} className="dark:fill-[hsla(25,30%,50%,0.25)]" />
      {pattern === "smooth" && (
        <g><circle cx="40" cy="40" r="1" fill={poreColor} opacity="0.3" /></g>
      )}
      {pattern === "pores" && (
        <g>
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={15 + (i % 5) * 14 + Math.sin(i) * 3} cy={15 + Math.floor(i / 5) * 14 + Math.cos(i) * 3} r={1.5 + Math.random()} fill={poreColor} />
          ))}
        </g>
      )}
      {pattern === "oxidised" && (
        <g>
          {Array.from({ length: 25 }, (_, i) => (
            <circle key={i} cx={10 + (i % 5) * 15 + Math.sin(i) * 2} cy={10 + Math.floor(i / 5) * 14 + Math.cos(i) * 2} r={1.8 + Math.random() * 0.5} fill={poreColorDark} />
          ))}
        </g>
      )}
      {pattern === "rough" && (
        <g>
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={8 + (i % 6) * 12 + Math.sin(i * 2) * 4} cy={8 + Math.floor(i / 6) * 14 + Math.cos(i * 2) * 4} r={2 + Math.random() * 1.5} fill={poreColorDark} stroke="hsla(20, 30%, 28%, 0.2)" strokeWidth="0.5" />
          ))}
        </g>
      )}
    </svg>
  );
};

const SkinZoomSelector = ({ selected, onSelect }: SkinZoomSelectorProps) => {
  const { language } = useI18nStore();
  const t = language === "de" ? translations.de : translations.en;

  const PATCHES: SkinPatch[] = [
    { id: "smooth", label: t.analysis.ui.textureSmooth, description: t.analysis.ui.textureSmoothDesc, pattern: "smooth", severity: 0 },
    { id: "visible_pores", label: t.analysis.ui.texturePores, description: t.analysis.ui.texturePoresDesc, pattern: "pores", severity: 1 },
    { id: "oxidised", label: t.analysis.ui.textureOxidised, description: t.analysis.ui.textureOxidisedDesc, pattern: "oxidised", severity: 2 },
    { id: "rough", label: t.analysis.ui.textureRough, description: t.analysis.ui.textureRoughDesc, pattern: "rough", severity: 3 },
  ];

  return (
    <LabCard>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t.analysis.ui.skinSurfaceAnalysis}
      </p>
      <p className="mb-5 text-sm text-foreground">
        {t.analysis.ui.whichTexture}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {PATCHES.map((patch, i) => (
          <motion.button
            key={patch.id}
            onClick={() => onSelect(patch.id, patch.severity)}
            className={`flex flex-col gap-2 rounded-xl overflow-hidden transition-all min-h-[100px] select-none touch-manipulation ${selected === patch.id
              ? "ring-0 shadow-[0_0_16px_-4px_hsla(45,95%,55%,0.4)]"
              : "hover:shadow-md active:shadow-lg"
              }`}
            style={{
              border: selected === patch.id
                ? "3px solid hsl(45, 95%, 55%)"
                : "1px solid hsl(var(--border))",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-20 w-full">
              {renderPatchSVG(patch.pattern)}
            </div>
            <div className="px-3 pb-3">
              <span className="text-xs font-medium text-foreground">{patch.label}</span>
              <span className="block text-[10px] text-muted-foreground">{patch.description}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </LabCard>
  );
};

export default SkinZoomSelector;
