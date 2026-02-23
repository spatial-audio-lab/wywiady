// src/components/TransportControls.tsx
// Zmiany: inline label z wartością % przy suwaках (Wariant B)

import { useState } from "react"

interface TransportControlsProps {
  isPlaying: boolean
  hasInterview: boolean
  ambientLevel: number
  dialogLevel: number
  accentColor: string
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSkipPrev: () => void
  onSkipNext: () => void
  onAmbientLevelChange: (v: number) => void
  onDialogLevelChange: (v: number) => void
}

function SliderRow({
  label,
  icon,
  value,
  onChange,
  accentColor,
}: {
  label: string
  icon: string
  value: number
  onChange: (v: number) => void
  accentColor: string
}) {
  const [active, setActive] = useState(false)
  const pct = Math.round(value * 100)

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      {/* Ikona */}
      <span className="text-[13px] opacity-50">{icon}</span>

      {/* Label + wartość */}
      <div className="flex items-baseline gap-1.5 w-[72px] shrink-0">
        <span className="text-[10px] text-white/40 uppercase tracking-wide leading-none">
          {label}
        </span>
        <span
          className="text-[11px] font-mono font-semibold leading-none transition-all duration-150"
          style={{
            color: active ? accentColor : "rgba(255,255,255,0.25)",
            // lekkie powiększenie gdy aktywny (drag lub hover)
            fontSize: active ? "12px" : "11px",
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Slider */}
      <div className="relative flex-1">
        {/* Track fill */}
        <div
          className="absolute top-1/2 left-0 h-[2px] rounded-full -translate-y-1/2 pointer-events-none transition-all duration-75"
          style={{
            width: `${pct}%`,
            backgroundColor: active ? accentColor : "rgba(255,255,255,0.2)",
          }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          onMouseLeave={() => setActive(false)}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          className="relative w-full h-1 rounded-full appearance-none cursor-pointer bg-white/8 focus:outline-none"
          style={
            {
              "--thumb-color": accentColor,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  )
}

export function TransportControls({
  isPlaying,
  hasInterview,
  ambientLevel,
  dialogLevel,
  accentColor,
  onPlay,
  onPause,
  onStop,
  onSkipPrev,
  onSkipNext,
  onAmbientLevelChange,
  onDialogLevelChange,
}: TransportControlsProps) {
  return (
    <div className="bg-[#0d0d1a] border-t border-white/5 px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Transport buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1" />
            </svg>
          </button>

          <button
            onClick={onSkipPrev}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Previous"
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
              <rect x="1" y="1" width="2" height="12" rx="0.5" />
              <path d="M14 1L6 7L14 13V1Z" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasInterview}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-20"
            style={{
              backgroundColor: hasInterview ? accentColor : "#333",
              boxShadow: hasInterview ? `0 4px 20px ${accentColor}40` : "none",
            }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <rect x="3" y="2" width="4" height="14" rx="1" />
                <rect x="11" y="2" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
              >
                <path d="M4 2L16 9L4 16V2Z" />
              </svg>
            )}
          </button>

          <button
            onClick={onSkipNext}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Next"
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
              <rect x="13" y="1" width="2" height="12" rx="0.5" />
              <path d="M2 1L10 7L2 13V1Z" />
            </svg>
          </button>
        </div>

        {/* ── Gain sliders ── */}
        <div className="flex items-center gap-6">
          <SliderRow
            label="Ambient"
            icon="🌿"
            value={ambientLevel}
            onChange={onAmbientLevelChange}
            accentColor={accentColor}
          />
          <SliderRow
            label="Dialog"
            icon="🎙️"
            value={dialogLevel}
            onChange={onDialogLevelChange}
            accentColor={accentColor}
          />
        </div>

        {/* Spacer / right slot (opcjonalnie skróty) */}
        <div className="w-24 hidden lg:block" />
      </div>

      {/* Tailwind custom thumb styles — wstrzyknięte inline żeby działały bez compilera */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: var(--thumb-color, #fff);
          cursor: pointer;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.4);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        input[type=range]::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: var(--thumb-color, #fff);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.4);
        }
        input[type=range] {
          background: transparent;
        }
        input[type=range]::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
        }
        input[type=range]::-moz-range-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
        }
      `}</style>
    </div>
  )
}
