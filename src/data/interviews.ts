export interface SpeakerPosition2D {
  x: number
  z: number
}

export interface TrackItem {
  id: string
  order: number
  speaker: "A" | "B"
  label: string
  /** Nazwa pliku względem folderu wywiadu, np. "01_A_pytanie.wav" */
  filename: string
  /**
   * Zastępczy czas trwania w milisekundach — używany, gdy plik audio nie zostanie załadowany.
   * Gdy wgrasz prawdziwe pliki WAV/WEBM, AudioEngine sam zczyta ich długość.
   */
  durationMs?: number
  binaural?: boolean
}

export interface Interview {
  id: string
  title: string
  subtitle: string
  location: string
  date: string
  icon: string
  color: string
  ambientDescription: string
  ambientFile?: string
  speakerAPos: SpeakerPosition2D
  speakerBPos: SpeakerPosition2D
  listenerStart?: SpeakerPosition2D
  binaural?: boolean
  tracks: TrackItem[]
  speakerA: { name: string; role: string }
  speakerB: { name: string; role: string }
}

export const interviews: Interview[] = [
  {
    id: "interview_1",
    title: "Izabela Dłużyk",
    subtitle: "Dźwięki natury i field recording",
    location: "Plener / Las",
    date: "2025-10",
    icon: "🌿",
    color: "#22c55e",
    ambientDescription:
      "Wielokanałowe nagranie terenowe: wiatr, ptaki, mikrodetale lasu",
    speakerAPos: { x: -2, z: -3 },
    speakerBPos: { x: 2, z: -3 },
    listenerStart: { x: 0, z: 3 },
    speakerA: { name: "Badacz", role: "Pytający" },
    speakerB: { name: "Izabela Dłużyk", role: "Field Recordzistka" },
    tracks: [
      {
        id: "1-1",
        order: 1,
        speaker: "A",
        label: "Definicja dźwięku immersyjnego",
        filename: "01_A_pytanie1.wav",
        durationMs: 6000,
      },
      {
        id: "1-2",
        order: 2,
        speaker: "B",
        label: "Podejście do nagrań terenowych",
        filename: "02_B_odpowiedz1.wav",
        durationMs: 15000,
      },
      {
        id: "1-3",
        order: 3,
        speaker: "A",
        label: "Techniki mikrofonowe",
        filename: "03_A_pytanie2.wav",
        durationMs: 5000,
      },
      {
        id: "1-4",
        order: 4,
        speaker: "B",
        label: "Budowanie wiarygodnej przestrzeni",
        filename: "04_B_odpowiedz2.wav",
        durationMs: 18000,
      },
    ],
  },
  {
    id: "interview_2",
    title: "Zuzanna Całka",
    subtitle: "Muzyka ambient i scenografie dźwiękowe",
    location: "Studio Muzyczne",
    date: "2026-01",
    icon: "🎹",
    color: "#8b5cf6",
    ambientDescription:
      "Głęboki, powoli ewoluujący dron syntezatorowy z subtelnym pogłosem",
    speakerAPos: { x: -3, z: -2 },
    speakerBPos: { x: 3, z: -2 },
    listenerStart: { x: 0, z: 4 },
    speakerA: { name: "Badacz", role: "Pytający" },
    speakerB: { name: "Zuzanna Całka", role: "Kompozytorka" },
    tracks: [
      {
        id: "2-1",
        order: 1,
        speaker: "A",
        label: "Czym jest immersja w ambiencie?",
        filename: "01_A_pytanie.wav",
        durationMs: 7000,
      },
      {
        id: "2-2",
        order: 2,
        speaker: "B",
        label: "Projektowanie barwy i przestrzeni",
        filename: "02_B_odpowiedz.wav",
        durationMs: 20000,
      },
      {
        id: "2-3",
        order: 3,
        speaker: "A",
        label: "Tworzenie scenografii dźwiękowej",
        filename: "03_A_pytanie2.wav",
        durationMs: 6000,
      },
      {
        id: "2-4",
        order: 4,
        speaker: "B",
        label: "Rola ciszy w kompozycji",
        filename: "04_B_odpowiedz2.wav",
        durationMs: 16000,
      },
    ],
  },
  {
    id: "interview_3",
    title: "Rafał Ryterski",
    subtitle: "Sound design i muzyka współczesna",
    location: "Pracownia Elektroakustyczna",
    date: "2025-12",
    icon: "🎛️",
    color: "#f97316",
    ambientDescription:
      "Szum wentylatora w tle, pies chodzący po mieszkaniu",
    speakerAPos: { x: -4, z: 1 },
    speakerBPos: { x: 4, z: 1 },
    listenerStart: { x: 1, z: 1 },
    binaural: true,
    speakerA: { name: "Oskar Hamerski", role: "Pytający" },
    speakerB: { name: "Rafał Ryterski", role: "Sound Designer / Kompozytor" },
    tracks: [
      {
        id: "3-1",
        order: 1,
        speaker: "A",
        label: "Co to jest dźwięk przestrzenny?",
        filename: "wywiad1.webm",
        durationMs: 0,
        binaural: true,
      },
      {
        id: "3-2",
        order: 2,
        speaker: "B",
        label: "Elektronika a postrzeganie przestrzeni",
        filename: "wywiad2.webm",
        durationMs: 0,
        binaural: true,
      },
      {
        id: "3-3",
        order: 3,
        speaker: "A",
        label: "pytanie o filozofię pracy",
        filename: "wywiad3.webm",
        durationMs: 0,
        binaural: true,
      },
      {
        id: "3-4",
        order: 4,
        speaker: "B",
        label: "Filozofia pracy Rafała",
        filename: "wywiad4.webm",
        durationMs: 0,
        binaural: true,
      },
    ],
  },
  {
    id: "interview_4",
    title: "Krzysztof Garbaczewski",
    subtitle: "Instalacje i VR w teatrze",
    location: "Przestrzeń Wirtualna (VR)",
    date: "2025-11",
    icon: "🥽",
    color: "#ec4899",
    ambientDescription: "Abstrakcyjna, cyfrowa przestrzeń audiosferyczna 360",
    // Dodana obsługa pliku .webm jako tła (z opusem)
    ambientFile: "ambient.webm",
    speakerAPos: { x: -3, z: 0 },
    speakerBPos: { x: 3, z: 0 },
    listenerStart: { x: 0, z: 4 },
    speakerA: { name: "Oskar Hamerski", role: "Pytający" },
    speakerB: { name: "Krzysztof Garbaczewski", role: "Reżyser / Twórca VR" },
    tracks: [
      {
        id: "4-1",
        order: 1,
        speaker: "A",
        label: "Co cię zaintersowało w VR?",
        filename: "01_A_pytanie.webm",
        durationMs: 6000,
      },
      {
        id: "4-2",
        order: 2,
        speaker: "B",
        label: "Pusta przestrzeń",
        filename: "02_B_odpowiedz.webm",
        durationMs: 18000,
      },
      {
        id: "4-3",
        order: 3,
        speaker: "A",
        label: "Od czego zacząłeś?",
        filename: "03_A_pytanie2.webm",
        durationMs: 5000,
      },
      {
        id: "4-4",
        order: 4,
        speaker: "B",
        label: "Robert Robur",
        filename: "04_B_odpowiedz2.webm",
        durationMs: 15000,
      },
      {
        id: "4-5",
        order: 5,
        speaker: "A",
        label: "Czy VR jest łatwiejszy niż, tradycyjna przestrzeń?",
        filename: "05_A_pytanie3.webm",
        durationMs: 5000,
      },
      {
        id: "4-6",
        order: 6,
        speaker: "B",
        label: "VR nie jest łatwy",
        filename: "06_B_odpowiedz3.webm",
        durationMs: 15000,
      },
    ],
  },
  {
    id: "interview_5",
    title: "Andrzej Brzoska",
    subtitle: "Reżyseria dźwięku w teatrze i filmie",
    location: "Scena Teatralna",
    date: "2026-02",
    icon: "🎭",
    color: "#3b82f6",
    ambientDescription: "Akustyka dużej sali teatralnej, oddech pustej widowni",
    speakerAPos: { x: -5, z: -4 },
    speakerBPos: { x: 5, z: -4 },
    listenerStart: { x: 0, z: 6 },
    speakerA: { name: "Badacz", role: "Pytający" },
    speakerB: { name: "Andrzej Brzoska", role: "Reżyser Dźwięku" },
    tracks: [
      {
        id: "5-1",
        order: 1,
        speaker: "A",
        label: "Budowa przestrzeni narracyjnej",
        filename: "01_A_pytanie.wav",
        durationMs: 7000,
      },
      {
        id: "5-2",
        order: 2,
        speaker: "B",
        label: "Rola dźwięku w narracji",
        filename: "02_B_odpowiedz.wav",
        durationMs: 22000,
      },
      {
        id: "5-3",
        order: 3,
        speaker: "A",
        label: "Immersja na widowni",
        filename: "03_A_pytanie2.wav",
        durationMs: 6000,
      },
      {
        id: "5-4",
        order: 4,
        speaker: "B",
        label: "Psychologia słyszenia w kinie/teatrze",
        filename: "04_B_odpowiedz2.wav",
        durationMs: 19000,
      },
    ],
  },
]
