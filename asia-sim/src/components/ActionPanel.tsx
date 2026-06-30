import { useGame } from '../context/GameContext';
import { DIPLOMATIC_ACTIONS } from '../data/actions';

export function ActionPanel() {
  const { state, executeAction } = useGame();
  const target = state.selectedNation ? state.nations[state.selectedNation] : null;

  if (!target || target.isPlayer) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">外交アクション</h3>
        <p className="text-xs text-slate-500">対象国を選択してアクションを実行</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        {target.nameJa} への外交アクション
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DIPLOMATIC_ACTIONS.map((action) => {
          const canAfford =
            state.japanResources.budget >= action.cost &&
            state.japanResources.influence >= action.influenceCost;

          return (
            <button
              key={action.type}
              onClick={() => executeAction(action, target.id)}
              disabled={!canAfford}
              className={`text-left p-3 rounded-lg border transition-all ${
                canAfford
                  ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700/50 cursor-pointer'
                  : 'border-slate-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-white">{action.label}</span>
                <span className="text-xs text-slate-400">${action.cost}B</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{action.description}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className={action.relationChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                  関係 {action.relationChange >= 0 ? '+' : ''}{action.relationChange}
                </span>
                <span className={action.tradeChange >= 0 ? 'text-blue-400' : 'text-orange-400'}>
                  貿易 {action.tradeChange >= 0 ? '+' : ''}{action.tradeChange}
                </span>
                <span className="text-purple-400">影響力 -{action.influenceCost}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ControlPanel() {
  const { advanceTurn, reset, state } = useGame();

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-800/80 border border-slate-700 rounded-xl p-4">
      <div className="text-sm text-slate-400">
        ターン <span className="text-white font-semibold">{state.totalTurns}</span>
        <span className="mx-2">|</span>
        {state.year}年 第{state.quarter}四半期
      </div>
      <div className="flex gap-2">
        <button
          onClick={advanceTurn}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          四半期を進める →
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
}
