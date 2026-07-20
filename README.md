# 🎧 Interactive Ambisonic Reportage v2.0

> Interaktywny odtwarzacz wywiadów z dźwiękiem przestrzennym (Spatial Audio).  
> Użytkownik nawiguje w przestrzeni 2D między źródłami dźwięku, słysząc sferyczne tło (FOA Ambisonics) oraz dialogi przypisane do dwóch punktów (HRTF PannerNode).
>
> https://spatial-audio-lab.github.io/wywiady/

![Web Audio API](https://img.shields.io/badge/Web_Audio_API-HRTF-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Vite](https://img.shields.io/badge/Vite-7-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

---

## 📋 Spis treści

- [Funkcjonalności](#-funkcjonalności)
- [Architektura audio](#-architektura-audio)
- [Sterowanie](#-sterowanie)
- [Struktura plików](#-struktura-plików)
- [Struktura assets (wywiady)](#-struktura-assets-wywiady)
- [Instalacja i uruchomienie](#-instalacja-i-uruchomienie)
- [Build produkcyjny](#-build-produkcyjny)
- [Dodawanie własnych wywiadów](#-dodawanie-własnych-wywiadów)
- [Notatki inżynieryjne](#-notatki-inżynieryjne)
- [Licencja](#-licencja)

---

## ✨ Funkcjonalności

| # | Funkcjonalność | Status |
|---|----------------|--------|
| 1 | **5 wywiadów** z unikalnymi scenami dźwiękowymi | ✅ |
| 2 | **Ambisoniczne tło** (FOA) — różne otoczenia dźwiękowe per wywiad | ✅ |
| 3 | **Nawigacja WSADQE** w przestrzeni między źródłami dźwięku | ✅ |
| 4 | **Widok z góry** (mapa 2D) — uproszczona wizualizacja bez wysokości | ✅ |
| 5 | **HRTF Binaural** — realistyczna spatializacja słuchawkowa | ✅ |
| 6 | **Kolejkowanie dialogów** — automatyczne przejścia A↔B | ✅ |
| 7 | **Gain Staging** — niezależne suwaki Ambient/Dialog + kompresor | ✅ |
| 8 | **Responsywny UI** — Sidebar + Playlist + Transport Controls | ✅ |

---

## 🔊 Architektura audio

```
┌─────────────────────────────────────────────────────────┐
│                     AudioContext (48kHz)                 │
│                                                         │
│  ┌──────────────┐                                       │
│  │ Ambient Bed   │──→ AmbientGain ──┐                   │
│  │ (FOA / synth) │                   │                   │
│  └──────────────┘                   │                   │
│                                      ▼                   │
│  ┌──────────────┐              ┌───────────┐            │
│  │ Track N (_A_) │──→ PannerA ─┤           │            │
│  │ (Mono HRTF)   │   (-3,0,-3) │ DialogGain│──┐        │
│  └──────────────┘              │           │  │        │
│  ┌──────────────┐              │           │  │        │
│  │ Track N (_B_) │──→ PannerB ─┤           │  │        │
│  │ (Mono HRTF)   │   (+3,0,-3) └───────────┘  │        │
│  └──────────────┘                              ▼        │
│                                        ┌──────────────┐ │
│                                        │  Compressor   │ │
│                                        │  (threshold   │ │
│                                        │   -6dB, 4:1)  │ │
│                                        └──────┬───────┘ │
│                                               ▼         │
│                                        ┌──────────────┐ │
│                                        │ Master Gain   │ │
│                                        │   (0.8)       │ │
│                                        └──────┬───────┘ │
│                                               ▼         │
│                                        ┌──────────────┐ │
│                                        │ destination   │ │
│                                        │ (speakers/    │ │
│                                        │  headphones)  │ │
│                                        └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Sterowanie

```
        ┌───┐
   Q    │ W │    E
 rotate │FWD│ rotate
  left  └───┘  right
   ┌───┐┌───┐┌───┐
   │ A ││ S ││ D │
   │ ← ││BWD││ → │
   └───┘└───┘└───┘
  strafe back strafe
  left        right
```

| Klawisz | Akcja |
|---------|-------|
| `W` / `↑` | Ruch do przodu (w kierunku patrzenia) |
| `S` / `↓` | Ruch do tyłu |
| `A` | Przesunięcie w lewo (strafe) |
| `D` | Przesunięcie w prawo (strafe) |
| `Q` / `←` | Obrót w lewo |
| `E` / `→` | Obrót w prawo |

---

## 📁 Struktura plików

```
interactive-ambisonic-reportage/
├── index.html                          # Entry point HTML
├── package.json                        # Zależności npm
├── tsconfig.json                       # Konfiguracja TypeScript
├── vite.config.ts                      # Konfiguracja Vite + pluginy
├── .gitignore                          # Pliki ignorowane przez Git
├── README.md                           # Ten plik
│
├── src/
│   ├── main.tsx                        # Bootstrap React
│   ├── index.css                       # Tailwind CSS + custom styles
│   ├── App.tsx                         # Główny komponent — orkiestracja
│   │
│   ├── audio/
│   │   └── AudioEngine.ts             # Silnik Web Audio API
│   │                                    #   - HRTF PannerNode (A/B)
│   │                                    #   - Gain staging + compressor
│   │                                    #   - Kolejkowanie tracków
│   │                                    #   - Synteza demo audio
│   │
│   ├── components/
│   │   ├── MapView.tsx                 # Canvas 2D — mapa z góry
│   │   │                                #   - Rysowanie siatki, kompasu
│   │   │                                #   - Stożek słyszenia
│   │   │                                #   - Pozycje speakerów A/B
│   │   │                                #   - Obsługa WSADQE
│   │   ├── Sidebar.tsx                 # Panel wyboru wywiadów
│   │   ├── Playlist.tsx                # Lista tracków (visual feed)
│   │   └── TransportControls.tsx       # Play/Pause/Stop + suwaki gain
│   │
│   ├── data/
│   │   └── interviews.ts              # Dane 5 wywiadów + typy TS
│   │
│   └── utils/
│       └── cn.ts                       # Utility: clsx + tailwind-merge
│
└── public/                             # (opcjonalnie) Pliki statyczne
    └── assets/
        └── interviews/
            ├── interview_1/
            │   ├── ambient.wav         # FOA AmbiX (4-kanałowy)
            │   ├── 01_A_pytanie.wav    # Mono — speaker A
            │   ├── 02_B_odpowiedz.wav  # Mono — speaker B
            │   └── ...
            ├── interview_2/
            └── ...
```

---

## 🎤 Struktura assets (wywiady)

Każdy wywiad w osobnym folderze `public/assets/interviews/interview_N/`:

```
interview_1/
├── ambient.wav                  # 4-kanałowy FOA (format AmbiX, Rode NT-SF1)
├── 01_A_opening.wav             # Mono — speaker A, segment 1
├── 02_B_acoustics.wav           # Mono — speaker B, segment 2
├── 03_A_health.wav              # Mono — speaker A, segment 3
├── 04_B_studies.wav             # Mono — speaker B, segment 4
├── 05_A_solutions.wav           # Mono — speaker A, segment 5
└── 06_B_closing.wav             # Mono — speaker B, segment 6
```

### Konwencja nazewnictwa

```
[Numer]_[Punkt]_[Opis].wav
  │       │       │
  │       │       └── Dowolny opis (bez spacji, snake_case)
  │       └────────── 'A' = Dziennikarz (PannerA) | 'B' = Rozmówca (PannerB)
  └────────────────── Kolejność odtwarzania (01, 02, 03, ...)
```

> **Uwaga:** Aktualnie aplikacja używa syntetyzowanego audio demo. Aby odtwarzać prawdziwe pliki WAV, należy:
> 1. Umieścić pliki w `public/assets/interviews/interview_N/`
> 2. Zmodyfikować `AudioEngine.ts` — zastąpić syntezę wywołaniami `fetch()` + `decodeAudioData()`
> 3. Dla ambient FOA: podłączyć Omnitone (`createFOARenderer`) zamiast syntezowanego szumu

---

## 🚀 Instalacja i uruchomienie

### Wymagania

- **Node.js** ≥ 18
- **npm** ≥ 9

### Kroki

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/TWOJ_USER/interactive-ambisonic-reportage.git
cd interactive-ambisonic-reportage

# 2. Zainstaluj zależności
npm install

# 3. Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`.

> 🎧 **Zalecane:** Użyj słuchawek dla pełnego efektu HRTF binaural.

---

## 📦 Build produkcyjny

```bash
# Build
npm run build

# Podgląd buildu
npm run preview
```

Wynik builda trafia do katalogu `dist/`. Plik `dist/index.html` jest samodzielny (single-file, inline JS/CSS dzięki `vite-plugin-singlefile`).

---

## ➕ Dodawanie własnych wywiadów

1. **Przygotuj pliki audio:**
   - `ambient.wav` — 4-kanałowy FOA AmbiX (np. z Rode NT-SF1)
   - `01_A_opis.wav`, `02_B_opis.wav`, ... — Mono, 48kHz, 32-bit float (np. z Zoom F6)

2. **Umieść w folderze:**
   ```
   public/assets/interviews/interview_6/
   ```

3. **Dodaj wpis w `src/data/interviews.ts`:**
   ```typescript
   {
     id: 'interview_6',
     title: 'Twój Wywiad',
     subtitle: 'Opis',
     location: 'Miejsce',
     date: '2024-08-01',
     icon: '🎙️',
     color: '#8b5cf6',
     ambientDescription: 'Opis ambientu',
     speakerA: { name: 'Dziennikarz', role: 'Journalist' },
     speakerB: { name: 'Rozmówca', role: 'Expert' },
     tracks: [
       { id: '6-1', order: 1, speaker: 'A', label: 'Pytanie 1', filename: '01_A_pytanie1.wav', durationMs: 8000 },
       { id: '6-2', order: 2, speaker: 'B', label: 'Odpowiedź 1', filename: '02_B_odpowiedz1.wav', durationMs: 12000 },
       // ...
     ],
   }
   ```

4. **Zmodyfikuj `AudioEngine.ts`** aby ładować prawdziwe pliki (patrz sekcja powyżej).

---

## 🔧 Notatki inżynieryjne

### Format audio
- Pliki z **Zoom F6** są w 32-bit float — Web Audio API natywnie wspiera ten format przez `decodeAudioData()`
- **Ambient FOA** (AmbiX): 4 kanały, kolejność ACN, normalizacja SN3D
- **Dialogi**: Mono WAV, 48kHz

### Gain Staging
- **Compressor** na sumie (threshold: -6dB, ratio: 4:1) zapobiega clippingowi
- **Master Gain**: 0.8 (headroom)
- Niezależne suwaki: Ambient (domyślnie 25%) i Dialog (domyślnie 70%)

### HRTF
- `PannerNode` z `panningModel: 'HRTF'`
- `distanceModel: 'inverse'`, `rolloffFactor: 1.5`
- Pozycja listenera synchronizowana z nawigacją klawiszową

### Przeglądarki
- `AudioContext` wymaga interakcji użytkownika (kliknięcia) — obsłużone przez Welcome Screen
- Testowane: Chrome 120+, Firefox 121+, Safari 17+, Edge 120+

### Omnitone (FOA)
- W wersji produkcyjnej: `Omnitone.createFOARenderer()` dekoduje AmbiX i rotuje zgodnie z orientacją słuchacza
- W wersji demo: syntezowany szum brązowy symuluje ambient

---

## 🌐 Deploy na GitHub Pages

### Opcja 1: Auto-deploy (zalecane)

Repozytorium zawiera GitHub Action workflow (`.github/workflows/deploy.yml`), który automatycznie buduje i publikuje na GitHub Pages przy każdym `git push` do branch `main`.

**Kroki:**
1. W repozytorium GitHub przejdź do **Settings → Pages**
2. W sekcji **Build and deployment** ustaw:
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` / `(root)`
3. Po pierwszym `push` do `main`, workflow wykona build i opublikuje aplikację pod:
   ```
   https://spatial-audio-lab.github.io/wywiady/
   ```

### Opcja 2: Ręczny deploy

```bash
# Zbuduj projekt
npm run build

# Zainstaluj gh-pages jeśli nie masz
npm install -D gh-pages

# Wdróż ręcznie (edytuj nazwę repozytorium)
npx gh-pages -d dist -r https://github.com/TWOJ_USER/interactive-ambisonic-reportage.git
```

### Konfiguracja własnej domeny

Jeśli używasz własnej domeny, ustaw `base` w `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/twoja-domena/',
  // ...
});
```

---

## 📜 Licencja

MIT License — patrz [LICENSE](LICENSE).
