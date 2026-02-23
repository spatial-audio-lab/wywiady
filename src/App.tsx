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
        <div className="fixed inset-0 z-50 bg-[#060610] flex items-center justify-center overflow-y-auto">
          <div className="text-center max-w-3xl px-8 py-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping"
                style={{ animationDuration: "3s" }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-indigo-500/50 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
              <div
                className="absolute inset-4 rounded-full border-2 border-indigo-500/60 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[#060610] rounded-full z-10">
                <span className="text-5xl">🎧</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Spatial Audio Lab
            </h1>
            <p className="text-xl md:text-2xl text-blue-300 font-medium mb-8">
              Archiwum wywiadów o dźwięku przestrzennym
            </p>

            {/* Panel instruktażowy - bardzo wysoki kontrast, duże litery */}
            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-6 md:p-8 text-left mb-10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-600 pb-2">
                Jak korzystać z aplikacji?
              </h2>
              <p className="text-lg text-slate-200 mb-6 leading-relaxed">
                Jeśli nigdy nie doświadczyłeś dźwięku przestrzennego w
                przeglądarce, oto kilka ważnych wskazówek. Aplikacja symuluje
                prawdziwą przestrzeń wokół Ciebie:
              </p>
              <ul className="space-y-5 text-lg text-slate-100">
                <li className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden="true">
                    🎧
                  </span>
                  <div>
                    <strong className="text-white block text-xl mb-1">
                      Krok 1: Załóż słuchawki (Konieczne)
                    </strong>
                    Bez słuchawek nie usłyszysz głębi oraz tego, z której strony
                    dobiega głos.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden="true">
                    🚶
                  </span>
                  <div>
                    <strong className="text-white block text-xl mb-1">
                      Krok 2: Poruszaj się w przestrzeni
                    </strong>
                    Użyj klawiszy{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      W
                    </kbd>{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      A
                    </kbd>{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      S
                    </kbd>{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      D
                    </kbd>
                    , aby chodzić po wirtualnej mapie. Podejdź do rozmówcy, aby
                    usłyszeć go wyraźniej.
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-3xl" aria-hidden="true">
                    🔄
                  </span>
                  <div>
                    <strong className="text-white block text-xl mb-1">
                      Krok 3: Obracaj głowę
                    </strong>
                    Użyj klawiszy{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      Q
                    </kbd>{" "}
                    oraz{" "}
                    <kbd className="bg-slate-700 px-3 py-1 rounded-md border border-slate-500 mx-1 font-bold">
                      E
                    </kbd>
                    , aby się rozglądać. Dźwięk w słuchawkach płynnie zmieni
                    położenie.
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <button
                onClick={handleStartAudio}
                className="px-10 py-5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xl shadow-xl shadow-indigo-900/50 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-400"
                aria-label="Rozpocznij doświadczenie dźwiękowe"
              >
                ▶ Rozpocznij Doświadczenie
              </button>
            </div>

            <p className="text-sm text-slate-400 mt-6 font-medium">
              Wymagana jest interakcja (kliknięcie), aby przeglądarka zezwoliła
              na odtwarzanie dźwięku.
            </p>

            <div className="flex justify-center gap-4 md:gap-6 mt-6 text-sm text-slate-500 font-semibold flex-wrap">
              <span>Web Audio API</span>
              <span aria-hidden="true">·</span>
              <span>HRTF Binaural</span>
              <span aria-hidden="true">·</span>
              <span>FOA Ambisonics</span>
              <span aria-hidden="true">·</span>
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
                <div className="absolute top-6 left-6 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-md rounded-xl px-5 py-4 max-w-sm border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl" aria-hidden="true">
                        {selectedInterview.icon}
                      </span>
                      <h2 className="text-lg font-bold text-white">
                        {selectedInterview.title}
                      </h2>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">
                      {selectedInterview.subtitle} ·{" "}
                      {selectedInterview.location}
                    </p>
                    {currentTrackIndex >= 0 &&
                      currentTrackIndex < selectedInterview.tracks.length && (
                        <div className="mt-4 flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-600">
                          {isLoadingTrack ? (
                            <span className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
                          ) : (
                            <span
                              className="w-3 h-3 rounded-full animate-pulse shadow-md"
                              style={{
                                backgroundColor:
                                  selectedInterview.tracks[currentTrackIndex]
                                    .speaker === "A"
                                    ? "#ff6b6b"
                                    : "#4ecdc4",
                              }}
                            />
                          )}
                          <span className="text-sm font-semibold text-white">
                            {isLoadingTrack
                              ? "Wczytywanie ścieżki..."
                              : selectedInterview.tracks[currentTrackIndex]
                                  .label}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* ── Playlist panel ── */}
              <div className="w-80 border-l border-slate-700 overflow-hidden bg-[#0a0a16]">
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
            <div className="flex-1 flex items-center justify-center bg-[#060610]">
              <div className="text-center p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl max-w-md">
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-dashed border-slate-600 animate-spin"
                    style={{ animationDuration: "20s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl opacity-80" aria-hidden="true">
                      🎙️
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Wybierz wywiad
                </h2>
                <p className="text-base text-slate-300 leading-relaxed">
                  Skorzystaj z panelu bocznego po lewej stronie, aby załadować
                  interesujący Cię wywiad i wejść do przestrzeni dźwiękowej.
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
