import { interviews, type Interview } from '../data/interviews';

interface SidebarProps {
  selectedId: string | null;
  onSelect: (interview: Interview) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ selectedId, onSelect, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div
      className={`
        flex flex-col bg-[#0d0d1a] border-r border-white/5
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!isCollapsed && (
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase">
              Ambisonic
            </h1>
            <p className="text-[10px] text-white/30 tracking-widest uppercase">
              Reportage v2.0
            </p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Interview List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!isCollapsed && (
          <div className="px-2 py-2 text-[10px] text-white/20 uppercase tracking-widest font-semibold">
            Interviews
          </div>
        )}
        {interviews.map((interview, index) => {
          const isActive = selectedId === interview.id;
          return (
            <button
              key={interview.id}
              onClick={() => onSelect(interview)}
              className={`
                w-full rounded-xl transition-all duration-200
                ${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3 text-left'}
                ${isActive
                  ? 'bg-white/10 shadow-lg'
                  : 'bg-transparent hover:bg-white/5'
                }
              `}
              style={isActive ? { borderLeft: `3px solid ${interview.color}` } : {}}
              title={interview.title}
            >
              <div className={`text-xl ${isCollapsed ? '' : 'mb-1'}`}>
                {interview.icon}
              </div>
              {!isCollapsed && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/90">
                      {interview.title}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: interview.color }} />
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {interview.subtitle}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/25">
                    <span>#{index + 1}</span>
                    <span>•</span>
                    <span>{interview.location}</span>
                    <span>•</span>
                    <span>{interview.tracks.length} segments</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="text-[10px] text-white/15 text-center">
            Web Audio API · HRTF · Canvas 2D
          </div>
        </div>
      )}
    </div>
  );
}
