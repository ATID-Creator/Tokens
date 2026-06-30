export type NationId =
  | 'japan'
  | 'china'
  | 'south_korea'
  | 'taiwan'
  | 'india'
  | 'indonesia'
  | 'vietnam'
  | 'thailand'
  | 'philippines'
  | 'malaysia'
  | 'singapore'
  | 'australia'
  | 'north_korea'
  | 'myanmar'
  | 'bangladesh'
  | 'pakistan';

export interface Nation {
  id: NationId;
  name: string;
  nameJa: string;
  population: number;
  gdp: number;
  relation: number;
  tradeVolume: number;
  tariffRate: number;
  mapX: number;
  mapY: number;
  color: string;
  resources: string[];
  isPlayer: boolean;
}

export type DiplomaticActionType =
  | 'summit'
  | 'trade_deal'
  | 'aid'
  | 'sanction'
  | 'cultural_exchange'
  | 'military_coop';

export interface DiplomaticAction {
  type: DiplomaticActionType;
  label: string;
  description: string;
  cost: number;
  relationChange: number;
  tradeChange: number;
  influenceCost: number;
}

export interface TradeRoute {
  from: NationId;
  to: NationId;
  volume: number;
  tariff: number;
}

export interface GameEvent {
  id: string;
  turn: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface JapanResources {
  budget: number;
  influence: number;
  gdp: number;
  tradeBalance: number;
}

export interface GameState {
  year: number;
  quarter: number;
  nations: Record<NationId, Nation>;
  tradeRoutes: TradeRoute[];
  events: GameEvent[];
  japanResources: JapanResources;
  selectedNation: NationId | null;
  isPaused: boolean;
  totalTurns: number;
}
