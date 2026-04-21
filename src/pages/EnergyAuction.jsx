import { useState, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import { computeTotalWatts, computeCostPerHour, computeDailyCost, loadPercentage, DEVICE_WATTS, DEVICE_TIERS } from '../utils/energyCalc';
import { Zap, Shield, AlertTriangle, TrendingDown, IndianRupee, Clock, Power } from 'lucide-react';

const TIER_CONFIG = {
  essential: { label: 'Essential', color: 'text-red-400',   bg: 'bg-red-500/15',   border: 'border-red-500/30',   dot: 'bg-red-500'   },
  normal:    { label: 'Normal',    color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  luxury:    { label: 'Luxury',    color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',dot: 'bg-emerald-500'},
};

const GLOBAL_DEVICE_LABELS = {
  refrigerator: 'Refrigerator', router: 'Router', securityCam: 'Security Camera',
  washingMachine: 'Washing Machine', oven: 'Oven', speaker: 'Speaker', decorativeLights: 'Decorative Lights',
};

function DeviceCard({ name, watts, on, tier, shed, onToggle, peakHour }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.normal;
  return (
    <div className={`
      glass-card p-4 transition-all duration-500
      ${shed ? 'opacity-40 scale-95' : 'opacity-100'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-200 truncate mr-2">{name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} flex-shrink-0`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
          {cfg.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-mono font-bold ${on ? 'text-yellow-400' : 'text-gray-600'}`}>
            {on ? `${watts}W` : '—'}
          </div>
          {shed ? (
            <div className="text-xs text-red-400 mt-0.5">Power removed by system</div>
          ) : peakHour && on ? (
            <div className="text-xs text-amber-400 mt-0.5">⚡ Costs 2× now</div>
          ) : null}
        </div>
        {tier !== 'essential' && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onToggle}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${on ? 'bg-indigo-500' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${on ? 'translate-x-5' : 'translate-x-0'}`}/>
            </button>
            <span className={`text-xs ${on ? 'text-red-400' : 'text-emerald-400'}`}>
              {on ? `-${watts}W` : `+${watts}W`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EnergyAuction() {
  const { state, dispatch } = useHome();
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [shedAnimation, setShedAnimation] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const totalWatts = computeTotalWatts(state.rooms, state.globalDevices);
  const loadPct = loadPercentage(totalWatts, state.energyBudget);
  const costPerHour = computeCostPerHour(totalWatts, state.peakHourActive);
  const dailyCost = computeDailyCost(totalWatts, state.peakHourActive);

  // Auto-shed logic
  useEffect(() => {
    if (loadPct > 95 && !shedAnimation) {
      setShedAnimation(true);
      dispatch({ type: 'SHED_LUXURY' });
      const saved = ['tv', 'decorativeLights', 'speaker'].reduce((s, d) => s + (DEVICE_WATTS[d] ?? 0), 0);
      dispatch({ type: 'ADD_AI_SAVINGS', payload: saved * (1 / 3600) });
      setTimeout(() => setShedAnimation(false), 3000);
    }
    if (loadPct > 100) {
      dispatch({ type: 'SHED_NORMAL' });
    }
  }, [loadPct, shedAnimation, dispatch]);

  // Peak hour AI suggestion
  useEffect(() => {
    if (state.peakHourActive) {
      setAiSuggestion('Delay washing machine to 11 PM — saves ₹' + (0.8 * 8).toFixed(0) + ' tonight');
    } else {
      setAiSuggestion(null);
    }
  }, [state.peakHourActive]);

  const gaugeColor = loadPct > 90 ? 'bg-red-500' : loadPct > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  const handlePanicConfirm = () => {
    dispatch({ type: 'ALL_OFF' });
    setShowPanicModal(false);
  };

  // Room devices flat list
  const roomDevices = [];
  for (const [roomId, room] of Object.entries(state.rooms)) {
    for (const [device, on] of Object.entries(room.devices)) {
      roomDevices.push({
        key: `${roomId}.${device}`,
        name: `${roomId.replace(/([A-Z])/g, ' $1')} ${device}`,
        watts: DEVICE_WATTS[device] ?? 0,
        on: on === true,
        tier: DEVICE_TIERS[device] ?? 'normal',
        roomId, device,
      });
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Energy Auction Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time power budget management</p>
        </div>
        <button
          id="peak-hour-toggle"
          onClick={() => dispatch({ type: 'SET_PEAK_HOUR', payload: !state.peakHourActive })}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all
            ${state.peakHourActive
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'}`}
        >
          <Clock className="w-4 h-4" />
          Peak Hours {state.peakHourActive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Budget gauge + cost */}
      <div className="glass-card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-gray-200">Power Budget</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-lg text-gray-100">{totalWatts}W</span>
            <span className="text-gray-500 text-sm"> / {state.energyBudget}W</span>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${gaugeColor}`}
            style={{ width: `${Math.min(loadPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>0W</span>
          <span className={loadPct > 90 ? 'text-red-400 font-bold' : loadPct > 70 ? 'text-amber-400' : 'text-emerald-400'}>
            {loadPct.toFixed(1)}% load
          </span>
          <span>{state.energyBudget}W</span>
        </div>

        {/* Alert banners */}
        {loadPct > 95 && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span className="text-sm text-red-300">
              {shedAnimation
                ? `⚡ Shedding luxury load — saved ${['tv','decorativeLights','speaker'].reduce((s,d)=>s+(DEVICE_WATTS[d]??0),0)}W`
                : 'Critical load — auto-shedding in progress'}
            </span>
          </div>
        )}
        {loadPct > 70 && loadPct <= 95 && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-300">High load — consider turning off non-essential devices</span>
          </div>
        )}

        {/* Cost stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              <IndianRupee className="w-3 h-3" />Cost/Hour
            </div>
            <div className="font-mono font-bold text-indigo-400">₹{costPerHour.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Daily Projected</div>
            <div className="font-mono font-bold text-purple-400">₹{dailyCost.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-400" />AI Saved
            </div>
            <div className="font-mono font-bold text-emerald-400">₹{state.aiSavings.toFixed(2)}</div>
          </div>
        </div>

        {/* Peak hour AI suggestion */}
        {aiSuggestion && (
          <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 text-sm text-indigo-300">
            💡 {aiSuggestion}
          </div>
        )}
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-20">
        {/* Global devices */}
        {Object.entries(state.globalDevices).map(([device, info]) => (
          <DeviceCard
            key={device}
            name={GLOBAL_DEVICE_LABELS[device] ?? device}
            watts={info.watts}
            on={info.on}
            tier={DEVICE_TIERS[device] ?? 'normal'}
            shed={false}
            peakHour={state.peakHourActive}
            onToggle={() => dispatch({ type: 'SET_GLOBAL_DEVICE', payload: { device, value: !info.on } })}
          />
        ))}
        {/* Room devices */}
        {roomDevices.map(d => (
          <DeviceCard
            key={d.key}
            name={d.name.charAt(0).toUpperCase() + d.name.slice(1)}
            watts={d.watts}
            on={d.on}
            tier={d.tier}
            shed={false}
            peakHour={state.peakHourActive}
            onToggle={() => dispatch({ type: 'SET_DEVICE', payload: { roomId: d.roomId, device: d.device, value: !d.on } })}
          />
        ))}
      </div>

      {/* Panic button */}
      <button
        id="panic-btn"
        onClick={() => setShowPanicModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl shadow-red-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40"
      >
        <Shield className="w-7 h-7" />
      </button>

      {/* Panic modal */}
      {showPanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-sm mx-4 border border-red-500/30 animate-slide-up">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-300">Activate Emergency Mode?</h3>
              <p className="text-sm text-gray-400 mt-2">
                This will cut power to all non-essential devices and activate home security mode.
              </p>
            </div>

            {/* Simulated family contacts */}
            <div className="bg-gray-900/60 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-500 mb-2">Emergency Contacts</p>
              {state.careContacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div>
                    <div className="text-sm text-gray-300">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded px-2 py-1">Call</button>
                    <button className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded px-2 py-1">SMS</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPanicModal(false)} className="flex-1 btn-ghost">
                Cancel
              </button>
              <button onClick={handlePanicConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded-xl transition-all">
                <Power className="w-4 h-4 inline mr-1" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
