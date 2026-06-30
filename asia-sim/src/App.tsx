import { GameProvider } from './context/GameContext';
import { Dashboard } from './components/Dashboard';
import { NationPanel } from './components/Dashboard';
import { AsiaMap } from './components/AsiaMap';
import { ActionPanel, ControlPanel } from './components/ActionPanel';
import { EventLog } from './components/EventLog';
import { TradeOverview } from './components/TradeOverview';
import { useGame } from './context/GameContext';

function AppContent() {
  const { state } = useGame();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                アジア貿易・外交シミュレーター
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                仮想空間で日本とアジア圏の貿易・外交関係をシミュレーション
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-800 rounded">16カ国</span>
              <span className="px-2 py-1 bg-slate-800 rounded">ターン制</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Dashboard />
        <ControlPanel />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <AsiaMap nations={state.nations} />
            <ActionPanel />
          </div>

          <div className="space-y-4">
            <NationPanel />
            <TradeOverview />
            <EventLog />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-8 py-4 text-center text-xs text-slate-600">
        アジア貿易・外交シミュレーター — 教育・シミュレーション目的
      </footer>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
