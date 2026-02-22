/**
 * AudioEngine - Spatial audio engine for Interactive Ambisonic Reportage
 *
 * Playback pipeline:
 *   real file (fetch → decodeAudioData) ──► PannerNode (HRTF) ──► dialogGain ──► compressor ──► master ──► destination
 *   ambient file (fetch → loop)         ──────────────────────────► ambientGain ─┘
 *
 * Fallback: when a file is missing or fails to load, synthesised audio is used instead.
 *
 * Supported formats: anything the browser's decodeAudioData accepts.
 *   Chrome/Firefox/Edge: wav, webm/opus, ogg/opus, mp3, aac, flac
 *   Safari: wav, mp3, aac, m4a  (no ogg/opus — use webm instead)
 *   Recommendation: dialog → .webm (opus 64 kbps), ambient → .wav (keep PCM quality)
 */

export interface SpeakerPosition {
  x: number
  y: number
  z: number
}

export interface AudioEngineState {
  isPlaying: boolean
  currentTrackIndex: number
  listenerX: number
  listenerZ: number
  listenerAngle: number
  speakerAPos: SpeakerPosition
  speakerBPos: SpeakerPosition
  ambientLevel: number
  dialogLevel: number
  /** true while a dialog track is being fetched/decoded */
  isLoadingTrack: boolean
}

export interface TrackQueueItem {
  speaker: "A" | "B"
  /** Milliseconds — used as fallback duration when the real file is unavailable */
  durationMs: number
  label: string
  /** Filename relative to the interview folder, e.g. "01_A_opening.wav" */
  filename: string
}

type StateCallback = (state: Partial<AudioEngineState>) => void

export class AudioEngine {
  // ── Web Audio nodes ────────────────────────────────────────────────────────
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private ambientGain: GainNode | null = null
  private dialogGain: GainNode | null = null
  private pannerA: PannerNode | null = null
  private pannerB: PannerNode | null = null

  // ── Active sources ─────────────────────────────────────────────────────────
  private ambientSource: AudioBufferSourceNode | null = null
  private dialogSource: AudioBufferSourceNode | null = null
  /** Fallback oscillators used when real ambient file is missing */
  private ambientOscillators: OscillatorNode[] = []
  private ambientNoiseSource: AudioBufferSourceNode | null = null

  // ── Playback state ─────────────────────────────────────────────────────────
  private isPlaying = false
  private currentTrackIndex = -1
  private trackQueue: TrackQueueItem[] = []
  private trackTimer: ReturnType<typeof setTimeout> | null = null
  public currentInterviewId: string | null = null

  // ── Cache ──────────────────────────────────────────────────────────────────
  /** Decoded buffers keyed by URL */
  private bufferCache: Map<string, AudioBuffer> = new Map()
  /** In-flight fetch promises keyed by URL (prevents duplicate requests) */
  private pendingFetch: Map<string, Promise<AudioBuffer | null>> = new Map()

  // ── Spatial state ──────────────────────────────────────────────────────────
  private speakerAPos: SpeakerPosition = { x: -3, y: 0, z: -3 }
  private speakerBPos: SpeakerPosition = { x: 3, y: 0, z: -3 }
  private listenerX = 0
  private listenerZ = 4
  private listenerAngle = 0

  // ── Gain values ────────────────────────────────────────────────────────────
  private ambientLevelValue = 0.25
  private dialogLevelValue = 0.7

  private onStateChange: StateCallback

  constructor(onStateChange: StateCallback) {
    this.onStateChange = onStateChange
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Init
  // ═══════════════════════════════════════════════════════════════════════════

  async init(): Promise<void> {
    if (this.ctx) return

    this.ctx = new AudioContext({ sampleRate: 48000 })

    // Master gain
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.8
    this.masterGain.connect(this.ctx.destination)

    // Compressor — safety net for dynamic content
    const compressor = this.ctx.createDynamicsCompressor()
    compressor.threshold.value = -6
    compressor.knee.value = 10
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    compressor.connect(this.masterGain)

    // Ambient bus
    this.ambientGain = this.ctx.createGain()
    this.ambientGain.gain.value = this.ambientLevelValue
    this.ambientGain.connect(compressor)

    // Dialog bus
    this.dialogGain = this.ctx.createGain()
    this.dialogGain.gain.value = this.dialogLevelValue
    this.dialogGain.connect(compressor)

    // HRTF panners
    this.pannerA = this.makePanner(this.speakerAPos)
    this.pannerA.connect(this.dialogGain)

    this.pannerB = this.makePanner(this.speakerBPos)
    this.pannerB.connect(this.dialogGain)

    this.updateListenerPosition(
      this.listenerX,
      this.listenerZ,
      this.listenerAngle,
    )

    if (this.ctx.state === "suspended") {
      await this.ctx.resume()
    }
  }

  private makePanner(pos: SpeakerPosition): PannerNode {
    const p = this.ctx!.createPanner()
    p.panningModel = "HRTF"
    p.distanceModel = "inverse"
    p.refDistance = 1
    p.maxDistance = 50
    p.rolloffFactor = 1.5
    p.coneInnerAngle = 360
    p.coneOuterAngle = 360
    p.setPosition(pos.x, pos.y, pos.z)
    return p
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // File loading
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns the public base URL for a given interview, e.g.
   *   /wywiady/assets/interviews/interview_1/
   *
   * Vite exposes import.meta.env.BASE_URL (trailing slash included), so we
   * don't hard-code "/wywiady/".
   */
  private interviewBasePath(interviewId: string): string {
    const base = import.meta.env.BASE_URL ?? "/"
    return `${base}assets/interviews/${interviewId}/`
  }

  /**
   * Fetches and decodes an audio file, with caching and deduplication.
   * Returns null on any error (network, CORS, unsupported codec, etc.).
   */
  private async fetchBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null

    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!
    }

    if (this.pendingFetch.has(url)) {
      return this.pendingFetch.get(url)!
    }

    const promise = (async (): Promise<AudioBuffer | null> => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`[AudioEngine] HTTP ${response.status} for ${url}`)
          return null
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer)
        this.bufferCache.set(url, audioBuffer)
        return audioBuffer
      } catch (err) {
        console.warn(`[AudioEngine] Failed to load: ${url}`, err)
        return null
      } finally {
        this.pendingFetch.delete(url)
      }
    })()

    this.pendingFetch.set(url, promise)
    return promise
  }

  /**
   * Preloads the first N dialog tracks in the background.
   * Call after loadInterview to hide network latency for the first click.
   */
  private preloadTracks(
    interviewId: string,
    tracks: TrackQueueItem[],
    count = 3,
  ): void {
    const base = this.interviewBasePath(interviewId)
    tracks.slice(0, count).forEach((t) => {
      if (t.filename) this.fetchBuffer(base + t.filename)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Listener & speaker positioning
  // ═══════════════════════════════════════════════════════════════════════════

  updateListenerPosition(x: number, z: number, angle: number): void {
    this.listenerX = x
    this.listenerZ = z
    this.listenerAngle = angle

    if (!this.ctx) return

    const listener = this.ctx.listener
    const fx = Math.sin(angle)
    const fz = -Math.cos(angle)

    if (listener.positionX !== undefined) {
      listener.positionX.value = x
      listener.positionY.value = 1.7
      listener.positionZ.value = z
      listener.forwardX.value = fx
      listener.forwardY.value = 0
      listener.forwardZ.value = fz
      listener.upX.value = 0
      listener.upY.value = 1
      listener.upZ.value = 0
    } else {
      // Safari ≤ 14 fallback
      listener.setPosition(x, 1.7, z)
      listener.setOrientation(fx, 0, fz, 0, 1, 0)
    }

    this.onStateChange({ listenerX: x, listenerZ: z, listenerAngle: angle })
  }

  setSpeakerPositions(a: SpeakerPosition, b: SpeakerPosition): void {
    this.speakerAPos = a
    this.speakerBPos = b
    this.pannerA?.setPosition(a.x, a.y, a.z)
    this.pannerB?.setPosition(b.x, b.y, b.z)
    this.onStateChange({ speakerAPos: a, speakerBPos: b })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Ambient
  // ═══════════════════════════════════════════════════════════════════════════

  private async startAmbient(
    interviewId: string,
    interviewIndex: number,
  ): Promise<void> {
    if (!this.ctx || !this.ambientGain) return
    this.stopAmbient()

    const url = this.interviewBasePath(interviewId) + "ambient.wav"
    const buffer = await this.fetchBuffer(url)

    if (buffer) {
      // Real ambient file — loop it
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.connect(this.ambientGain)
      src.start()
      this.ambientSource = src
    } else {
      // Fallback: synthesise ambient soundscape
      console.info(
        "[AudioEngine] ambient.wav not found — using synthesis fallback",
      )
      this.startAmbientSynthesis(interviewIndex)
    }
  }

  private stopAmbient(): void {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop()
      } catch {
        /* already stopped */
      }
      this.ambientSource = null
    }
    this.ambientOscillators.forEach((o) => {
      try {
        o.stop()
      } catch {
        /* */
      }
    })
    this.ambientOscillators = []
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop()
      } catch {
        /* */
      }
      this.ambientNoiseSource = null
    }
  }

  // ── Synthesis fallback ─────────────────────────────────────────────────────

  private startAmbientSynthesis(interviewIndex: number): void {
    if (!this.ctx || !this.ambientGain) return

    const themeFreqs = [
      [60, 120, 180, 440], // Urban
      [220, 330, 880, 1200], // Forest
      [80, 160, 300, 500], // Harbor
      [100, 200, 400, 600], // Metro
      [130, 260, 520, 780], // Cathedral
    ]
    const freqs = themeFreqs[interviewIndex % themeFreqs.length]

    // Brown noise base
    const noiseBuf = this.createNoiseBuffer(10, "brown")
    const noiseSrc = this.ctx.createBufferSource()
    noiseSrc.buffer = noiseBuf
    noiseSrc.loop = true
    const noiseGain = this.ctx.createGain()
    noiseGain.gain.value = 0.3
    noiseSrc.connect(noiseGain)
    noiseGain.connect(this.ambientGain)
    noiseSrc.start()
    this.ambientNoiseSource = noiseSrc

    // Tonal drones
    freqs.forEach((freq) => {
      if (!this.ctx || !this.ambientGain) return
      const osc = this.ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = freq
      const oscGain = this.ctx.createGain()
      oscGain.gain.value = 0.02
      const lfo = this.ctx.createOscillator()
      lfo.frequency.value = 0.1 + Math.random() * 0.3
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.value = 0.01
      lfo.connect(lfoGain)
      lfoGain.connect(oscGain.gain)
      lfo.start()
      osc.connect(oscGain)
      oscGain.connect(this.ambientGain)
      osc.start()
      this.ambientOscillators.push(osc, lfo)
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Dialog track playback
  // ═══════════════════════════════════════════════════════════════════════════

  private stopCurrentDialog(): void {
    if (this.trackTimer) {
      clearTimeout(this.trackTimer)
      this.trackTimer = null
    }
    if (this.dialogSource) {
      try {
        this.dialogSource.stop()
      } catch {
        /* */
      }
      this.dialogSource = null
    }
  }

  private async playTrackAsync(index: number): Promise<void> {
    if (!this.ctx || index >= this.trackQueue.length) {
      // End of queue
      this.isPlaying = false
      this.currentTrackIndex = -1
      this.onStateChange({ isPlaying: false, currentTrackIndex: -1 })
      return
    }

    this.stopCurrentDialog()
    this.currentTrackIndex = index
    const track = this.trackQueue[index]
    const panner = track.speaker === "A" ? this.pannerA : this.pannerB
    if (!panner) return

    // Announce the new track immediately so UI updates
    this.onStateChange({
      isPlaying: true,
      currentTrackIndex: index,
      isLoadingTrack: true,
    })

    // Try to load real file
    let buffer: AudioBuffer | null = null
    if (this.currentInterviewId && track.filename) {
      const url =
        this.interviewBasePath(this.currentInterviewId) + track.filename
      buffer = await this.fetchBuffer(url)
    }

    // Guard: user may have called stop() while we were fetching
    if (!this.isPlaying || this.currentTrackIndex !== index) return

    if (!buffer) {
      // Synthesis fallback
      console.info(
        `[AudioEngine] ${track.filename} not found — using synthesis fallback`,
      )
      const baseFreq = track.speaker === "A" ? 150 : 110
      buffer = this.createToneBuffer(baseFreq, track.durationMs / 1000)
    }

    this.onStateChange({ isLoadingTrack: false })

    this.dialogSource = this.ctx.createBufferSource()
    this.dialogSource.buffer = buffer
    this.dialogSource.connect(panner)
    this.dialogSource.start()

    const durationMs = buffer.duration * 1000

    // Preload the next track in background while this one plays
    if (this.currentInterviewId && index + 1 < this.trackQueue.length) {
      const next = this.trackQueue[index + 1]
      if (next.filename) {
        this.fetchBuffer(
          this.interviewBasePath(this.currentInterviewId) + next.filename,
        )
      }
    }

    this.trackTimer = setTimeout(() => {
      if (this.isPlaying && this.currentTrackIndex === index) {
        this.playTrackAsync(index + 1)
      }
    }, durationMs)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════════

  async loadInterview(
    interviewId: string,
    tracks: TrackQueueItem[],
    interviewIndex: number,
  ): Promise<void> {
    await this.init()
    this.stop()

    this.currentInterviewId = interviewId
    this.trackQueue = tracks
    this.currentTrackIndex = -1

    this.updateListenerPosition(0, 4, 0)

    // Start ambient (async — fires and returns, UI is not blocked)
    this.startAmbient(interviewId, interviewIndex)

    // Preload first few dialog tracks in background
    this.preloadTracks(interviewId, tracks, 3)

    this.onStateChange({
      isPlaying: false,
      currentTrackIndex: -1,
      isLoadingTrack: false,
    })
  }

  play(): void {
    if (!this.ctx) return
    if (this.ctx.state === "suspended") this.ctx.resume()
    this.isPlaying = true
    const startIndex = this.currentTrackIndex < 0 ? 0 : this.currentTrackIndex
    this.playTrackAsync(startIndex)
  }

  pause(): void {
    this.isPlaying = false
    this.stopCurrentDialog()
    this.onStateChange({ isPlaying: false })
  }

  stop(): void {
    this.isPlaying = false
    this.currentTrackIndex = -1
    this.stopCurrentDialog()
    this.stopAmbient()
    this.onStateChange({ isPlaying: false, currentTrackIndex: -1 })
  }

  skipTo(index: number): void {
    if (index < 0 || index >= this.trackQueue.length) return
    this.isPlaying = true
    this.playTrackAsync(index)
  }

  skipNext(): void {
    if (this.currentTrackIndex < this.trackQueue.length - 1) {
      this.skipTo(this.currentTrackIndex + 1)
    }
  }

  skipPrev(): void {
    if (this.currentTrackIndex > 0) {
      this.skipTo(this.currentTrackIndex - 1)
    }
  }

  setAmbientLevel(val: number): void {
    this.ambientLevelValue = val
    if (this.ambientGain) this.ambientGain.gain.value = val
    this.onStateChange({ ambientLevel: val })
  }

  setDialogLevel(val: number): void {
    this.dialogLevelValue = val
    if (this.dialogGain) this.dialogGain.gain.value = val
    this.onStateChange({ dialogLevel: val })
  }

  getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTrackIndex: this.currentTrackIndex,
      listenerX: this.listenerX,
      listenerZ: this.listenerZ,
      listenerAngle: this.listenerAngle,
      speakerAPos: this.speakerAPos,
      speakerBPos: this.speakerBPos,
      ambientLevel: this.ambientLevelValue,
      dialogLevel: this.dialogLevelValue,
      isLoadingTrack: false,
    }
  }

  destroy(): void {
    this.stop()
    this.bufferCache.clear()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Synthesis helpers (fallback only)
  // ═══════════════════════════════════════════════════════════════════════════

  private createNoiseBuffer(
    durationSec: number,
    color: "white" | "pink" | "brown" = "brown",
  ): AudioBuffer {
    if (!this.ctx) throw new Error("No AudioContext")
    const sr = this.ctx.sampleRate
    const buf = this.ctx.createBuffer(1, sr * durationSec, sr)
    const d = buf.getChannelData(0)
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      if (color === "white") {
        d[i] = w * 0.2
      } else if (color === "pink") {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.04
        b6 = w * 0.115926
      } else {
        b0 = (b0 + 0.02 * w) / 1.02
        d[i] = b0 * 3.5
      }
    }
    return buf
  }

  private createToneBuffer(freq: number, durationSec: number): AudioBuffer {
    if (!this.ctx) throw new Error("No AudioContext")
    const sr = this.ctx.sampleRate
    const buf = this.ctx.createBuffer(1, sr * durationSec, sr)
    const d = buf.getChannelData(0)
    const f1 = freq * 3.2
    const f2 = freq * 5.5
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const amp =
        0.5 +
        0.5 *
          Math.sin(2 * Math.PI * 3.5 * t + Math.sin(2 * Math.PI * 0.7 * t) * 2)
      const pm = 1 + 0.05 * Math.sin(2 * Math.PI * 1.3 * t)
      const s =
        Math.sin(2 * Math.PI * freq * pm * t) * 0.4 +
        Math.sin(2 * Math.PI * f1 * pm * t) * 0.2 +
        Math.sin(2 * Math.PI * f2 * pm * t) * 0.1 +
        (Math.random() * 2 - 1) * 0.08
      const fadeIn = Math.min(1, t / 0.3)
      const fadeOut = Math.min(1, (durationSec - t) / 0.5)
      d[i] = s * amp * fadeIn * fadeOut * 0.5
    }
    return buf
  }
}
