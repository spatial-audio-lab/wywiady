import type { TrackItem, Interview } from '../data/interviews';

interface PlaylistProps {
  interview: Interview;
  currentTrackIndex: number;
  onSkipTo: (index: number) => void;
}

export function Playlist({ interview, currentTrackIndex, onSkipTo }: PlaylistProps) {
  const totalDuration = interview.tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return (
    <div className="h-full flex flex-col bg-[#0a0a18]/90 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{interview.icon}</span>
          <div>
            <h2 className="text-sm font-bold text-white">{interview.title}</h2>
            <p className="text-[10px] text-white/30">{interview.location} · {interview.date}</p>
          </div>
        </div>

        {/* Speakers info */}
        <div className="flex gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 bg-red-500/10 rounded-lg px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-300/80">A: {interview.speakerA.name}</span>
            <span className="text-red-300/30">({interview.speakerA.role})</span>
          </div>
          <div className="flex items-center gap-1.5 bg-teal-500/10 rounded-lg px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-teal-300/80">B: {interview.speakerB.name}</span>
            <span className="text-teal-300/30">({interview.speakerB.role})</span>
          </div>
        </div>

        {/* Ambient indicator */}
        <div className="mt-2 flex items-center gap-2 bg-white/3 rounded-lg px-2 py-1.5 text-[10px]">
          <span className="text-purple-400">🌐 FOA Ambient:</span>
          <span className="text-white/30 italic">{interview.ambientDescription}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex items-center justify-between text-[10px] text-white/20 mb-1">
          <span>Track {Math.max(0, currentTrackIndex + 1)} / {interview.tracks.length}</span>
          <span>{formatMs(totalDuration)} total</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${currentTrackIndex >= 0 ? ((currentTrackIndex + 1) / interview.tracks.length) * 100 : 0}%`,
              backgroundColor: interview.color,
            }}
          />
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {interview.tracks.map((track: TrackItem, index: number) => {
          const isCurrent = index === currentTrackIndex;
          const isPast = index < currentTrackIndex;
          const isSpeakerA = track.speaker === 'A';

          return (
            <button
              key={track.id}
              onClick={() => onSkipTo(index)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200
                border-b border-white/[0.02]
                ${isCurrent
                  ? 'bg-white/8'
                  : isPast
                    ? 'bg-white/[0.01] opacity-50'
                    : 'hover:bg-white/5'
                }
              `}
            >
              {/* Order number / playing indicator */}
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                ${isCurrent
                  ? isSpeakerA ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'
                  : 'bg-white/5 text-white/20'
                }
              `}>
                {isCurrent ? (
                  <span className="flex gap-0.5">
                    <span className="w-0.5 h-3 rounded-full animate-pulse" style={{ backgroundColor: isSpeakerA ? '#f87171' : '#2dd4bf', animationDelay: '0ms' }} />
                    <span className="w-0.5 h-2 rounded-full animate-pulse" style={{ backgroundColor: isSpeakerA ? '#f87171' : '#2dd4bf', animationDelay: '150ms' }} />
                    <span className="w-0.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: isSpeakerA ? '#f87171' : '#2dd4bf', animationDelay: '300ms' }} />
                  </span>
                ) : (
                  <span>{track.order.toString().padStart(2, '0')}</span>
                )}
              </div>

              {/* Speaker badge */}
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0
                ${isSpeakerA ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'}
              `}>
                {track.speaker}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs truncate ${isCurrent ? 'text-white font-semibold' : 'text-white/50'}`}>
                  {track.label}
                </div>
                <div className="text-[10px] text-white/15 mt-0.5">
                  {track.filename}
                </div>
              </div>

              {/* Duration */}
              <div className={`text-[10px] font-mono shrink-0 ${isCurrent ? 'text-white/60' : 'text-white/15'}`}>
                {formatMs(track.durationMs)}
              </div>

              {/* Spatial indicator */}
              <div className="w-12 shrink-0">
                <div className="flex items-center gap-0.5">
                  <div className={`h-1 flex-1 rounded-full ${isSpeakerA ? 'bg-red-400/40' : 'bg-white/5'}`} />
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className={`h-1 flex-1 rounded-full ${!isSpeakerA ? 'bg-teal-400/40' : 'bg-white/5'}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
