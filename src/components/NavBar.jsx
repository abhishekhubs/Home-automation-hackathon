import { useHome } from '../context/HomeContext';
import { Shield, Zap, AlertTriangle, Home, MessageSquare, BarChart3, Lock, Heart } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: Home },
  // { id: 'command', label: 'AI Command', Icon: MessageSquare },
  // { id: 'energy', label: 'Energy Auction', Icon: Zap },
  // { id: 'kidsafe', label: 'KidSafe', Icon: Lock },
  // { id: 'carewatch', label: 'CareWatch', Icon: Heart },
];

export default function NavBar({ activeTab, setActiveTab }) {
  const { state } = useHome();
  const unreadAnomalies = state.anomalies.filter(a => !a.read).length;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gradient">DECODE</span>
          <span className="text-xs text-gray-500 font-mono ml-1">v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          {state.peakHourActive && (
            <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5 animate-pulse">
              <Zap className="w-3 h-3" />
              Peak Hours
            </span>
          )}
          {state.homeSecurity && (
            <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
              <Shield className="w-3 h-3" />
              Secured
            </span>
          )}
          <div className="text-xs text-gray-500 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Tab row */}
      <div className="flex overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const showBadge = id === 'dashboard' && unreadAnomalies > 0;
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`
                relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap
                transition-all duration-200 border-b-2 flex-shrink-0
                ${isActive
                  ? 'text-indigo-600 border-indigo-500 bg-indigo-50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'}
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
              {showBadge && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
