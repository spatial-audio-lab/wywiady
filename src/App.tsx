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
      if (engineRef.current) {
        // ← Pass all track fields including filename so the engine can fetch real files
        const tracks = interview.tracks.map((t) => ({
          speaker: t.speaker,
          durationMs: t.durationMs,
          label: t.label,
          filename: t.filename,
        }))
        const idx = interviews.findIndex((i) => i.id === interview.id)
        await engineRef.current.loadInterview(interview.id, tracks, idx)
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
          <div className="text-center max-w-xl px-8">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full border border-indigo-400/40 animate-ping"
                style={{ animationDuration: "3s" }}
              />
              <div
                className="absolute inset-2 rounded-full border border-indigo-400/50 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
              <div
                className="absolute inset-4 rounded-full border border-indigo-400/60 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl">🎧</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
              Spatial Audio Lab
            </h1>
            <p className="text-base text-indigo-200/80 mb-4 font-medium">
              Archiwum wywiadów o dźwięku przestrzennym
            </p>
            <p className="text-sm md:text-base text-slate-300 mb-8 leading-relaxed max-w-md mx-auto">
              Zanurz się w historiach 5 ekspertów.{" "}
              <strong>Załóż słuchawki</strong>, poruszaj się po wirtualnej
              przestrzeni za pomocą klawiatury i doświadcz w pełni
              trójwymiarowego dźwięku binauralnego.
            </p>

            {/* Control preview */}
            <div className="inline-flex gap-8 mb-10 text-xs text-slate-300 bg-white/[0.05] rounded-2xl px-8 py-5 border border-white/10 shadow-lg">
              <div className="text-center">
                <div className="grid grid-cols-3 gap-1 mb-2">
                  <span />
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/20 text-white font-bold text-xs shadow-sm">
                    W
                  </kbd>
                  <span />
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/20 text-white font-bold text-xs shadow-sm">
                    A
                  </kbd>
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/20 text-white font-bold text-xs shadow-sm">
                    S
                  </kbd>
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-white/20 text-white font-bold text-xs shadow-sm">
                    D
                  </kbd>
                </div>
                <span className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">
                  Poruszanie
                </span>
              </div>
              <div className="text-center flex flex-col justify-end">
                <div className="flex gap-1 mb-2 justify-center">
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-amber-500/30 text-amber-100 font-bold text-xs shadow-sm">
                    Q
                  </kbd>
                  <kbd className="w-8 h-7 flex items-center justify-center rounded bg-amber-500/30 text-amber-100 font-bold text-xs shadow-sm">
                    E
                  </kbd>
                </div>
                <span className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">
                  Obracanie głowy
                </span>
              </div>
            </div>

            <div>
              <button
                onClick={handleStartAudio}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-900/50 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                ▶ Rozpocznij Doświadczenie
              </button>
            </div>

            <p className="text-xs text-white/40 mt-6">
              Przeglądarka wymaga kliknięcia, aby uruchomić silnik audio · 48
              kHz · 32-bit float
            </p>

            <div className="flex justify-center gap-5 mt-4 text-xs text-white/40">
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
              {/* ── Map View ── */}
              <div className="flex-1 relative">
                <MapView
                  speakerAPos={{ x: -3, z: -3 }}
                  speakerBPos={{ x: 3, z: -3 }}
                  speakerALabel={selectedInterview.speakerA.name}
                  speakerBLabel={selectedInterview.speakerB.name}
                  listenerX={listenerX}
                  listenerZ={listenerZ}
                  listenerAngle={listenerAngle}
                  activeSpeaker={activeSpeaker}
                  accentColor={accentColor}
                  ambientDesc={selectedInterview.ambientDescription}
                  onListenerMove={handleListenerMove}
                />

                {/* Interview title overlay */}
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md rounded-xl px-5 py-4 max-w-sm border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{selectedInterview.icon}</span>
                      <h2 className="text-base font-bold text-white">
                        {selectedInterview.title}
                      </h2>
                    </div>
                    <p className="text-xs text-white/70 font-medium">
                      {selectedInterview.subtitle} ·{" "}
                      {selectedInterview.location}
                    </p>
                    {currentTrackIndex >= 0 &&
                      currentTrackIndex < selectedInterview.tracks.length && (
                        <div className="mt-3 flex items-center gap-2">
                          {isLoadingTrack ? (
                            <span className="w-2.5 h-2.5 rounded-full border border-white/40 border-t-white animate-spin" />
                          ) : (
                            <span
                              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                              style={{
                                backgroundColor:
                                  selectedInterview.tracks[currentTrackIndex]
                                    .speaker === "A"
                                    ? "#ff6b6b"
                                    : "#4ecdc4",
                              }}
                            />
                          )}
                          <span className="text-sm text-white/90 font-semibold">
                            {isLoadingTrack
                              ? "Wczytywanie..."
                              : selectedInterview.tracks[currentTrackIndex]
                                  .label}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* ── Playlist panel ── */}
              <div className="w-80 border-l border-white/10 overflow-hidden">
                <Playlist
                  interview={selectedInterview}
                  currentTrackIndex={currentTrackIndex}
                  isLoadingTrack={isLoadingTrack}
                  onSkipTo={handleSkipTo}
                />
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin"
                    style={{ animationDuration: "20s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-60">🎙️</span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-white/80 mb-3">
                  Wybierz wywiad z listy
                </h2>
                <p className="text-sm text-white/60 max-w-xs mx-auto">
                  Skorzystaj z panelu bocznego, aby załadować przestrzeń
                  dźwiękową eksperta.
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
