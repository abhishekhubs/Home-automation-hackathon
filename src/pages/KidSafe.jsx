import { useState, useEffect } from 'react';
import { useHome } from '../context/HomeContext';
import { Lock, Unlock, Star, Clock, Moon, BookOpen, Activity, Bell } from 'lucide-react';

const LOCKABLE_DEVICES = [
  { key: 'bedroom.tv',     label: 'Bedroom TV',     icon: '📺' },
  { key: 'bedroom.lights', label: 'Bedroom Lights', icon: '💡' },
  { key: 'bedroom.fan',    label: 'Bedroom Fan',    icon: '🌀' },
  { key: 'livingRoom.tv',  label: 'Living Room TV', icon: '📺' },
  { key: 'bedroom.ac',     label: 'Bedroom AC',     icon: '❄️' },
];

const STAR_MILESTONES = { 5: '🌟 Starter', 10: '⭐ Helper', 20: '💫 Champion' };

function StarDisplay({ count }) {
  const milestone = Object.entries(STAR_MILESTONES)
    .filter(([n]) => count >= Number(n))
    .slice(-1)[0];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
        {count > 20 && <span className="text-xs text-yellow-400 font-bold">+{count - 20}</span>}
      </div>
      {milestone && (
        <span className="text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5">
          {milestone[1]}
        </span>
      )}
    </div>
  );
}

function ParentConfig() {
  const { state, dispatch } = useHome();
  const [bedtimeInput, setBedtimeInput] = useState(state.bedtime);

  const handleScreenTime = (e) => {
    dispatch({ type: 'SET_SCREEN_TIME', payload: Number(e.target.value) });
  };

  const handleBedtime = () => {
    dispatch({ type: 'SET_BEDTIME', payload: bedtimeInput });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Device Locks */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-400" />
          Device Locks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LOCKABLE_DEVICES.map(d => {
            const isLocked = state.lockedDevices.includes(d.key);
            return (
              <div
                key={d.key}
                className={`
                  flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                  ${isLocked
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-800/40 border-gray-700/40 hover:border-gray-600/60'}
                `}
                onClick={() => dispatch({ type: 'TOGGLE_LOCKED_DEVICE', payload: d.key })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{d.icon}</span>
                  <span className="text-sm text-gray-300">{d.label}</span>
                </div>
                {isLocked
                  ? <Lock className="w-4 h-4 text-red-400" />
                  : <Unlock className="w-4 h-4 text-gray-500" />
                }
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">Click to lock/unlock. Locked devices show padlock in Child View.</p>
      </div>

      {/* Time Controls */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-400" />
          Time Controls
        </h3>
        <div className="space-y-4">
          {/* Screen time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Screen Time Limit</label>
              <span className="font-mono font-bold text-indigo-400">{state.screenTimeMinutes} min</span>
            </div>
            <input
              type="range" min="0" max="480" step="15"
              value={state.screenTimeMinutes}
              onChange={handleScreenTime}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0 min</span><span>8 hours</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-gray-900/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">Time Remaining</span>
            <span className={`font-mono font-bold text-lg ${state.screenTimeRemaining <= 15 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {Math.floor(state.screenTimeRemaining / 60)}h {state.screenTimeRemaining % 60}m
            </span>
          </div>

          {/* Bedtime */}
          <div>
            <label className="text-sm text-gray-300 flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-purple-400" />
              Bedtime Automation
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={bedtimeInput}
                onChange={e => setBedtimeInput(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <button onClick={handleBedtime} className="btn-primary px-4 py-2 text-sm">Set</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">At bedtime: dims all lights, AC→22°C, locks entertainment</p>
          </div>

          {/* Study mode */}
          <div className="flex items-center justify-between bg-gray-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-gray-200">Study Mode</div>
                <div className="text-xs text-gray-500">Mutes TV + speaker in all rooms</div>
              </div>
            </div>
            <button
              id="study-mode-toggle"
              onClick={() => dispatch({ type: 'SET_STUDY_MODE', payload: !state.studyMode })}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${state.studyMode ? 'bg-blue-500' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${state.studyMode ? 'translate-x-5' : 'translate-x-0'}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          Monitoring
        </h3>
        <div className="space-y-3">
          {/* Room logs */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Room Entry Log</p>
            <div className="max-h-36 overflow-y-auto space-y-1.5">
              {Object.entries(state.rooms).flatMap(([roomId, room]) =>
                room.motionLog.slice(-5).map((log, i) => (
                  <div key={`${roomId}-${i}`} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.entered ? 'bg-emerald-400' : 'bg-gray-600'}`}/>
                    <span className="font-mono text-gray-500">{log.ts}</span>
                    <span>{log.entered ? 'Entered' : 'Left'} {roomId}</span>
                  </div>
                ))
              )}
              {Object.values(state.rooms).every(r => r.motionLog.length === 0) && (
                <p className="text-xs text-gray-600">No motion events yet</p>
              )}
            </div>
          </div>

          {/* Child safe indicator */}
          <div className="flex items-center justify-between bg-gray-900/50 rounded-xl p-3">
            <span className="text-sm text-gray-300">Child Safe at Home</span>
            <div className={`flex items-center gap-1.5 ${state.rooms.bedroom.motion ? 'text-emerald-400' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${state.rooms.bedroom.motion ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}/>
              <span className="text-xs font-medium">{state.rooms.bedroom.motion ? 'Yes' : 'Not detected'}</span>
            </div>
          </div>

          {/* Parent requests */}
          {state.parentRequests.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Bell className="w-3 h-3" />
                Child Requests ({state.parentRequests.length})
              </p>
              {state.parentRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-amber-300">Unlock request: {r.device} ({r.ts})</span>
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_PARENT_REQUEST', payload: r.id })}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildView() {
  const { state, dispatch } = useHome();
  const bedroomDevices = state.rooms.bedroom?.devices ?? {};

  const handleDeviceToggle = (device, isLocked) => {
    if (isLocked) {
      dispatch({ type: 'ADD_PARENT_REQUEST', payload: device });
      return;
    }
    const currentVal = bedroomDevices[device];
    const newVal = !currentVal;
    dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device, value: newVal } });
    // Star reward: turning OFF when room has no motion
    if (!newVal && !state.rooms.bedroom.motion) {
      dispatch({ type: 'ADD_KID_STAR' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Pastel header */}
      <div className="text-center mb-6 py-4 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-300/20">
        <div className="text-4xl mb-2">🏠</div>
        <h2 className="text-2xl font-bold text-purple-300">My Room</h2>
        <p className="text-sm text-gray-400">Control your bedroom devices</p>
      </div>

      {/* Stars */}
      <div className="glass-card p-4 mb-5 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-yellow-300">⭐ My Stars</span>
          <span className="font-mono font-bold text-xl text-yellow-400">{state.kidStars}</span>
        </div>
        <StarDisplay count={state.kidStars} />
        <p className="text-xs text-gray-500 mt-2">Turn off a device when you leave the room to earn a star!</p>
      </div>

      {/* Bedroom device cards — large, rounded, pastel */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(bedroomDevices).map(([device, on]) => {
          const lockKey = `bedroom.${device}`;
          const isLocked = state.lockedDevices.includes(lockKey);
          const deviceEmojis = { lights: '💡', fan: '🌀', ac: '❄️', tv: '📺' };
          const bgColors = { lights: 'from-yellow-500/20', fan: 'from-purple-500/20', ac: 'from-cyan-500/20', tv: 'from-blue-500/20' };

          return (
            <div
              key={device}
              onClick={() => handleDeviceToggle(device, isLocked)}
              className={`
                relative rounded-3xl p-5 cursor-pointer transition-all duration-300 border-2 text-center
                bg-gradient-to-br ${bgColors[device] ?? 'from-gray-500/20'} to-gray-900/40
                ${on && !isLocked ? 'border-indigo-400/60 scale-105 shadow-lg shadow-indigo-500/20' : 'border-gray-700/40'}
                ${isLocked ? 'opacity-60' : 'hover:scale-105 hover:border-indigo-400/40'}
                active:scale-95
              `}
              style={{ fontSize: '20px' }}
            >
              <div className="text-5xl mb-3">{deviceEmojis[device] ?? '🔌'}</div>
              <div className="font-bold text-gray-200 capitalize text-base">{device}</div>
              <div className={`text-sm mt-1 font-medium ${on && !isLocked ? 'text-indigo-300' : 'text-gray-500'}`}>
                {isLocked ? '🔒 Locked' : on ? 'ON' : 'OFF'}
              </div>
              {isLocked && (
                <div className="mt-2 text-xs text-amber-400">Ask Parent</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Screen time */}
      <div className="glass-card p-4 mt-5 border border-blue-500/20 bg-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-blue-300">Screen Time Left</span>
          </div>
          <span className={`font-mono font-bold text-xl ${state.screenTimeRemaining <= 15 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
            {Math.floor(state.screenTimeRemaining / 60)}h {state.screenTimeRemaining % 60}m
          </span>
        </div>
        {state.screenTimeRemaining <= 15 && (
          <p className="text-xs text-red-300 mt-1">Almost out of screen time! Ask a parent to add more.</p>
        )}
      </div>
    </div>
  );
}

export default function KidSafe() {
  const { state, dispatch } = useHome();
  const [view, setView] = useState('parent');

  const parentRequests = state.parentRequests.length;

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">KidSafe Mode</h1>
          <p className="text-sm text-gray-500 mt-0.5">Parental controls & monitoring</p>
        </div>
        <button
          id="kidsafe-enable-toggle"
          onClick={() => dispatch({ type: 'SET_KID_SAFE', payload: !state.kidSafeEnabled })}
          className={`relative w-12 h-7 rounded-full transition-all duration-300 ${state.kidSafeEnabled ? 'bg-indigo-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${state.kidSafeEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
        </button>
      </div>

      {/* View switcher */}
      <div className="flex bg-gray-900 rounded-2xl p-1 mb-6 border border-gray-800">
        {[
          { id: 'parent', label: 'Parent Config' },
          { id: 'child',  label: 'Child View' },
        ].map(({ id, label }) => (
          <button
            key={id}
            id={`kidsafe-view-${id}`}
            onClick={() => setView(id)}
            className={`
              relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
              ${view === id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            {label}
            {id === 'parent' && parentRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {parentRequests}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'parent' ? <ParentConfig /> : <ChildView />}
    </div>
  );
}
