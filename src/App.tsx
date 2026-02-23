import React, { useState, useEffect, useRef } from "react"
import Sidebar from "./components/Sidebar"
import Playlist from "./components/Playlist"
import TransportControls from "./components/TransportControls"
import MapView from "./components/MapView"
import { AudioEngine } from "./audio/AudioEngine"
import { interviews } from "./data/interviews"

export default function App() {
  const [activeInterviewId, setActiveInterviewId] = useState(interviews[0].id)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [showIntro, setShowIntro] = useState(true)

  // Spatial state
  const [listenerPos, setListenerPos] = useState({ x: 0, z: 3 })
  const [listenerRot, setListenerRot] = useState(0) // w radianach

  const engineRef = useRef<AudioEngine | null>(null)

  const activeInterview =
    interviews.find((i) => i.id === activeInterviewId) || interviews[0]

  // Inicjalizacja AudioEngine
  useEffect(() => {
    engineRef.current = new AudioEngine()
    return () => {
      engineRef.current?.dispose()
    }
  }, [])

  // Aktualizacja pozycji słuchacza w silniku audio
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateListenerPosition(listenerPos.x, listenerPos.z)
      engineRef.current.updateListenerOrientation(listenerRot)
    }
  }, [listenerPos, listenerRot])

  // Aktualizacja pozycji źródeł dźwięku gdy zmienia się wywiad
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSourcePositions(
        activeInterview.speakerAPos,
        activeInterview.speakerBPos,
      )

      if (activeInterview.listenerStart) {
        setListenerPos(activeInterview.listenerStart)
      } else {
        setListenerPos({ x: 0, z: 3 })
      }
    }
  }, [activeInterviewId])

  const handlePlayPause = async () => {
    if (!engineRef.current) return

    if (!isPlaying) {
      const track = activeInterview.tracks[currentTrackIndex]
      // W docelowej wersji użyjesz prawdziwych ścieżek do plików audio.
      // const trackUrl = `/assets/interviews/${activeInterview.id}/${track.filename}`
      // Oraz tła: `/assets/interviews/${activeInterview.id}/ambient.wav`

      await engineRef.current.start(track.speaker)
      setIsPlaying(true)
    } else {
      engineRef.current.stop()
      setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentTrackIndex < activeInterview.tracks.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1)
      setIsPlaying(false)
      engineRef.current?.stop()
    }
  }

  const handlePrev = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1)
      setIsPlaying(false)
      engineRef.current?.stop()
    }
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (engineRef.current) {
      engineRef.current.setMasterVolume(newVol)
    }
  }

  const handleSelectInterview = (id: string) => {
    if (isPlaying) {
      handlePlayPause()
    }
    setActiveInterviewId(id)
    setCurrentTrackIndex(0)
  }

  const startAudio = async () => {
    if (engineRef.current) {
      await engineRef.current.resumeContext()
    }
    setShowIntro(false)
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* EKRA POWITALNY / ONBOARDING */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="max-w-4xl w-full bg-slate-900 border-2 border-slate-600 rounded-2xl p-8 md:p-12 shadow-2xl mt-auto mb-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white tracking-tight">
              Spatial Audio Lab
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-blue-400">
              Archiwum wywiadów o dźwięku przestrzennym
            </h2>

            <div className="space-y-8 text-lg md:text-xl leading-relaxed text-slate-200">
              <section>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Czym jest dźwięk przestrzenny?
                </h3>
                <p>
                  Wyobraź sobie, że stoisz w środku lasu lub gwarnej sali
                  teatralnej. Dźwięki docierają do Ciebie ze wszystkich stron –
                  z przodu, z tyłu, z lewej i prawej. Ta aplikacja symuluje
                  takie właśnie środowisko w Twojej przeglądarce. Zamiast
                  płaskiego nagrania, usłyszysz dźwięk reagujący na to, gdzie
                  "stoisz" i w którą stronę jesteś zwrócony.
                </p>
              </section>

              <section className="bg-slate-800 p-6 md:p-8 rounded-xl border-2 border-slate-700 shadow-inner">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Jak korzystać z aplikacji?
                </h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <span className="text-4xl mr-5" aria-hidden="true">
                      🎧
                    </span>
                    <div>
                      <strong className="text-white block text-xl mb-1">
                        Krok 1: Załóż słuchawki (Konieczne!)
                      </strong>
                      Bez nich nie usłyszysz efektu głębi i kierunku. Są
                      absolutnie niezbędne do prawidłowego działania aplikacji.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-4xl mr-5" aria-hidden="true">
                      ⌨️
                    </span>
                    <div>
                      <strong className="text-white block text-xl mb-1">
                        Krok 2: Poruszaj się w przestrzeni
                      </strong>
                      Użyj klawiszy{" "}
                      <kbd className="bg-slate-700 px-2 py-1 rounded text-white border border-slate-500">
                        W
                      </kbd>{" "}
                      <kbd className="bg-slate-700 px-2 py-1 rounded text-white border border-slate-500">
                        A
                      </kbd>{" "}
                      <kbd className="bg-slate-700 px-2 py-1 rounded text-white border border-slate-500">
                        S
                      </kbd>{" "}
                      <kbd className="bg-slate-700 px-2 py-1 rounded text-white border border-slate-500">
                        D
                      </kbd>{" "}
                      na klawiaturze, aby chodzić po mapie. Im bliżej rozmówcy
                      się znajdziesz, tym wyraźniej go usłyszysz.
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-4xl mr-5" aria-hidden="true">
                      🖱️
                    </span>
                    <div>
                      <strong className="text-white block text-xl mb-1">
                        Krok 3: Obracaj głowę
                      </strong>
                      Ruszaj myszką po ekranie mapy, aby się obracać. Zwróć
                      uwagę na jasny stożek na ekranie – pokazuje on Twoje pole
                      widzenia. Gdy się odwrócisz, dźwięk w słuchawkach płynnie
                      zmieni położenie.
                    </div>
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-12 flex flex-col items-center">
              <button
                onClick={startAudio}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 px-12 rounded-full text-xl md:text-2xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-80 shadow-lg border-2 border-transparent hover:border-blue-300"
                aria-label="Rozpocznij doświadczenie i zezwól na dźwięk"
              >
                Rozpocznij Doświadczenie
              </button>
              <p className="mt-5 text-base text-slate-400 text-center max-w-lg">
                Klikając przycisk, zezwalasz na odtwarzanie dźwięku w Twojej
                przeglądarce.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PANEL BOCZNY (Sidebar) */}
      <Sidebar
        interviews={interviews}
        activeId={activeInterviewId}
        onSelect={handleSelectInterview}
      />

      {/* GŁÓWNY OBSZAR APLIKACJI */}
      <main className="flex-1 relative bg-slate-900 overflow-hidden flex flex-col">
        {/* Górny pasek nagłówka */}
        <header className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center pointer-events-none">
          <h1 className="text-2xl font-bold text-white drop-shadow-md bg-slate-900/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-700/50">
            Spatial Audio Lab
          </h1>
          <button
            className="pointer-events-auto px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full backdrop-blur-md transition-colors text-base font-semibold border-2 border-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500 shadow-lg flex items-center gap-2"
            onClick={() => setShowIntro(true)}
            aria-label="Pokaż instrukcję obsługi"
          >
            <span>ℹ️</span> Instrukcja
          </button>
        </header>

        {/* Mapa wizualizacji */}
        <div className="flex-1 relative w-full h-full">
          <MapView
            interview={activeInterview}
            listenerPos={listenerPos}
            listenerRot={listenerRot}
            onListenerMove={setListenerPos}
            onListenerRotate={setListenerRot}
            activeSpeaker={
              isPlaying
                ? activeInterview.tracks[currentTrackIndex].speaker
                : null
            }
          />
        </div>

        {/* Panel sterowania odtwarzaniem */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-32 pb-8 px-6 pointer-events-none flex flex-col items-center">
          <div className="pointer-events-auto w-full max-w-4xl space-y-6">
            <Playlist
              tracks={activeInterview.tracks}
              currentIndex={currentTrackIndex}
              onSelectTrack={(idx) => {
                setCurrentTrackIndex(idx)
                setIsPlaying(false)
                engineRef.current?.stop()
              }}
            />

            <TransportControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrev={handlePrev}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              hasNext={currentTrackIndex < activeInterview.tracks.length - 1}
              hasPrev={currentTrackIndex > 0}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
