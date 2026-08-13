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

  const audioContextRunning = audioReady && isPlaying

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--black)', color: 'var(--cream)' }}>
      {/* ═══════ Minimalny nagłówek narzędzia (manifest §08) ═══════ */}
      <header
        className="flex items-center justify-between gap-4 flex-wrap"
        style={{
          flexShrink: 0,
          background: 'var(--black)',
          borderBottom: '1px solid var(--border2)',
          padding: '16px 24px',
        }}
      >
        <div className="flex items-center">
          <a
            href="/"
            className="font-['Azeret_Mono']"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              color: 'var(--dim)',
              textDecoration: 'none',
              border: '1px solid var(--border2)',
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--cream)'
              e.currentTarget.style.borderColor = 'var(--dim)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--dim)'
              e.currentTarget.style.borderColor = 'var(--border2)'
            }}
          >
            ← Hub
          </a>
          <span
            className="font-['Lexend']"
            style={{
              fontWeight: 500,
              fontSize: '0.85rem',
              color: 'var(--cream)',
              marginLeft: '16px',
              paddingLeft: '16px',
              borderLeft: '1px solid var(--border2)',
              whiteSpace: 'nowrap',
            }}
          >
            Wywiady
          </span>
        </div>
        <div
          className="font-['Azeret_Mono'] flex items-center gap-2"
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.04em',
            color: audioContextRunning ? 'var(--cyan)' : 'var(--dim)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: audioContextRunning ? 'var(--cyan)' : 'var(--dim)',
              boxShadow: audioContextRunning ? '0 0 8px rgba(0,229,204,0.6)' : 'none',
              transition: 'background 0.25s ease, box-shadow 0.25s ease',
            }}
          />
          <span>Audio Context: {audioContextRunning ? 'Running' : 'Idle'}</span>
        </div>
      </header>

      {/* ═══════ Welcome overlay ═══════ */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-['Lexend']" style={{ background: 'var(--black)' }}>
          <div className="min-h-full flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center max-w-lg">
              <div className="relative w-24 h-24 mx-auto mb-6">
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
                  <span className="text-4xl">🎧</span>
                </div>
              </div>

              <h1 className="font-['Lexend'] text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--cream)' }}>
                Spatial Audio Lab - Wywiady
              </h1>
              <p className="text-sm md:text-base mb-4" style={{ color: 'rgba(240, 235, 224, 0.7)' }}>
                Interaktywne doświadczenie dźwięku przestrzennego
              </p>
              <p className="text-xs md:text-sm mb-6 leading-relaxed max-w-sm mx-auto font-light" style={{ color: 'rgba(156, 152, 144, 0.8)' }}>
                Zanurz się w 5 wywiadach przestrzennych. Poruszaj się po polu
                dźwiękowym za pomocą klawiatury, myszy lub ekranu dotykowego i
                doświadcz dźwięku przestrzennego w technologii HRTF.
              </p>

              <div>
                <button
                  onClick={handleStartAudio}
                  className="font-['Lexend'] font-semibold text-sm transition-opacity duration-200"
                  style={{
                    background: 'var(--cyan)',
                    color: 'var(--black)',
                    padding: '14px 24px',
                    minHeight: '44px',
                    borderRadius: '0',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseDown={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseUp={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                >
                  ▶ Rozpocznij doświadczenie
                </button>
              </div>

              {/* Ostrzeżenie o słuchawkach (manifest §12) */}
              <div
                className="font-['Azeret_Mono'] flex items-center justify-center gap-2 mt-6"
                style={{
                  fontSize: '0.66rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--amber)',
                  border: '1px solid rgba(255, 171, 0, 0.3)',
                  background: 'rgba(255, 171, 0, 0.06)',
                  padding: '10px 14px',
                }}
              >
                <span>🎧</span>
                <span>Wymagane słuchawki — treść wymaga odsłuchu w słuchawkach (dźwięk binauralny)</span>
              </div>

              <div className="flex justify-center gap-4 mt-6 text-[9px]" style={{ color: 'var(--dim)' }}>
                <span>Web Audio API</span>
                <span>·</span>
                <span>HRTF Binaural</span>
                <span>·</span>
                <span>FOA Ambisonics</span>
                <span>·</span>
                <span>Canvas 2D</span>
              </div>

              {/* Moduł KPO — zawsze na białym tle (manifest §13) */}
              <div className="flex justify-center mt-8">
                <div style={{ background: '#FFFFFF', padding: '10px 16px', display: 'inline-flex' }}>
                  <img
                    src={`${import.meta.env.BASE_URL}assets/img/KPO.jpg`}
                    alt="Krajowy Plan Odbudowy"
                    className="h-12 md:h-16"
                  />
                </div>
              </div>
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
              <div className="w-80 overflow-hidden" style={{ borderLeft: '1px solid rgba(240, 235, 224, 0.08)' }}>
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
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgba(240, 235, 224, 0.4)' }}>
                  Wybierz wywiad
                </h2>
                <p className="text-xs max-w-xs" style={{ color: 'var(--dim)' }}>
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
