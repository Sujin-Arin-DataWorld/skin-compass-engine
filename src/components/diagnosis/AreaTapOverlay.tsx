import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LabCard from "./LabCard";
import FaceBase from "./FaceBase";

interface TapZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** A marker placed on a zone with an associated pattern type (e.g. PIH, Melasma). */
export interface ZoneMarker {
  zone: string;
  type: string;
}

/** Color theme per marker type — fill and stroke. */
export interface MarkerTypeStyle {
  fill: string;
  fillGlow: string;
  stroke: string;
  label: string;
}

interface AreaTapOverlayProps {
  title: string;
  subtitle?: string;
  zones: TapZone[];
  selected: string[];
  onToggle: (zoneId: string) => void;
  darken?: boolean;
  /** If provided, shows typed markers with distinct colors per type. */
  markers?: ZoneMarker[];
  /** Color palette per marker type. */
  markerStyles?: Record<string, MarkerTypeStyle>;
}

/** Default (untyped) colors when no markerStyles provided. */
const DEFAULT_FILL = "hsla(30, 55%, 48%, 0.18)";
const DEFAULT_FILL_GLOW = "hsla(30, 55%, 48%, 0.12)";
const DEFAULT_STROKE = "hsl(var(--accent))";

const AreaTapOverlay = forwardRef<HTMLDivElement, AreaTapOverlayProps>(
  ({ title, subtitle, zones, selected, onToggle, darken = false, markers, markerStyles }, ref) => {
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);

    // Resolve color for a zone: check typed markers first, then fall back to default
    const getZoneStyle = (zoneId: string) => {
      if (markers && markerStyles) {
        // Find all marker types for this zone
        const zoneMarkers = markers.filter(m => m.zone === zoneId);
        if (zoneMarkers.length > 0) {
          // Use first marker type's style (primary), but later we show all chips
          const style = markerStyles[zoneMarkers[0].type];
          if (style) return style;
        }
      }
      return {
        fill: darken ? "hsla(30, 40%, 25%, 0.35)" : DEFAULT_FILL,
        fillGlow: darken ? "hsla(30, 40%, 25%, 0.2)" : DEFAULT_FILL_GLOW,
        stroke: DEFAULT_STROKE,
        label: "",
      };
    };

    // Get tooltip text with marker types
    const getTooltipText = (zoneId: string) => {
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return "";
      let text = zone.label;
      if (markers) {
        const types = markers.filter(m => m.zone === zoneId).map(m => {
          const style = markerStyles?.[m.type];
          return style?.label || m.type;
        });
        if (types.length > 0) text += ` · ${types.join(", ")}`;
      } else if (selected.includes(zoneId)) {
        text += " ✓";
      }
      return text;
    };

    return (
      <LabCard ref={ref}>
        <p className="section-header">
          {title}
        </p>
        {subtitle && <p className="mb-4 text-sm text-foreground/60">{subtitle}</p>}

        <div className="relative flex justify-center">
          <FaceBase viewBox="30 15 140 160" className="w-full max-w-[260px] h-auto touch-manipulation">
            {/* Tappable zones */}
            {zones.map((zone) => {
              const isSelected = selected.includes(zone.id);
              const hitRx = Math.max(zone.rx, 18);
              const hitRy = Math.max(zone.ry, 14);
              const style = getZoneStyle(zone.id);

              // Check if this zone has multiple marker types
              const zoneMarkerTypes = markers
                ? markers.filter(m => m.zone === zone.id)
                : [];
              const hasMultiple = zoneMarkerTypes.length > 1;

              return (
                <g key={zone.id}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.ellipse
                        cx={zone.cx}
                        cy={zone.cy}
                        rx={zone.rx + 4}
                        ry={zone.ry + 4}
                        fill={style.fillGlow}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0.2, 0.4, 0.2], scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ opacity: { duration: 2, repeat: Infinity }, scale: { duration: 0.3 } }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Invisible enlarged hit area */}
                  <ellipse
                    cx={zone.cx}
                    cy={zone.cy}
                    rx={hitRx}
                    ry={hitRy}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => onToggle(zone.id)}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />

                  {/* Visible zone */}
                  <motion.ellipse
                    cx={zone.cx}
                    cy={zone.cy}
                    rx={zone.rx}
                    ry={zone.ry}
                    fill={isSelected ? style.fill : "transparent"}
                    stroke={isSelected ? style.stroke : "hsl(var(--border) / 0.5)"}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeDasharray={isSelected ? "none" : "3 3"}
                    className="pointer-events-none"
                    animate={isSelected ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Second marker ring for overlapping types */}
                  {hasMultiple && isSelected && markerStyles && (
                    <motion.ellipse
                      cx={zone.cx}
                      cy={zone.cy}
                      rx={zone.rx + 2}
                      ry={zone.ry + 2}
                      fill="none"
                      stroke={markerStyles[zoneMarkerTypes[1]?.type]?.stroke ?? "hsl(var(--accent))"}
                      strokeWidth={1.2}
                      strokeDasharray="4 2"
                      className="pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                    />
                  )}

                  {/* Interactive dot — colored by type */}
                  <motion.circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={isSelected ? 4 : 3}
                    fill={isSelected ? style.stroke : "hsl(var(--foreground) / 0.3)"}
                    className="pointer-events-none"
                    animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6, repeat: isSelected ? Infinity : 0, repeatDelay: 1 }}
                  />
                </g>
              );
            })}
          </FaceBase>

          {/* Tooltip on hover */}
          <AnimatePresence>
            {hoveredZone && (
              <motion.div
                className="absolute top-0 right-0 rounded-md bg-card border border-border px-2.5 py-1 text-xs text-foreground shadow-md"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                {getTooltipText(hoveredZone)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected chips — show marker type labels if available */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {markers && markerStyles
            ? // Typed markers: show per (zone, type) pair
            markers.map(({ zone, type }) => {
              const z = zones.find(zn => zn.id === zone);
              const s = markerStyles[type];
              return (
                <motion.span
                  key={`${zone}-${type}`}
                  className="rounded-full px-3 py-1.5 text-xs font-medium min-h-[32px] flex items-center"
                  style={{
                    background: s ? s.fill : "hsl(var(--accent) / 0.2)",
                    border: `1px solid ${s?.stroke ?? "hsl(var(--accent) / 0.4)"}`,
                    color: s?.stroke ?? "hsl(var(--foreground))",
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {z?.label} · {s?.label ?? type}
                </motion.span>
              );
            })
            : // Default: simple zone chips
            selected.map((id) => {
              const zone = zones.find(z => z.id === id);
              return (
                <motion.span
                  key={id}
                  className="rounded-full bg-accent/20 px-3 py-1.5 text-xs text-foreground font-medium border border-accent/40 min-h-[32px] flex items-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {zone?.label}
                </motion.span>
              );
            })
          }
        </div>
      </LabCard>
    );
  });

AreaTapOverlay.displayName = "AreaTapOverlay";

export default AreaTapOverlay;
