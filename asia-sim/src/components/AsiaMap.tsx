import type { Nation, NationId } from '../types';
import { useGame } from '../context/GameContext';
import { relationLabel } from '../engine/simulation';

interface AsiaMapProps {
  nations: Record<NationId, Nation>;
}

export function AsiaMap({ nations }: AsiaMapProps) {
  const { state, selectNation } = useGame();
  const foreignNations = Object.values(nations).filter((n) => !n.isPlayer);

  return (
    <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <svg viewBox="0 0 900 600" className="w-full h-full">
        <defs>
          <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="900" height="600" fill="url(#ocean)" />

        {/* Simplified Asia landmass */}
        <path
          d="M 200 200 L 350 180 L 500 200 L 600 220 L 750 250 L 780 300 L 750 400 L 700 500 L 550 520 L 400 500 L 300 450 L 250 350 L 200 280 Z"
          fill="#1a2e1a"
          opacity="0.4"
          stroke="#2d4a2d"
          strokeWidth="1"
        />
        <path
          d="M 350 150 L 500 140 L 650 160 L 720 200 L 740 280 L 700 350 L 650 400 L 550 420 L 450 400 L 380 350 L 340 280 Z"
          fill="#1a2e1a"
          opacity="0.5"
          stroke="#2d4a2d"
          strokeWidth="1"
        />

        {/* Trade routes from Japan */}
        {foreignNations.map((nation) => {
          const japan = nations.japan;
          const intensity = nation.tradeVolume / 100;
          return (
            <line
              key={`route-${nation.id}`}
              x1={japan.mapX}
              y1={japan.mapY}
              x2={nation.mapX}
              y2={nation.mapY}
              stroke={nation.relation >= 60 ? '#22c55e' : nation.relation >= 40 ? '#eab308' : '#ef4444'}
              strokeWidth={Math.max(0.5, intensity * 3)}
              strokeOpacity={0.3 + intensity * 0.4}
              strokeDasharray={nation.relation < 40 ? '4 4' : undefined}
            />
          );
        })}

        {/* Nation markers */}
        {Object.values(nations).map((nation) => {
          const isSelected = state.selectedNation === nation.id;
          const radius = nation.isPlayer ? 18 : 10 + nation.tradeVolume / 30;

          return (
            <g
              key={nation.id}
              className="cursor-pointer"
              onClick={() => selectNation(nation.id === state.selectedNation ? null : nation.id)}
            >
              {isSelected && (
                <circle
                  cx={nation.mapX}
                  cy={nation.mapY}
                  r={radius + 8}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={nation.mapX}
                cy={nation.mapY}
                r={radius}
                fill={nation.color}
                stroke={isSelected ? '#60a5fa' : '#ffffff44'}
                strokeWidth={isSelected ? 3 : 1.5}
                opacity={nation.isPlayer ? 1 : 0.85}
              />
              <text
                x={nation.mapX}
                y={nation.mapY + radius + 14}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={nation.isPlayer ? 13 : 10}
                fontWeight={nation.isPlayer ? 700 : 500}
              >
                {nation.nameJa}
              </text>
              {!nation.isPlayer && (
                <text
                  x={nation.mapX}
                  y={nation.mapY + radius + 26}
                  textAnchor="middle"
                  fill={
                    nation.relation >= 60
                      ? '#4ade80'
                      : nation.relation >= 40
                        ? '#facc15'
                        : '#f87171'
                  }
                  fontSize={8}
                >
                  {relationLabel(nation.relation)}
                </text>
              )}
            </g>
          );
        })}

        <text x="450" y="30" textAnchor="middle" fill="#64748b" fontSize="12">
          アジア太平洋地域 — 仮想外交マップ
        </text>
      </svg>
    </div>
  );
}
