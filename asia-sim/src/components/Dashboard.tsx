import { useGame } from '../context/GameContext';
import { relationLabel } from '../engine/simulation';

export function Dashboard() {
  const { state } = useGame();
  const { japanResources, year, quarter } = state;

  const stats = [
    { label: '年度', value: `${year}年 Q${quarter}`, icon: '📅' },
    { label: '予算', value: `$${japanResources.budget}B`, icon: '💰' },
    { label: '外交影響力', value: `${japanResources.influence}`, icon: '🌐' },
    { label: 'GDP', value: `$${japanResources.gdp.toFixed(0)}B`, icon: '📊' },
    { label: '総貿易額', value: `$${japanResources.tradeBalance.toFixed(0)}B`, icon: '🚢' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center"
        >
          <div className="text-lg mb-1">{stat.icon}</div>
          <div className="text-xs text-slate-400">{stat.label}</div>
          <div className="text-sm font-semibold text-white mt-0.5">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

export function NationPanel() {
  const { state } = useGame();

  if (!state.selectedNation) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="text-sm">地図上の国をクリックして詳細を表示</p>
      </div>
    );
  }

  const nation = state.nations[state.selectedNation];
  if (!nation) return null;

  if (nation.isPlayer) {
    return (
      <div className="bg-slate-800/80 border border-red-800/50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: nation.color }}
          />
          <h3 className="text-lg font-bold text-white">{nation.nameJa}</h3>
          <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">プレイヤー</span>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="人口" value={`${nation.population}M`} />
          <Row label="GDP" value={`$${nation.gdp}B`} />
          <Row label="主要輸出品" value={nation.resources.join('、')} />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          日本を率いてアジア各国との外交・貿易関係を構築してください。
        </p>
      </div>
    );
  }

  const relationColor =
    nation.relation >= 60 ? 'text-green-400' : nation.relation >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nation.color }} />
        <h3 className="text-lg font-bold text-white">{nation.nameJa}</h3>
        <span className="text-xs text-slate-400">{nation.name}</span>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="人口" value={`${nation.population}M`} />
        <Row label="GDP" value={`$${nation.gdp}B`} />
        <Row label="対日関係" value={`${relationLabel(nation.relation)} (${nation.relation})`} valueClass={relationColor} />
        <Row label="貿易額" value={`$${nation.tradeVolume.toFixed(1)}B`} />
        <Row label="関税率" value={`${nation.tariffRate.toFixed(1)}%`} />
        <Row label="主要資源" value={nation.resources.join('、')} />
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-400 mb-1">対日関係度</div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              nation.relation >= 60 ? 'bg-green-500' : nation.relation >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${nation.relation}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
