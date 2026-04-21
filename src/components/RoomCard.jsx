import { useState } from 'react';
import { useHome } from '../context/HomeContext';
import { Thermometer, Droplets, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import RoomDetailPanel from './RoomDetailPanel';

const ROOM_LABELS = {
  livingRoom: 'Living Room',
  bedroom:    'Bedroom',
  kitchen:    'Kitchen',
  bathroom:   'Bathroom',
};

// SVG floor plan icons per room
const ROOM_SVGS = {
  livingRoom: ({ devices }) => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="2" y="2" width="76" height="56" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      {/* Sofa */}
      <rect x="10" y="30" width="35" height="15" rx="3" fill="#334155"/>
      <rect x="10" y="25" width="35" height="8" rx="2" fill="#475569"/>
      {/* TV */}
      <rect x="50" y="20" width="22" height="14" rx="2" fill={devices.tv ? '#6366f1' : '#1e293b'} stroke="#475569" strokeWidth="1"/>
      {/* Light dot top-center */}
      <circle cx="40" cy="10" r="4" fill={devices.lights ? '#fbbf24' : '#374151'} className={devices.lights ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}/>
      {/* AC unit */}
      <rect x="55" y="5" width="18" height="8" rx="2" fill={devices.ac ? '#06b6d4' : '#374151'} stroke="#475569" strokeWidth="0.5"/>
      {/* Fan */}
      <circle cx="20" cy="10" r="5" fill={devices.fan ? '#8b5cf6' : '#374151'} stroke="#475569" strokeWidth="0.5"/>
    </svg>
  ),
  bedroom: ({ devices }) => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="2" y="2" width="76" height="56" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      {/* Bed */}
      <rect x="15" y="20" width="45" height="30" rx="3" fill="#334155"/>
      <rect x="15" y="18" width="45" height="10" rx="2" fill="#475569"/>
      {/* Pillow */}
      <rect x="20" y="21" width="14" height="8" rx="2" fill="#64748b"/>
      <rect x="45" y="21" width="14" height="8" rx="2" fill="#64748b"/>
      {/* Light */}
      <circle cx="40" cy="8" r="4" fill={devices.lights ? '#fbbf24' : '#374151'} className={devices.lights ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}/>
      {/* TV */}
      <rect x="5" y="10" width="16" height="10" rx="2" fill={devices.tv ? '#6366f1' : '#1e293b'} stroke="#475569" strokeWidth="1"/>
      {/* AC */}
      <rect x="60" y="5" width="14" height="7" rx="2" fill={devices.ac ? '#06b6d4' : '#374151'}/>
      {/* Fan */}
      <circle cx="65" cy="35" r="4" fill={devices.fan ? '#8b5cf6' : '#374151'}/>
    </svg>
  ),
  kitchen: ({ devices }) => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="2" y="2" width="76" height="56" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      {/* Counter top */}
      <rect x="5" y="30" width="70" height="5" rx="1" fill="#374151"/>
      {/* Stove */}
      <rect x="10" y="35" width="24" height="20" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
      <circle cx="17" cy="42" r="4" fill={devices.stove ? '#ef4444' : '#374151'} className={devices.stove ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]' : ''}/>
      <circle cx="28" cy="42" r="4" fill={devices.stove ? '#f97316' : '#374151'} className={devices.stove ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : ''}/>
      {/* Sink */}
      <rect x="40" y="35" width="30" height="20" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
      <ellipse cx="55" cy="45" rx="10" ry="7" fill="#0f172a" stroke="#475569" strokeWidth="1"/>
      {/* Light */}
      <circle cx="40" cy="8" r="4" fill={devices.lights ? '#fbbf24' : '#374151'} className={devices.lights ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}/>
      {/* Fan */}
      <circle cx="65" cy="10" r="4" fill={devices.fan ? '#8b5cf6' : '#374151'}/>
      {/* Fridge */}
      <rect x="5" y="5" width="14" height="22" rx="2" fill="#1e293b" stroke="#4b5563" strokeWidth="1"/>
    </svg>
  ),
  bathroom: ({ devices }) => (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      <rect x="2" y="2" width="76" height="56" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
      {/* Bathtub */}
      <ellipse cx="30" cy="42" rx="22" ry="12" fill="#0f172a" stroke="#475569" strokeWidth="1.5"/>
      <ellipse cx="30" cy="40" rx="18" ry="8" fill="#1e3a5f"/>
      {/* Toilet */}
      <ellipse cx="62" cy="42" rx="10" ry="12" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>
      <ellipse cx="62" cy="38" rx="8" ry="6" fill="#374151"/>
      {/* Sink */}
      <ellipse cx="62" cy="20" rx="10" ry="7" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>
      {/* Light */}
      <circle cx="40" cy="8" r="4" fill={devices.lights ? '#fbbf24' : '#374151'} className={devices.lights ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}/>
      {/* Fan */}
      <circle cx="15" cy="10" r="4" fill={devices.fan ? '#8b5cf6' : '#374151'}/>
    </svg>
  ),
};

function computeHealthScore(roomId, room, anomalies) {
  let score = 100;
  const roomAnomalies = anomalies.filter(a => a.id.startsWith(roomId) || a.id.includes(roomId));
  for (const a of roomAnomalies) {
    if (a.type === 'danger')  score -= 30;
    if (a.type === 'warning') score -= 15;
    if (a.type === 'info')    score -= 5;
  }
  if (room.humidity > 75) score -= 10;
  if (room.temp > 35)     score -= 10;
  return Math.max(0, Math.min(100, score));
}

function healthColor(score) {
  if (score >= 80) return { ring: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500' };
  if (score >= 50) return { ring: 'border-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500'   };
  return              { ring: 'border-red-500',    text: 'text-red-400',    bg: 'bg-red-500'    };
}

export default function RoomCard({ roomId, room, onAskAI }) {
  const { state, dispatch } = useHome();
  const [showDetail, setShowDetail] = useState(false);

  const anomalies = state.anomalies.filter(
    a => a.id.startsWith(roomId) || a.id.includes(roomId)
  );
  const score = computeHealthScore(roomId, room, state.anomalies);
  const colors = healthColor(score);
  const SvgRoom = ROOM_SVGS[roomId];

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className={`
          glass-card p-4 cursor-pointer group transition-all duration-300
          border-2 ${colors.ring} hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10
          relative overflow-hidden
        `}
      >
        {/* Anomaly badge */}
        {anomalies.length > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </span>
        )}

        {/* Room name + health */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-white">{ROOM_LABELS[roomId]}</h3>
          <div className="flex items-center gap-2">
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.text} border ${colors.ring.replace('border-', 'border-')}`}>
              {score}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>

        {/* SVG floor plan */}
        <div className="h-28 mb-3 rounded-xl overflow-hidden bg-gray-900/50">
          {SvgRoom ? <SvgRoom devices={room.devices} /> : null}
        </div>

        {/* Sensor readouts */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-orange-300">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="font-mono font-semibold">{room.temp.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-300">
            <Droplets className="w-3.5 h-3.5" />
            <span className="font-mono font-semibold">{room.humidity.toFixed(0)}%</span>
          </div>
          <div className={`flex items-center gap-1 ${room.motion ? 'text-emerald-400' : 'text-gray-500'}`}>
            <Activity className="w-3.5 h-3.5" />
            <span className="font-semibold">{room.motion ? 'Active' : 'Empty'}</span>
          </div>
        </div>

        {/* Device dots row */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.entries(room.devices).map(([device, state]) => (
            <div
              key={device}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border
                ${state === true
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-500'}
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${state === true ? 'bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]' : 'bg-gray-600'}`}/>
              {device.charAt(0).toUpperCase() + device.slice(1)}
            </div>
          ))}
        </div>

        {/* Anomaly list */}
        {anomalies.length > 0 && (
          <div className="mt-2 space-y-1">
            {anomalies.map(a => (
              <div key={a.id} className="text-xs text-red-300 bg-red-500/10 rounded px-2 py-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {a.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetail && (
        <RoomDetailPanel
          roomId={roomId}
          room={room}
          onClose={() => setShowDetail(false)}
          onAskAI={() => { setShowDetail(false); onAskAI(roomId); }}
        />
      )}
    </>
  );
}
