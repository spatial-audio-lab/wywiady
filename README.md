# 🎙️ Interactive Ambisonic Reportage v2.0

Interaktywny odtwarzacz wywiadów z dźwiękiem przestrzennym (Ambisonics FOA + HRTF).  
Użytkownik porusza się po mapie 2D między źródłami dźwięku i słyszy zmiany przestrzenne w słuchawkach.

🌐 **Live:** [https://spatial-audio-lab.github.io/wywiady/](https://spatial-audio-lab.github.io/wywiady/)

---

## 🚀 Deploy na GitHub Pages

### Repozytorium: `spatial-audio-lab/wywiady`

#### 1. Sklonuj / zsynchronizuj przez GitHub Desktop

Połącz lokalny folder `wywiady` z repozytorium:
```
https://github.com/spatial-audio-lab/wywiady
```

#### 2. Włącz GitHub Pages (jednorazowo)

Idź do: **Settings** → **Pages** → **Source** → wybierz **GitHub Actions**

> ⚠️ WAŻNE: Nie wybieraj "Deploy from a branch" — wybierz **"GitHub Actions"**.

#### 3. Push przez GitHub Desktop

Po każdym uaktualnieniu plików i pushu na `main`, workflow automatycznie:
1. Zainstaluje zależności (`npm ci`)
2. Zbuduje projekt (`npm run build`)
3. Wrzuci `dist/` na GitHub Pages

Strona będzie dostępna pod: **https://spatial-audio-lab.github.io/wywiady/**

---

## 🎧 Funkcjonalności

| # | Funkcja | Opis |
|---|---------|------|
| 1 | **5 wywiadów** | Sidebar z listą — kliknij aby załadować scenę |
| 2 | **Ambisonics FOA** | Sferyczne tło dźwiękowe (ambient bed) per wywiad |
| 3 | **HRTF Spatialization** | Dialogi pozycjonowane w 3D (PannerNode HRTF) |
| 4 | **Ruch WSADQE** | Poruszanie się między źródłami dźwięku |
| 5 | **Mapa 2D** | Widok z góry — pozycje speakerów i listenera |
| 6 | **Kolejkowanie** | Automatyczne przejście do następnego pliku |
| 7 | **Gain Staging** | Osobne suwaki Ambient / Dialog + kompresor |

## 🎮 Sterowanie

```
         [ W ]              ↑ do przodu
    [ Q ][ · ][ E ]         ← obrót / obrót →
    [ A ][ S ][ D ]         ← strafe / ↓ tył / strafe →
```

| Klawisz | Akcja |
|---------|-------|
| **W** | Ruch do przodu (w kierunku patrzenia) |
| **S** | Ruch do tyłu |
| **A** | Przesunięcie w lewo (strafe) |
| **D** | Przesunięcie w prawo (strafe) |
| **Q** | Obrót w lewo |
| **E** | Obrót w prawo |
| **↑↓** | Przód / tył (alternatywnie) |
| **←→** | Obrót lewo / prawo (alternatywnie) |

## 📂 Struktura projektu

```
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions deploy
├── public/
│   └── assets/
│       └── interviews/
│           ├── interview_1/    ← Pliki WAV wywiadu 1
│           │   ├── ambient.wav       (4ch FOA AmbiX)
│           │   ├── 01_A_pytanie.wav  (Mono)
│           │   ├── 02_B_odpowiedz.wav
│           │   └── ...
│           ├── interview_2/
│           ├── interview_3/
│           ├── interview_4/
│           └── interview_5/
├── src/
│   ├── audio/
│   │   └── AudioEngine.ts     ← Web Audio API + HRTF
│   ├── components/
│   │   ├── MapView.tsx         ← Canvas 2D mapa z góry
│   │   ├── Sidebar.tsx         ← Panel wyboru wywiadów
│   │   ├── Playlist.tsx        ← Kolejka plików
│   │   └── TransportControls.tsx ← Play/Pause/Stop + suwaki
│   ├── data/
│   │   └── interviews.ts      ← Dane 5 wywiadów
│   ├── utils/
│   │   └── cn.ts
│   ├── App.tsx                 ← Główny komponent
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── LICENSE
└── README.md
```

## 🔊 Dodawanie prawdziwych plików audio

### Konwencja nazewnictwa

```
[Numer]_[Punkt]_[Opis].wav
```

- **Numer** — kolejność odtwarzania (01, 02, 03...)
- **Punkt** — `A` (Dziennikarz) lub `B` (Rozmówca)
- **Opis** — dowolny tekst

### Przykład

```
public/assets/interviews/interview_1/
├── ambient.wav              ← 4ch FOA (AmbiX), np. z Rode NT-SF1
├── 01_A_powitanie.wav       ← Mono, dziennikarz
├── 02_B_przedstawienie.wav  ← Mono, rozmówca
├── 03_A_pytanie_1.wav
├── 04_B_odpowiedz_1.wav
└── 05_A_zakonczenie.wav
```

### Formaty

| Typ | Format | Kanały | Uwagi |
|-----|--------|--------|-------|
| Ambient | WAV (PCM/Float) | 4ch FOA AmbiX | Zoom F6 32-bit float OK |
| Dialog | WAV (PCM/Float) | Mono | Web Audio API dekoduje natywnie |

> **Uwaga o rozmiarze:** Pliki WAV mogą być duże. Dla GitHub Pages limit to 1GB.  
> Rozważ konwersję do `.ogg` lub `.mp3` dla mniejszych plików, albo hostowanie audio na zewnętrznym CDN.

## 🛠️ Lokalna instalacja

```bash
git clone https://github.com/spatial-audio-lab/wywiady.git
cd wywiady
npm install
npm run dev      # → http://localhost:5173
```

### Build produkcyjny

```bash
npm run build
npm run preview  # → http://localhost:4173
```

## 🏗️ Architektura audio

```
                    ┌─────────────┐
                    │ AudioContext │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴────┐ ┌─────┴─────┐
        │ PannerA    │ │Ambient │ │ PannerB    │
        │ (HRTF)     │ │ Gain   │ │ (HRTF)     │
        │ Speaker A  │ │        │ │ Speaker B  │
        └─────┬──────┘ └───┬────┘ └─────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │ Compressor  │
                    │ (-6dB, 4:1) │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ Master Gain │
                    │   (0.8)     │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │ Destination │
                    │ (speakers)  │
                    └─────────────┘
```

## 📋 Notatki inżynieryjne

- **32-bit float WAV** — Web Audio API wspiera natywnie (Zoom F6 kompatybilny)
- **Gain staging** — kompresor dynamiki na master bus zapobiega clippingowi
- **HRTF** — binauralny rendering, najlepiej słuchać w słuchawkach
- **AudioContext policy** — wymagane kliknięcie użytkownika przed inicjalizacją
- **FOA rotation** — w wersji z prawdziwymi plikami, rotacja Ambisonics śledzi kamerę przez Omnitone

## 📄 Licencja

MIT
