interface TransportControlsProps {
  isPlaying: boolean;
  hasInterview: boolean;
  ambientLevel: number;
  dialogLevel: number;
  accentColor: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipPrev: () => void;
  onSkipNext: () => void;
  onAmbientLevelChange: (v: number) => void;
  onDialogLevelChange: (v: number) => void;
}

export function TransportControls({
  isPlaying,
  hasInterview,
  ambientLevel,
  dialogLevel,
  accentColor,
  onPlay,
  onPause,
  onStop,
  onSkipPrev,
  onSkipNext,
  onAmbientLevelChange,
  onDialogLevelChange,
}: TransportControlsProps) {
  return (
    <div className="bg-[#0d0d1a] border-t border-white/5 px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Transport buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1" />
            </svg>
          </button>

          <button
            onClick={onSkipPrev}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Previous"
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
              <rect x="1" y="1" width="2" height="12" rx="0.5" />
              <path d="M14 1L6 7L14 13V1Z" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasInterview}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all shadow-lg disabled:opacity-20"
            style={{
              backgroundColor: hasInterview ? accentColor : '#333',
              boxShadow: hasInterview ? `0 4px 20px ${accentColor}40` : 'none',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <rect x="3" y="2" width="4" height="14" rx="1" />
                <rect x="11" y="2" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <path d="M4 2L16 9L4 16V2Z" />
              </svg>
            )}
          </button>

          <button
            onClick={onSkipNext}
            disabled={!hasInterview}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Next"
          >
            <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
              <path d="M2 1L10 7L2 13V1Z" />
              <rect x="13" y="1" width="2" height="12" rx="0.5" />
            </svg>
          </button>
        </div>

        {/* Gain staging controls */}
        <div className="flex items-center gap-6 flex-1 max-w-lg">
          {/* Ambient level */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-purple-300/50 uppercase tracking-wider whitespace-nowrap">
              🌐 Amb
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientLevel}
              onChange={(e) => onAmbientLevelChange(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-white/10 accent-purple-400"
              style={{ accentColor: '#a855f7' }}
            />
            <span className="text-[10px] text-white/20 font-mono w-8 text-right">
              {Math.round(ambientLevel * 100)}%
            </span>
          </div>

          {/* Dialog level */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-amber-300/50 uppercase tracking-wider whitespace-nowrap">
              🎙 Dlg
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={dialogLevel}
              onChange={(e) => onDialogLevelChange(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none rounded-full bg-white/10 accent-amber-400"
              style={{ accentColor: '#fbbf24' }}
            />
            <span className="text-[10px] text-white/20 font-mono w-8 text-right">
              {Math.round(dialogLevel * 100)}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Live</span>
            </div>
          )}
          <div className="text-[10px] text-white/10 font-mono">
            48kHz · HRTF
          </div>
        </div>
      </div>
    </div>
  );
}
