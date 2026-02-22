# 🎤 Interview Assets

Place your interview audio files here, organized by folder:

```
interviews/
├── interview_1/
│   ├── ambient.wav              # 4-channel FOA AmbiX
│   ├── 01_A_opening.wav         # Mono — Speaker A
│   ├── 02_B_acoustics.wav       # Mono — Speaker B
│   └── ...
├── interview_2/
│   ├── ambient.wav
│   ├── 01_A_intro.wav
│   └── ...
├── interview_3/
├── interview_4/
└── interview_5/
```

## File naming convention

```
[Number]_[Point]_[Description].wav
```

- **Number**: Playback order (01, 02, 03, ...)
- **Point**: `A` = Journalist (left panner) | `B` = Interviewee (right panner)
- **Description**: Any snake_case description

## Audio specs

- **Ambient**: 4-channel WAV, FOA AmbiX (ACN/SN3D), 48kHz, 32-bit float
- **Dialog**: Mono WAV, 48kHz, 32-bit float (Zoom F6 native format supported)
