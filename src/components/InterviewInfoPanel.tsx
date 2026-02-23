// src/components/InterviewInfoPanel.tsx
// Zastępuje stary inline overlay w App.tsx (absolute top-4 left-4)
// Nowe funkcje: progress bar, segment N/total, elapsed/total time

import type { Interview } from "../data/interviews"

interface InterviewInfoPanelProps {
  interview: Interview
  currentTrackIndex: number
  isLoadingTrack: boolean
  isPlaying: boolean
  trackElapsedMs: number
  trackDurationMs: number
  accentColor: string
}

/** Formatuje ms → "m:ss", np. 83500 → "1:23" */
function fmtTime(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "0:00"
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function InterviewInfoPanel({
  interview,
  currentTrackIndex,
  isLoadingTrack,
  isPlaying,
  trackElapsedMs,
  trackDurationMs,
  accentColor,
}: InterviewInfoPanelProps) {
  const totalTracks = interview.tracks.length
  const hasTrack = currentTrackIndex >= 0 && currentTrackIndex < totalTracks
  const track = hasTrack ? interview.tracks[currentTrackIndex] : null

  // Progress 0–1, zabezpieczenie przed NaN i dzieleniem przez 0
  const progress =
    trackDurationMs > 0
      ? Math.min(1, Math.max(0, trackElapsedMs / trackDurationMs))
      : 0

  const elapsed = fmtTime(trackElapsedMs)
  const total = fmtTime(trackDurationMs)
  const remaining = fmtTime(Math.max(0, trackDurationMs - trackElapsedMs))

  // Kolor aktywnego mówcy
  const speakerDotColor = track?.speaker === "A" ? "#ff6b6b" : "#4ecdc4"

  return (
    <div
      className="absolute top-4 left-4 pointer-events-none z-10"
      style={{ maxWidth: "280px" }}
    >
      <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/8 overflow-hidden">
        {/* ── Nagłówek wywiadu ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base leading-none">{interview.icon}</span>
            <h2 className="text-[13px] font-bold text-white leading-tight truncate">
              {interview.title}
            </h2>
          </div>
          <p className="text-[10px] text-white/30 leading-tight truncate">
            {interview.subtitle} · {interview.location}
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="mx-4 h-px bg-white/6" />

        {/* ── Aktywny segment ── */}
        <div className="px-4 py-2.5">
          {isLoadingTrack ? (
            /* skeleton przy ładowaniu */
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-white/30 border-t-white animate-spin shrink-0" />
              <span className="text-[11px] text-white/40 animate-pulse">
                Ładowanie…
              </span>
            </div>
          ) : hasTrack && track ? (
            <div>
              {/* Tytuł segmentu z kropką aktywności */}
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full mt-0.5 shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: isPlaying ? speakerDotColor : "rgba(255,255,255,0.2)",
                    boxShadow: isPlaying ? `0 0 6px ${speakerDotColor}80` : "none",
                    animation: isPlaying ? "pulse 2s ease-in-out infinite" : "none",
                  }}
                />
                <span className="text-[11px] text-white/75 leading-tight line-clamp-2">
                  {track.label}
                </span>
              </div>

              {/* Segment N / Total */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-white/30 uppercase tracking-wider">
                  Segment {currentTrackIndex + 1} / {totalTracks}
                </span>
                <span
                  className="text-[9px] font-mono"
                  style={{ color: `${accentColor}bb` }}
                >
                  {track.speaker === "A"
                    ? interview.speakerA.name
                    : interview.speakerB.name}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-[3px] bg-white/8 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-250"
                  style={{
                    width: `${progress * 100}%`,
                    backgroundColor: accentColor,
                    boxShadow: isPlaying ? `0 0 6px ${accentColor}60` : "none",
                    // brak transition przy dużych skokach (np. skip)
                    transition: progress === 0 ? "none" : "width 0.25s linear",
                  }}
                />
              </div>

              {/* Czas: upłynął / total i pozostały */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/25">
                  {elapsed} / {total}
                </span>
                {trackDurationMs > 0 && (
                  <span className="text-[9px] font-mono text-white/20">
                    −{remaining}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Stan przed play */
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/20">
                {totalTracks} segmentów · gotowy do odtwarzania
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
