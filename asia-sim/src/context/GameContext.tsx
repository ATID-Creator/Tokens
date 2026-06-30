import { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GameState, NationId, DiplomaticAction } from '../types';
import { SimulationEngine } from '../engine/simulation';

interface GameContextValue {
  state: GameState;
  selectNation: (id: NationId | null) => void;
  executeAction: (action: DiplomaticAction, targetId: NationId) => void;
  advanceTurn: () => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());
  const [state, setState] = useState<GameState>(() => engineRef.current.getState());

  const selectNation = useCallback((id: NationId | null) => {
    setState(engineRef.current.selectNation(id));
  }, []);

  const executeAction = useCallback((action: DiplomaticAction, targetId: NationId) => {
    setState(engineRef.current.executeAction(action, targetId));
  }, []);

  const advanceTurn = useCallback(() => {
    setState(engineRef.current.advanceTurn());
  }, []);

  const reset = useCallback(() => {
    setState(engineRef.current.reset());
  }, []);

  return (
    <GameContext.Provider
      value={{ state, selectNation, executeAction, advanceTurn, reset }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
