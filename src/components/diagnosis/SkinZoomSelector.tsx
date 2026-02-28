import { motion } from "framer-motion";
import LabCard from "./LabCard";

interface SkinPatch {
  id: string;
  label: string;
  description: string;
  pattern: string;
  severity: number;
}

const PATCHES: SkinPatch[] = [
  { id: "smooth", label: "Smooth", description: "Even surface, minimal pores", pattern: "smooth", severity: 0 },
  { id: "visible_pores", label: "Visible Pores", description: "Open, visible pore structure", pattern: "pores", severity: 1 },
  { id: "oxidised", label: "Oxidised Pores", description: "Dark, congested pores", pattern: "oxidised", severity: 2 },
  { id: "rough", label: "Rough Texture", description: "Bumpy, uneven surface", pattern: "rough", severity: 3 },
];

interface SkinZoomSelectorProps {
  selected: string | null;
  onSelect: (patchId: string, severity: number) => void;
}

const renderPatchSVG = (pattern: string, isSelected: boolean) => {
  const baseColor = isSelected ? "hsl(var(--primary) / 0.15)" : "hsl(var(--secondary))";

  return (
    <svg viewBox="0 0 80 80" className="w-full h-full rounded-lg">
      <rect width="80" height="80" fill={baseColor} />
      {pattern === "smooth" && (
        <g><circle cx="40" cy="40" r="1" fill="hsl(var(--muted-foreground) / 0.1)" /></g>
      )}
      {pattern === "pores" && (
        <g>
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={15 + (i % 5) * 14 + Math.sin(i) * 3} cy={15 + Math.floor(i / 5) * 14 + Math.cos(i) * 3} r={1.5 + Math.random()} fill="hsl(var(--muted-foreground) / 0.25)" />
          ))}
        </g>
      )}
      {pattern === "oxidised" && (
        <g>
          {Array.from({ length: 25 }, (_, i) => (
            <circle key={i} cx={10 + (i % 5) * 15 + Math.sin(i) * 2} cy={10 + Math.floor(i / 5) * 14 + Math.cos(i) * 2} r={1.8 + Math.random() * 0.5} fill="hsl(var(--muted-foreground) / 0.45)" />
          ))}
        </g>
      )}
      {pattern === "rough" && (
        <g>
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={8 + (i % 6) * 12 + Math.sin(i * 2) * 4} cy={8 + Math.floor(i / 6) * 14 + Math.cos(i * 2) * 4} r={2 + Math.random() * 1.5} fill="hsl(var(--muted-foreground) / 0.3)" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="0.5" />
          ))}
        </g>
      )}
    </svg>
  );
};

const SkinZoomSelector = ({ selected, onSelect }: SkinZoomSelectorProps) => (
  <LabCard>
    <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
      Skin Surface Analysis
    </p>
    <p className="mb-5 text-sm text-foreground">
      Which texture patch looks closest to your skin?
    </p>

    <div className="grid grid-cols-2 gap-3">
      {PATCHES.map((patch, i) => (
        <motion.button
          key={patch.id}
          onClick={() => onSelect(patch.id, patch.severity)}
          className={`flex flex-col gap-2 rounded-xl border overflow-hidden transition-all min-h-[100px] select-none touch-manipulation ${
            selected === patch.id
              ? "border-primary shadow-[0_0_20px_-8px_hsl(var(--primary)/0.3)]"
              : "border-border hover:border-primary/40 active:border-primary/60"
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          whileTap={{ scale: 0.95 }}
          whileHover={{
            boxShadow: selected === patch.id
              ? "0 0 24px -6px hsla(192, 100%, 50%, 0.2)"
              : "0 4px 16px -6px hsla(0, 0%, 0%, 0.3)",
          }}
        >
          <div className="h-20 w-full">
            {renderPatchSVG(patch.pattern, selected === patch.id)}
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

export default SkinZoomSelector;
