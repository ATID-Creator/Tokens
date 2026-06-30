import { useGame } from '../context/GameContext';

const TYPE_STYLES = {
  info: 'border-l-blue-500 bg-blue-950/30',
  success: 'border-l-green-500 bg-green-950/30',
  warning: 'border-l-yellow-500 bg-yellow-950/30',
  danger: 'border-l-red-500 bg-red-950/30',
};

const TYPE_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '🚫',
};

export function EventLog() {
  const { state } = useGame();

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">イベントログ</h3>
      <div className="flex-1 overflow-y-auto space-y-2 max-h-64 lg:max-h-none">
        {state.events.length === 0 ? (
          <p className="text-xs text-slate-500">イベントはありません</p>
        ) : (
          state.events.map((event) => (
            <div
              key={event.id}
              className={`border-l-2 pl-3 py-1.5 rounded-r ${TYPE_STYLES[event.type]}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs">{TYPE_ICONS[event.type]}</span>
                <div>
                  <p className="text-xs text-slate-200 leading-relaxed">{event.message}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ターン {event.turn}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
