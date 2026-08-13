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
        flex flex-col bg-[var(--bg2)] border-r border-[var(--border)]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        {!isCollapsed && (
          <div>
            <h1 className="font-['Lexend'] text-sm font-bold text-[var(--cream)] tracking-wider uppercase">
              Ambisonic
            </h1>
            <p className="font-['Azeret_Mono'] text-[10px] text-[var(--dim)] tracking-widest uppercase">
              Reportage v2.0
            </p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center bg-[var(--bg2)] border border-[var(--border2)] hover:border-[var(--cyan)] text-[var(--dim)] hover:text-[var(--cream)] transition-all"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Interview List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!isCollapsed && (
          <div className="font-['Azeret_Mono'] px-2 py-2 text-[10px] text-[var(--dim)] uppercase tracking-widest font-semibold">
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
                w-full transition-all duration-200
                ${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3 text-left'}
                ${isActive
                  ? 'bg-[var(--black)] shadow-lg'
                  : 'bg-transparent hover:bg-[rgba(240,235,224,0.05)]'
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
                    <span className="font-['Lexend'] text-sm font-semibold text-[var(--cream)]">
                      {interview.title}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: interview.color }} />
                    )}
                  </div>
                  <div className="text-xs text-[var(--dim)] mt-0.5">
                    {interview.subtitle}
                  </div>
                  <div className="font-['Azeret_Mono'] flex items-center gap-2 mt-1.5 text-[10px] text-[var(--dim)] opacity-70">
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
        <div className="p-4 border-t border-[var(--border)]">
          <div className="font-['Azeret_Mono'] text-[10px] text-[var(--dim)] opacity-60 text-center">
            Web Audio API · HRTF · Canvas 2D
          </div>
        </div>
      )}
    </div>
  );
}
