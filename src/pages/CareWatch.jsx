import { useState, useEffect, useRef } from 'react';
import { useHome } from '../context/HomeContext';
import { Heart, AlertTriangle, CheckCircle, Phone, MessageSquare, Sun, Coffee, Moon, Siren, Activity, Thermometer, Clock, FileText } from 'lucide-react';

// ─── Elder View ───────────────────────────────────────────────────────────────
function ElderView() {
  const { state, dispatch } = useHome();
  const [sosTriggered, setSosTriggered] = useState(false);
  const [medModal, setMedModal] = useState(null);
  const [callingContact, setCallingContact] = useState(null);

  // Medication reminder check
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      for (const time of state.medicationSchedule) {
        if (time === hhmm && !state.medicationConfirmed[time]) {
          setMedModal(time);
        }
      }
    };
    const interval = setInterval(check, 30000);
    check();
    return () => clearInterval(interval);
  }, [state.medicationSchedule, state.medicationConfirmed]);

  const handleScene = (scene) => {
    switch (scene) {
      case 'morning':
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom',    device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom',    device: 'ac',     value: true } });
        break;
      case 'mealtime':
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'kitchen',    device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'fan',    value: true } });
        break;
      case 'rest':
        ['livingRoom', 'bedroom', 'kitchen', 'bathroom'].forEach(r => {
          Object.keys(state.rooms[r].devices).forEach(d => {
            dispatch({ type: 'SET_DEVICE', payload: { roomId: r, device: d, value: false } });
          });
        });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'ac',     value: true } });
        break;
      case 'emergency':
        handleSOS();
        break;
      default:
        break;
    }
  };

  const handleSOS = () => {
    setSosTriggered(true);
    dispatch({ type: 'ADD_CARE_ALERT', payload: '🚨 SOS triggered by elder at ' + new Date().toLocaleTimeString() });
    dispatch({ type: 'SET_SECURITY_MODE', payload: true });
    setTimeout(() => setSosTriggered(false), 5000);
  };

  const handleCallContact = (name) => {
    setCallingContact(name);
    setTimeout(() => setCallingContact(null), 3000);
  };

  const SCENES = [
    { id: 'morning',   icon: <Sun   className="w-10 h-10" />, label: '☀️ Morning',   desc: 'Lights on, fresh start',        color: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30' },
    { id: 'mealtime',  icon: <Coffee className="w-10 h-10" />, label: '🍽️ Mealtime', desc: 'Kitchen ready, dining mode',     color: 'from-green-500/20 to-emerald-500/10 border-green-500/30' },
    { id: 'rest',      icon: <Moon  className="w-10 h-10" />, label: '😴 Rest',      desc: 'Quiet mode, AC on',             color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30' },
    { id: 'emergency', icon: <Siren className="w-10 h-10" />, label: '🚨 Emergency', desc: 'Alerts family immediately',      color: 'from-red-500/20 to-red-500/10 border-red-500/30' },
  ];

  return (
    <div className="animate-fade-in space-y-5" style={{ fontSize: '20px', background: 'rgba(253,245,235,0.02)' }}>
      {/* Scene buttons */}
      <div className="grid grid-cols-2 gap-4">
        {SCENES.map(s => (
          <button
            key={s.id}
            id={`care-scene-${s.id}`}
            onClick={() => handleScene(s.id)}
            className={`
              w-full py-6 rounded-3xl border-2 bg-gradient-to-br ${s.color}
              transition-all duration-200 hover:scale-105 active:scale-95
              flex flex-col items-center gap-2 text-white font-bold
              ${s.id === 'emergency' ? 'animate-pulse-slow' : ''}
            `}
            style={{ fontSize: '22px' }}
          >
            {s.icon}
            <div style={{ fontSize: '18px' }}>{s.label}</div>
            <div className="text-gray-400 font-normal" style={{ fontSize: '13px' }}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* I'm Okay */}
      <button
        id="im-okay-btn"
        onClick={() => dispatch({ type: 'ELDER_CHECK_IN' })}
        className="w-full py-5 rounded-3xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold border-2 border-emerald-400/50 transition-all hover:scale-[1.02] active:scale-95"
        style={{ fontSize: '22px' }}
      >
        <CheckCircle className="w-8 h-8 inline mr-2" />
        I'm Okay ✓
      </button>

      {/* SOS */}
      <button
        id="sos-btn"
        onClick={handleSOS}
        className={`w-full py-5 rounded-3xl font-bold border-4 transition-all active:scale-95
          ${sosTriggered
            ? 'bg-red-700 border-red-400 animate-pulse'
            : 'bg-red-600/80 hover:bg-red-600 border-red-500/70 hover:border-red-400'}
          text-white`}
        style={{ fontSize: '24px' }}
      >
        {sosTriggered ? '🚨 SOS SENT — Help is coming!' : '🆘 SOS — Emergency'}
      </button>

      {/* Emergency contacts */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 mb-4" style={{ fontSize: '18px' }}>📞 Emergency Contacts</h3>
        <div className="space-y-3">
          {state.careContacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
              <div>
                <div className="font-semibold text-gray-200" style={{ fontSize: '16px' }}>{c.name}</div>
                <div className="text-gray-400" style={{ fontSize: '13px' }}>{c.role}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCallContact(c.name)}
                  className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl px-3 py-2 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  {callingContact === c.name ? 'Calling...' : 'Call'}
                </button>
                <button className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl px-3 py-2 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Medication reminder modal */}
      {medModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-sm mx-4 text-center border border-indigo-500/30 animate-slide-up">
            <div className="text-6xl mb-4">💊</div>
            <h3 className="font-bold text-gray-100 mb-2" style={{ fontSize: '24px' }}>Medication Time!</h3>
            <p className="text-gray-400 mb-6" style={{ fontSize: '18px' }}>
              Scheduled dose at {medModal}
            </p>
            <button
              onClick={() => {
                dispatch({ type: 'CONFIRM_MEDICATION', payload: medModal });
                setMedModal(null);
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all"
              style={{ fontSize: '20px' }}
            >
              ✓ CONFIRM TAKEN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Caregiver Dashboard ──────────────────────────────────────────────────────
function CaregiverDashboard() {
  const { state, dispatch } = useHome();

  // Movement analysis
  const totalMotionChanges = Object.values(state.rooms)
    .reduce((s, r) => s + r.motionLog.length, 0);

  // Comfort check
  const tempComfort = (temp) => temp >= 22 && temp <= 26;

  // Anomaly intelligence
  const careAnomalies = [];
  const noMotionAnywhere = Object.values(state.rooms).every(r => !r.motion);
  if (noMotionAnywhere) {
    careAnomalies.push({ level: 'warning', msg: '⚠️ No motion detected anywhere — check on elder' });
  }
  const hour = new Date().getHours();
  if (hour >= 1 && hour < 5 && Object.values(state.rooms).some(r => r.motion && r !== state.rooms.bedroom)) {
    careAnomalies.push({ level: 'warning', msg: '🌙 Night wandering alert — motion detected outside bedroom' });
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Last check-in */}
      <div className={`glass-card p-4 flex items-center gap-3 border ${state.elderCheckInTime ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <CheckCircle className={`w-7 h-7 ${state.elderCheckInTime ? 'text-emerald-400' : 'text-amber-400'}`} />
        <div>
          <div className="font-semibold text-gray-200">Last Check-In</div>
          <div className={`text-sm ${state.elderCheckInTime ? 'text-emerald-400' : 'text-amber-400'}`}>
            {state.elderCheckInTime
              ? new Date(state.elderCheckInTime).toLocaleTimeString()
              : 'No check-in yet today'}
          </div>
        </div>
      </div>

      {/* Anomaly intelligence */}
      {careAnomalies.length > 0 && (
        <div className="space-y-2">
          {careAnomalies.map((a, i) => (
            <div key={i} className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-amber-300">{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Room overview */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-400" />
          Room Status
        </h3>
        <div className="space-y-3">
          {Object.entries(state.rooms).map(([roomId, room]) => {
            const lastLog = room.motionLog.slice(-1)[0];
            const roomLabel = roomId.replace(/([A-Z])/g, ' $1');
            return (
              <div key={roomId} className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${room.motion ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}/>
                  <span className="text-sm text-gray-300 capitalize">{roomLabel}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={tempComfort(room.temp) ? 'text-emerald-400' : 'text-red-400'}>
                    <Thermometer className="w-3 h-3 inline mr-0.5" />{room.temp.toFixed(1)}°C
                  </span>
                  <span className="text-gray-500">
                    {lastLog ? `${lastLog.entered ? 'Active' : 'Left'} at ${lastLog.ts}` : 'No log yet'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement summary */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          Daily Activity Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center bg-gray-900/50 rounded-xl p-3">
            <div className="text-2xl font-bold font-mono text-indigo-400">{totalMotionChanges}</div>
            <div className="text-xs text-gray-500">Room Transitions</div>
          </div>
          <div className="text-center bg-gray-900/50 rounded-xl p-3">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {Object.values(state.rooms).filter(r => r.motion).length}
            </div>
            <div className="text-xs text-gray-500">Active Rooms</div>
          </div>
        </div>
        {totalMotionChanges < 5 && (
          <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            📉 Less active than usual today — consider checking in
          </div>
        )}
      </div>

      {/* SOS history */}
      {state.careAlerts.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-bold text-red-300 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            SOS History
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {state.careAlerts.map(a => (
              <div key={a.id} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <div className="text-sm text-red-300">{a.message}</div>
                <div className="text-xs text-gray-500 mt-0.5">{new Date(a.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comfort automation */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-400" />
          Comfort Automations
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Night light auto-ON', status: true, detail: '10 PM – 6 AM' },
            { label: 'Morning routine',     status: true, detail: 'Gradual brightness at 7 AM' },
            { label: 'Temperature guardian', status: true, detail: 'Target 22–26°C' },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-900/50 rounded-xl px-4 py-2.5">
              <div>
                <div className="text-sm text-gray-300">{rule.label}</div>
                <div className="text-xs text-gray-500">{rule.detail}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${rule.status ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
                {rule.status ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Medical notes */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-400" />
          Medical Notes
        </h3>
        <textarea
          value={state.medicalNotes}
          onChange={e => dispatch({ type: 'SET_MEDICAL_NOTES', payload: e.target.value })}
          placeholder="Enter medication details, allergies, conditions..."
          className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 resize-none h-28"
        />
      </div>
    </div>
  );
}

// ─── CareWatch Page ───────────────────────────────────────────────────────────
export default function CareWatch() {
  const { state, dispatch } = useHome();
  const [view, setView] = useState('elder');

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">CareWatch Mode</h1>
          <p className="text-sm text-gray-500 mt-0.5">Elder care & caregiver monitoring</p>
        </div>
        <button
          id="carewatch-enable-toggle"
          onClick={() => dispatch({ type: 'SET_CARE_WATCH', payload: !state.careWatchEnabled })}
          className={`relative w-12 h-7 rounded-full transition-all duration-300 ${state.careWatchEnabled ? 'bg-indigo-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${state.careWatchEnabled ? 'translate-x-5' : 'translate-x-0'}`}/>
        </button>
      </div>

      {/* View switcher */}
      <div className="flex bg-gray-900 rounded-2xl p-1 mb-6 border border-gray-800">
        {[
          { id: 'elder',     label: 'Elder View' },
          { id: 'caregiver', label: 'Caregiver Dashboard' },
        ].map(({ id, label }) => (
          <button
            key={id}
            id={`carewatch-view-${id}`}
            onClick={() => setView(id)}
            className={`
              flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
              ${view === id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'elder' ? <ElderView /> : <CaregiverDashboard />}
    </div>
  );
}
