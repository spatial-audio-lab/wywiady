import { useState, useRef, useCallback, useEffect } from "react"
import { Sidebar } from "./components/Sidebar"
import { Playlist } from "./components/Playlist"
import { MapView } from "./components/MapView"
import { TransportControls } from "./components/TransportControls"
import { AudioEngine } from "./audio/AudioEngine"
import { type Interview, interviews } from "./data/interviews"

export function App() {
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const [listenerX, setListenerX] = useState(0)
  const [listenerZ, setListenerZ] = useState(4)
  const [listenerAngle, setListenerAngle] = useState(0)
  const [ambientLevel, setAmbientLevel] = useState(0.25)
  const [dialogLevel, setDialogLevel] = useState(0.7)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [trackElapsedMs, setTrackElapsedMs] = useState(0)
  const [trackDurationMs, setTrackDurationMs] = useState(0)

  const engineRef = useRef<AudioEngine | null>(null)

  useEffect(() => {
    const engine = new AudioEngine((state) => {
      if (state.isPlaying !== undefined) setIsPlaying(state.isPlaying)
      if (state.currentTrackIndex !== undefined)
        setCurrentTrackIndex(state.currentTrackIndex)
      if (state.isLoadingTrack !== undefined)
        setIsLoadingTrack(state.isLoadingTrack)
      if (state.listenerX !== undefined) setListenerX(state.listenerX)
      if (state.listenerZ !== undefined) setListenerZ(state.listenerZ)
      if (state.listenerAngle !== undefined)
        setListenerAngle(state.listenerAngle)
      if (state.ambientLevel !== undefined) setAmbientLevel(state.ambientLevel)
      if (state.dialogLevel !== undefined) setDialogLevel(state.dialogLevel)
      if (state.trackElapsedMs !== undefined)
        setTrackElapsedMs(state.trackElapsedMs)
      if (state.trackDurationMs !== undefined)
        setTrackDurationMs(state.trackDurationMs)
    })
    engineRef.current = engine
    return () => {
      engine.destroy()
    }
  }, [])

  const handleStartAudio = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.init()
      setAudioReady(true)
      setShowWelcome(false)
    }
  }, [])

  const handleSelectInterview = useCallback(
    async (interview: Interview) => {
      if (!audioReady) await handleStartAudio()
      setSelectedInterview(interview)

      const start = interview.listenerStart ?? { x: 0, z: 4 }
      setListenerX(start.x)
      setListenerZ(start.z)
      setListenerAngle(0)

      if (engineRef.current) {
        engineRef.current.setSpeakerPositions(
          { x: interview.speakerAPos.x, y: 0, z: interview.speakerAPos.z },
          { x: interview.speakerBPos.x, y: 0, z: interview.speakerBPos.z },
        )
        engineRef.current.updateListenerPosition(start.x, start.z, 0)

        const tracks = interview.tracks.map((t) => ({
          speaker: t.speaker,
          durationMs: t.durationMs,
          label: t.label,
          filename: t.filename,
          binaural: t.binaural,
        }))
        const idx = interviews.findIndex((i) => i.id === interview.id)

        await engineRef.current.loadInterview(
          interview.id,
          tracks,
          idx,
          interview.ambientFile,
          interview.binaural ?? false,
        )
      }
    },
    [audioReady, handleStartAudio],
  )

  const handlePlay = useCallback(() => {
    engineRef.current?.play()
  }, [])
  const handlePause = useCallback(() => {
    engineRef.current?.pause()
  }, [])
  const handleStop = useCallback(() => {
    engineRef.current?.stop()
  }, [])
  const handleSkipPrev = useCallback(() => {
    engineRef.current?.skipPrev()
  }, [])
  const handleSkipNext = useCallback(() => {
    engineRef.current?.skipNext()
  }, [])
  const handleSkipTo = useCallback((i: number) => {
    engineRef.current?.skipTo(i)
  }, [])
  const handleListenerMove = useCallback((x: number, z: number, a: number) => {
    engineRef.current?.updateListenerPosition(x, z, a)
  }, [])
  const handleAmbientLevel = useCallback((v: number) => {
    engineRef.current?.setAmbientLevel(v)
  }, [])
  const handleDialogLevel = useCallback((v: number) => {
    engineRef.current?.setDialogLevel(v)
  }, [])

  const accentColor = selectedInterview?.color ?? "#6366f1"

  const activeSpeaker =
    selectedInterview &&
    currentTrackIndex >= 0 &&
    currentTrackIndex < selectedInterview.tracks.length
      ? selectedInterview.tracks[currentTrackIndex].speaker
      : null

  return (
    <div className="h-screen w-screen flex flex-col bg-[#060610] text-white overflow-hidden">
      {/* ═══════ Welcome overlay ═══════ */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 bg-[#060610] flex items-center justify-center">
          <div className="text-center max-w-lg px-8">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping"
                style={{ animationDuration: "3s" }}
              />
              <div
                className="absolute inset-2 rounded-full border border-indigo-500/30 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
              <div
                className="absolute inset-4 rounded-full border border-indigo-500/40 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl">🎧</span>
              </div>
            </div>

            <h1 className="font-['Outfit'] text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Spatial Audio Lab - Wywiady
            </h1>
            <p className="text-base text-white/50 mb-3">
              Interaktywne doświadczenie dźwięku przestrzennego
            </p>
            <p className="text-sm text-white/40 mb-6 leading-relaxed max-w-sm mx-auto font-light">
              Zanurz się w 5 wywiadach przestrzennych. Poruszaj się po polu
              dźwiękowym za pomocą klawiatury, myszy lub ekranu dotykowego i
              doświadcz dźwięku przestrzennego w technologii HRTF.
            </p>

            <div className="inline-flex gap-6 mb-8 text-[10px] text-white/25 bg-white/[0.03] rounded-xl px-5 py-3 border border-white/5">
              <div className="text-center">
                <div className="grid grid-cols-3 gap-[2px] mb-1.5">
                  <span />
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-white/10 text-white/50 font-bold text-[9px]">
                    W
                  </kbd>
                  <span />
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-white/10 text-white/50 font-bold text-[9px]">
                    A
                  </kbd>
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-white/10 text-white/50 font-bold text-[9px]">
                    S
                  </kbd>
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-white/10 text-white/50 font-bold text-[9px]">
                    D
                  </kbd>
                </div>
                <span>Move &amp; Strafe</span>
              </div>
              <div className="text-center">
                <div className="flex gap-[2px] mb-1.5 justify-center">
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-amber-500/15 text-amber-300/60 font-bold text-[9px]">
                    Q
                  </kbd>
                  <kbd className="w-6 h-5 flex items-center justify-center rounded bg-amber-500/15 text-amber-300/60 font-bold text-[9px]">
                    E
                  </kbd>
                </div>
                <span>Rotate</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1.5 h-[22px]">
                  <span className="text-[14px]">🖱️</span>
                </div>
                <span>Drag &amp; Scroll</span>
              </div>
            </div>

            <div>
              <button
                onClick={handleStartAudio}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-900/50 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                ▶ Rozpocznij doświadczenie
              </button>
            </div>

            <p className="text-[10px] text-white/10 mt-4">
              · 48 kHz · 32-bit float
            </p>
            <div className="flex justify-center gap-5 mt-6 text-[10px] text-white/15">
              <span>Web Audio API</span>
              <span>·</span>
              <span>HRTF Binaural</span>
              <span>·</span>
              <span>FOA Ambisonics</span>
              <span>·</span>
              <span>Canvas 2D</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Main layout ═══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedId={selectedInterview?.id ?? null}
          onSelect={handleSelectInterview}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />

        {/* Center + right */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedInterview ? (
            <div className="flex-1 flex overflow-hidden">
              {/* ── Mapa — czysta, bez overlayów ── */}
              <div className="flex-1 relative">
                <MapView
                  speakerAPos={selectedInterview.speakerAPos}
                  speakerBPos={selectedInterview.speakerBPos}
                  speakerALabel={selectedInterview.speakerA.name}
                  speakerBLabel={selectedInterview.speakerB.name}
                  listenerX={listenerX}
                  listenerZ={listenerZ}
                  listenerAngle={listenerAngle}
                  activeSpeaker={activeSpeaker}
                  accentColor={accentColor}
                  ambientDesc={selectedInterview.ambientDescription}
                  binaural={selectedInterview.binaural ?? false}
                  onListenerMove={handleListenerMove}
                />
              </div>

              {/* ── Panel prawy — dane wywiadu + timing ── */}
              <div className="w-80 border-l border-white/5 overflow-hidden">
                <Playlist
                  interview={selectedInterview}
                  currentTrackIndex={currentTrackIndex}
                  isLoadingTrack={isLoadingTrack}
                  isPlaying={isPlaying}
                  trackElapsedMs={trackElapsedMs}
                  trackDurationMs={trackDurationMs}
                  onSkipTo={handleSkipTo}
                />
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-spin"
                    style={{ animationDuration: "20s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-30">🎙️</span>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-white/20 mb-2">
                  Wybierz wywiad
                </h2>
                <p className="text-xs text-white/10 max-w-xs">
                  Wybierz element z bocznego panelu, aby załadować przestrzenny
                  wywiad audio
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ Transport controls ═══════ */}
      <TransportControls
        isPlaying={isPlaying}
        hasInterview={!!selectedInterview}
        ambientLevel={ambientLevel}
        dialogLevel={dialogLevel}
        accentColor={accentColor}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSkipPrev={handleSkipPrev}
        onSkipNext={handleSkipNext}
        onAmbientLevelChange={handleAmbientLevel}
        onDialogLevelChange={handleDialogLevel}
      />
    </div>
  )
}
