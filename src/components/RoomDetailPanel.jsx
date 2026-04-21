import { useEffect, useRef } from 'react';
import { useHome } from '../context/HomeContext';
import { X, Thermometer, Droplets, MessageSquare, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DEVICE_WATTS } from '../utils/energyCalc';

const ROOM_LABELS = {
  livingRoom: 'Living Room',
  bedroom:    'Bedroom',
  kitchen:    'Kitchen',
  bathroom:   'Bathroom',
};

const DEVICE_ICONS = {
  lights: '💡', fan: '🌀', ac: '❄️', tv: '📺', stove: '🔥',
};

export default function RoomDetailPanel({ roomId, room, onClose, onAskAI }) {
  const { dispatch } = useHome();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const chartData = room.sensorHistory.map((h, i) => ({
    t: i,
    temp: +h.temp.toFixed(1),
    humidity: +h.humidity.toFixed(0),
  }));

  const activeWatts = Object.entries(room.devices)
    .filter(([, v]) => v === true)
    .reduce((sum, [d]) => sum + (DEVICE_WATTS[d] ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        ref={panelRef}
        className="glass-card w-full max-w-sm h-full overflow-y-auto rounded-none rounded-l-2xl border-l border-gray-700/50 animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/60 sticky top-0 bg-gray-900/90 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{ROOM_LABELS[roomId]}</h2>
            <p className="text-xs text-gray-400">Room Detail Panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Live sensors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-medium">Temperature</span>
              </div>
              <div className="text-2xl font-bold font-mono text-orange-300">{room.temp.toFixed(1)}°C</div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                <Droplets className="w-4 h-4" />
                <span className="text-xs font-medium">Humidity</span>
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">{room.humidity.toFixed(0)}%</div>
            </div>
          </div>

          {/* Sparkline chart */}
          {chartData.length > 2 ? (
            <div className="bg-gray-900/60 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2 font-medium">Last {chartData.length} ticks (30 data points)</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6b7280' }} width={30} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} name="Temp °C" />
                  <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={false} name="Humidity %" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-1 justify-center">
                <span className="flex items-center gap-1 text-xs text-orange-400"><span className="w-3 h-0.5 bg-orange-400 inline-block"/>Temp</span>
                <span className="flex items-center gap-1 text-xs text-cyan-400"><span className="w-3 h-0.5 bg-cyan-400 inline-block"/>Humidity</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/60 rounded-xl p-3 text-center text-xs text-gray-500">
              Collecting sensor data... (updates every 5s)
            </div>
          )}

          {/* Device toggles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-300">Devices</h3>
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Zap className="w-3 h-3" />
                {activeWatts}W active
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(room.devices).map(([device, isOn]) => {
                const watts = DEVICE_WATTS[device] ?? 0;
                return (
                  <div
                    key={device}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all duration-200
                      ${isOn
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-gray-800/40 border-gray-700/40'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{DEVICE_ICONS[device] ?? '🔌'}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-200 capitalize">{device}</div>
                        <div className={`text-xs ${isOn ? 'text-yellow-400' : 'text-gray-600'}`}>
                          {isOn ? `${watts}W` : 'Off'}
                        </div>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      id={`room-${roomId}-device-${device}-toggle`}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SET_DEVICE', payload: { roomId, device, value: !isOn } });
                      }}
                      className={`
                        relative w-11 h-6 rounded-full transition-all duration-300
                        ${isOn ? 'bg-indigo-500' : 'bg-gray-700'}
                      `}
                    >
                      <span className={`
                        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300
                        ${isOn ? 'translate-x-5' : 'translate-x-0'}
                      `}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ask AI button */}
          <button
            id={`ask-ai-${roomId}`}
            onClick={onAskAI}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI about this room
          </button>
        </div>
      </div>
    </div>
  );
}
