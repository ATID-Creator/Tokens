import { useGame } from '../context/GameContext';
import { relationLabel } from '../engine/simulation';

export function TradeOverview() {
  const { state } = useGame();
  const foreignNations = Object.values(state.nations)
    .filter((n) => !n.isPlayer)
    .sort((a, b) => b.tradeVolume - a.tradeVolume);

  const maxTrade = Math.max(...foreignNations.map((n) => n.tradeVolume), 1);

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">貿易パートナー概況</h3>
      <div className="space-y-2">
        {foreignNations.slice(0, 8).map((nation) => (
          <div key={nation.id} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: nation.color }}
            />
            <span className="text-xs text-slate-300 w-16 shrink-0 truncate">{nation.nameJa}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${(nation.tradeVolume / maxTrade) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-14 text-right shrink-0">
              ${nation.tradeVolume.toFixed(0)}B
            </span>
            <span
              className={`text-[10px] w-12 text-right shrink-0 ${
                nation.relation >= 60
                  ? 'text-green-400'
                  : nation.relation >= 40
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {relationLabel(nation.relation)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
