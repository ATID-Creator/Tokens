import type {
  GameEvent,
  GameState,
  Nation,
  NationId,
  DiplomaticAction,
} from '../types';
import { INITIAL_NATIONS } from '../data/nations';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createInitialState(): GameState {
  const nations = structuredClone(INITIAL_NATIONS);
  const totalTrade = Object.values(nations)
    .filter((n) => !n.isPlayer)
    .reduce((sum, n) => sum + n.tradeVolume, 0);

  return {
    year: 2024,
    quarter: 1,
    nations,
    tradeRoutes: [],
    events: [
      {
        id: 'init',
        turn: 0,
        message: 'アジア貿易・外交シミュレーションを開始しました。日本を率いてアジア各国との関係を築きましょう。',
        type: 'info',
      },
    ],
    japanResources: {
      budget: 500,
      influence: 100,
      gdp: nations.japan.gdp,
      tradeBalance: totalTrade,
    },
    selectedNation: null,
    isPaused: false,
    totalTurns: 0,
  };
}

function addEvent(
  state: GameState,
  message: string,
  type: GameEvent['type'] = 'info',
): GameEvent {
  const event: GameEvent = {
    id: `${state.totalTurns}-${Date.now()}`,
    turn: state.totalTurns,
    message,
    type,
  };
  state.events = [event, ...state.events].slice(0, 50);
  return event;
}

function relationLabel(relation: number): string {
  if (relation >= 80) return '同盟的';
  if (relation >= 60) return '友好';
  if (relation >= 40) return '中立';
  if (relation >= 20) return '緊張';
  return '敵対的';
}

const RANDOM_EVENTS: Array<{
  message: (nation: Nation) => string;
  relationDelta: number;
  tradeDelta: number;
  type: GameEvent['type'];
  chance: number;
}> = [
  {
    message: (n) => `${n.nameJa}で経済成長が加速。貿易機会が拡大しました。`,
    relationDelta: 3,
    tradeDelta: 8,
    type: 'success',
    chance: 0.15,
  },
  {
    message: (n) => `${n.nameJa}で領土・海洋権問題が激化。外交関係が悪化しました。`,
    relationDelta: -8,
    tradeDelta: -5,
    type: 'warning',
    chance: 0.08,
  },
  {
    message: (n) => `${n.nameJa}で自然災害が発生。人道支援の機会が生まれました。`,
    relationDelta: 5,
    tradeDelta: -2,
    type: 'warning',
    chance: 0.06,
  },
  {
    message: (n) => `${n.nameJa}との文化交流イベントが大成功しました。`,
    relationDelta: 6,
    tradeDelta: 3,
    type: 'success',
    chance: 0.12,
  },
  {
    message: (n) => `${n.nameJa}で政権交代。外交方針の見直しが必要です。`,
    relationDelta: -5,
    tradeDelta: -3,
    type: 'info',
    chance: 0.05,
  },
  {
    message: (n) => `${n.nameJa}が新たな貿易ルートの開拓を提案しました。`,
    relationDelta: 4,
    tradeDelta: 10,
    type: 'success',
    chance: 0.1,
  },
];

export class SimulationEngine {
  private state: GameState;

  constructor() {
    this.state = createInitialState();
  }

  getState(): GameState {
    return structuredClone(this.state);
  }

  selectNation(nationId: NationId | null): GameState {
    this.state.selectedNation = nationId;
    return this.getState();
  }

  executeAction(action: DiplomaticAction, targetId: NationId): GameState {
    const nation = this.state.nations[targetId];
    if (!nation || nation.isPlayer) return this.getState();

    if (this.state.japanResources.budget < action.cost) {
      addEvent(this.state, '予算が不足しています。', 'danger');
      return this.getState();
    }
    if (this.state.japanResources.influence < action.influenceCost) {
      addEvent(this.state, '外交影響力が不足しています。', 'danger');
      return this.getState();
    }

    this.state.japanResources.budget -= action.cost;
    this.state.japanResources.influence -= action.influenceCost;

    nation.relation = clamp(nation.relation + action.relationChange, 0, 100);
    nation.tradeVolume = Math.max(0, nation.tradeVolume + action.tradeChange);

    if (action.type === 'trade_deal') {
      nation.tariffRate = Math.max(0, nation.tariffRate - 2.5);
    }
    if (action.type === 'sanction') {
      nation.tariffRate = Math.min(25, nation.tariffRate + 5);
    }

    const eventType = action.relationChange >= 0 ? 'success' : 'warning';
    addEvent(
      this.state,
      `${nation.nameJa}に「${action.label}」を実施。関係: ${relationLabel(nation.relation)} (${nation.relation})`,
      eventType,
    );

    this.recalculateTradeBalance();
    return this.getState();
  }

  advanceTurn(): GameState {
    this.state.quarter += 1;
    this.state.totalTurns += 1;
    if (this.state.quarter > 4) {
      this.state.quarter = 1;
      this.state.year += 1;
    }

    this.state.japanResources.budget += 30;
    this.state.japanResources.influence = clamp(
      this.state.japanResources.influence + 5,
      0,
      150,
    );

    const foreignNations = Object.values(this.state.nations).filter(
      (n) => !n.isPlayer,
    );

    for (const nation of foreignNations) {
      const relationFactor = nation.relation / 100;
      const growthRate = 0.02 + relationFactor * 0.03;
      nation.tradeVolume *= 1 + growthRate * 0.25;

      if (nation.relation > 50) {
        nation.relation = clamp(nation.relation - 1 + Math.random() * 2, 0, 100);
      } else {
        nation.relation = clamp(nation.relation - 2 + Math.random() * 3, 0, 100);
      }

      for (const evt of RANDOM_EVENTS) {
        if (Math.random() < evt.chance) {
          nation.relation = clamp(nation.relation + evt.relationDelta, 0, 100);
          nation.tradeVolume = Math.max(0, nation.tradeVolume + evt.tradeDelta);
          addEvent(this.state, evt.message(nation), evt.type);
          break;
        }
      }
    }

    const totalTrade = foreignNations.reduce((s, n) => s + n.tradeVolume, 0);
    const gdpGrowth = totalTrade * 0.001;
    this.state.japanResources.gdp += gdpGrowth;
    this.state.japanResources.tradeBalance = totalTrade;

    addEvent(
      this.state,
      `${this.state.year}年 Q${this.state.quarter} — 四半期が経過しました。総貿易額: $${totalTrade.toFixed(0)}B`,
      'info',
    );

    return this.getState();
  }

  reset(): GameState {
    this.state = createInitialState();
    return this.getState();
  }

  private recalculateTradeBalance(): void {
    const totalTrade = Object.values(this.state.nations)
      .filter((n) => !n.isPlayer)
      .reduce((sum, n) => sum + n.tradeVolume, 0);
    this.state.japanResources.tradeBalance = totalTrade;
  }
}

export { relationLabel };
