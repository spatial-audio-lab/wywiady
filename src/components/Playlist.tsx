// src/components/Playlist.tsx

import type { TrackItem, Interview } from "../data/interviews"

interface PlaylistProps {
  interview: Interview
  currentTrackIndex: number
  isLoadingTrack: boolean
  isPlaying: boolean
  trackElapsedMs: number
  trackDurationMs: number
  onSkipTo: (index: number) => void
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function Playlist({
  interview,
  currentTrackIndex,
  isLoadingTrack,
  isPlaying,
  trackElapsedMs,
  trackDurationMs,
  onSkipTo,
}: PlaylistProps) {
  const totalDuration = interview.tracks.reduce(
    (sum, t) => sum + t.durationMs,
    0,
  )

  const progress =
    trackDurationMs > 0
      ? Math.min(1, Math.max(0, trackElapsedMs / trackDurationMs))
      : 0

  const remaining =
    trackDurationMs > 0 ? Math.max(0, trackDurationMs - trackElapsedMs) : 0

  return (
    <div className="h-full flex flex-col bg-[#0a0a18]/90 backdrop-blur-xl">
      {/* ══ HEADER ══ */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl leading-none">{interview.icon}</span>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              {interview.title}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {interview.location} · {interview.date}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 bg-red-500/10 rounded-xl px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-red-300 block leading-tight">
                A: {interview.speakerA.name}
              </span>
              <span className="text-[11px] text-red-300/40 leading-tight">
                {interview.speakerA.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-teal-500/10 rounded-xl px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-teal-300 block leading-tight">
                B: {interview.speakerB.name}
              </span>
              <span className="text-[11px] text-teal-300/40 leading-tight">
                {interview.speakerB.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-white/3 rounded-xl px-3 py-2.5">
          <span className="text-sm mt-0.5 shrink-0">🌐</span>
          <div>
            <span className="text-[11px] font-semibold text-purple-400 block leading-tight mb-0.5">
              FOA Ambient
            </span>
            <span className="text-xs text-white/35 italic leading-snug">
              {interview.ambientDescription}
            </span>
          </div>
        </div>
      </div>

      {/* ══ AKTYWNY TRACK — progress + timing ══ */}
      <div className="px-5 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-widest text-white/20 font-semibold">
            Track {currentTrackIndex >= 0 ? currentTrackIndex + 1 : 0} /{" "}
            {interview.tracks.length}
          </span>
          <span className="text-[11px] font-mono text-white/20">
            {formatMs(totalDuration)} total
          </span>
        </div>

        {/* Progress całości */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${
                currentTrackIndex >= 0
                  ? ((currentTrackIndex + 1) / interview.tracks.length) * 100
                  : 0
              }%`,
              backgroundColor: interview.color,
              opacity: 0.5,
            }}
          />
        </div>

        {currentTrackIndex >= 0 &&
        currentTrackIndex < interview.tracks.length ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isLoadingTrack ? (
                <span className="w-2 h-2 rounded-full border border-white/30 border-t-white animate-spin shrink-0" />
              ) : (
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-all"
                  style={{
                    backgroundColor:
                      interview.tracks[currentTrackIndex].speaker === "A"
                        ? "#ff6b6b"
                        : "#4ecdc4",
                    boxShadow: isPlaying
                      ? `0 0 6px ${
                          interview.tracks[currentTrackIndex].speaker === "A"
                            ? "#ff6b6b80"
                            : "#4ecdc480"
                        }`
                      : "none",
                  }}
                />
              )}
              <span className="text-sm font-semibold text-white leading-tight">
                {isLoadingTrack
                  ? "Ładowanie…"
                  : interview.tracks[currentTrackIndex].label}
              </span>
            </div>

            {/* Progress bieżącego tracku */}
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: interview.color,
                  boxShadow: isPlaying
                    ? `0 0 8px ${interview.color}60`
                    : "none",
                  transition: progress === 0 ? "none" : "width 0.25s linear",
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/40">
                {formatMs(trackElapsedMs)} / {formatMs(trackDurationMs)}
              </span>
              {trackDurationMs > 0 && (
                <span className="text-xs font-mono text-white/25">
                  −{formatMs(remaining)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-white/20">Gotowy do odtwarzania</p>
        )}
      </div>

      {/* ══ LISTA TRACKÓW ══ */}
      <div className="flex-1 overflow-y-auto">
        {interview.tracks.map((track: TrackItem, index: number) => {
          const isCurrent = index === currentTrackIndex
          const isPast = index < currentTrackIndex
          const isSpeakerA = track.speaker === "A"
          const speakerColor = isSpeakerA ? "#f87171" : "#2dd4bf"
          const speakerBg = isSpeakerA ? "bg-red-500/15" : "bg-teal-500/15"
          const speakerText = isSpeakerA ? "text-red-400" : "text-teal-400"

          return (
            <button
              key={track.id}
              onClick={() => onSkipTo(index)}
              className={`
                w-full flex items-start gap-3 px-5 py-3.5 text-left transition-all duration-200
                border-b border-white/[0.03]
                ${
                  isCurrent
                    ? "bg-white/[0.07]"
                    : isPast
                      ? "opacity-40 hover:opacity-70 hover:bg-white/[0.03]"
                      : "hover:bg-white/[0.04]"
                }
              `}
            >
              {/* Numer / animacja */}
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5
                  ${isCurrent ? speakerBg : "bg-white/5"}
                `}
              >
                {isCurrent ? (
                  <span className="flex gap-[3px] items-end h-4">
                    <span
                      className="w-[3px] rounded-full animate-pulse"
                      style={{
                        backgroundColor: speakerColor,
                        height: "10px",
                        animationDelay: "0ms",
                        animationDuration: "0.8s",
                      }}
                    />
                    <span
                      className="w-[3px] rounded-full animate-pulse"
                      style={{
                        backgroundColor: speakerColor,
                        height: "14px",
                        animationDelay: "200ms",
                        animationDuration: "0.8s",
                      }}
                    />
                    <span
                      className="w-[3px] rounded-full animate-pulse"
                      style={{
                        backgroundColor: speakerColor,
                        height: "8px",
                        animationDelay: "400ms",
                        animationDuration: "0.8s",
                      }}
                    />
                  </span>
                ) : (
                  <span className="text-xs text-white/25">
                    {track.order.toString().padStart(2, "0")}
                  </span>
                )}
              </div>

              {/* Odznaka mówcy */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-1
                  ${speakerBg} ${speakerText}
                `}
              >
                {track.speaker}
              </div>

              {/* Treść */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm leading-tight mb-1 ${
                    isCurrent ? "text-white font-semibold" : "text-white/55"
                  }`}
                >
                  {track.label}
                </div>
                <div className="text-[11px] text-white/20 font-mono truncate">
                  {track.filename}
                </div>
              </div>

              {/* Czas trwania */}
              <div
                className={`text-xs font-mono shrink-0 mt-1 ${
                  isCurrent ? "text-white/60" : "text-white/20"
                }`}
              >
                {formatMs(track.durationMs)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
