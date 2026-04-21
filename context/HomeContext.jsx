import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { walkTemp, walkHumidity, markovMotion } from '../utils/sensorSim';

const makeRoom = (temp, humidity, motion, devices) => ({
  temp, humidity, motion, motionSince: null,
  sensorHistory: [], motionLog: [], devices,
});

const INITIAL_STATE = {
  rooms: {
    livingRoom: makeRoom(24, 52, false, { lights: false, fan: false, ac: false, tv: false }),
    bedroom: makeRoom(22, 48, false, { lights: false, fan: false, ac: false, tv: false }),
    kitchen: makeRoom(26, 55, false, { lights: false, fan: false, stove: false }),
    bathroom: makeRoom(25, 60, false, { lights: false, fan: false }),
  },
  globalDevices: {
    refrigerator: { on: true, watts: 150 },
    router: { on: true, watts: 20 },
    securityCam: { on: false, watts: 30 },
    washingMachine: { on: false, watts: 800 },
    oven: { on: false, watts: 2000 },
    speaker: { on: false, watts: 50 },
    decorativeLights: { on: false, watts: 120 },
  },
  energyBudget: 5000,
  peakHourActive: false,
  homeSecurity: false,
  kidSafeEnabled: false,
  careWatchEnabled: false,
  anomalies: [],
  commandHistory: [],
  elderCheckInTime: null,
  careAlerts: [],
  lockedDevices: [],
  screenTimeMinutes: 120,
  screenTimeRemaining: 120,
  bedtime: '21:00',
  studyMode: false,
  kidStars: 0,
  parentRequests: [],
  medicationSchedule: ['08:00', '13:00', '20:00'],
  medicationConfirmed: {},
  medicalNotes: '',
  careContacts: [
    { name: 'Priya (Daughter)', role: 'Primary Caregiver', phone: '+91-98765-43210' },
    { name: 'Dr. Sharma', role: 'Family Doctor', phone: '+91-98765-12345' },
  ],
  apiKey: '',
  aiSavings: 0,
};

function homeReducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_DEVICE': {
      const { roomId, device, value } = action.payload;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...state.rooms[roomId],
            devices: { ...state.rooms[roomId].devices, [device]: value },
          },
        },
      };
    }

    case 'SET_GLOBAL_DEVICE': {
      const { device, value } = action.payload;
      return {
        ...state,
        globalDevices: {
          ...state.globalDevices,
          [device]: { ...state.globalDevices[device], on: value },
        },
      };
    }

    case 'APPLY_AI_ACTIONS': {
      let rooms = { ...state.rooms };
      for (const act of action.payload.actions) {
        if (!rooms[act.room] || act.device === undefined) continue;
        rooms = {
          ...rooms,
          [act.room]: {
            ...rooms[act.room],
            devices: { ...rooms[act.room].devices, [act.device]: act.state },
          },
        };
      }
      return { ...state, rooms };
    }

    case 'UPDATE_SENSORS': {
      const { roomId, temp, humidity, motion } = action.payload;
      const room = state.rooms[roomId];
      const now = Date.now();
      const newHistory = [...room.sensorHistory.slice(-29), { temp, humidity, ts: now }];
      const motionChanged = motion !== room.motion;
      const newMotionLog = motionChanged
        ? [...room.motionLog.slice(-49), { entered: motion, ts: new Date().toLocaleTimeString() }]
        : room.motionLog;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: { ...room, temp, humidity, motion, motionSince: motionChanged ? now : room.motionSince, sensorHistory: newHistory, motionLog: newMotionLog },
        },
      };
    }

    case 'SET_ANOMALY': {
      const { id, message, type } = action.payload;
      if (state.anomalies.find(a => a.id === id)) return state;
      return {
        ...state,
        anomalies: [...state.anomalies, { id, message, type, timestamp: new Date().toLocaleTimeString(), read: false }],
      };
    }

    case 'CLEAR_ANOMALY':
      return { ...state, anomalies: state.anomalies.filter(a => a.id !== action.payload.id) };

    case 'MARK_ANOMALY_READ':
      return { ...state, anomalies: state.anomalies.map(a => a.id === action.payload.id ? { ...a, read: true } : a) };

    case 'CLEAR_ALL_ANOMALIES':
      return { ...state, anomalies: [] };

    case 'SET_PEAK_HOUR':
      return { ...state, peakHourActive: action.payload };

    case 'SET_SECURITY_MODE':
      return { ...state, homeSecurity: action.payload };

    case 'SET_KID_SAFE':
      return { ...state, kidSafeEnabled: action.payload };

    case 'SET_CARE_WATCH':
      return { ...state, careWatchEnabled: action.payload };

    case 'ADD_COMMAND':
      return { ...state, commandHistory: [action.payload, ...state.commandHistory].slice(0, 10) };

    case 'ELDER_CHECK_IN':
      return { ...state, elderCheckInTime: new Date().toISOString() };

    case 'ADD_CARE_ALERT':
      return {
        ...state,
        careAlerts: [{ message: action.payload, timestamp: new Date().toISOString(), id: Date.now() }, ...state.careAlerts].slice(0, 50),
      };

    case 'SET_ENERGY_BUDGET':
      return { ...state, energyBudget: action.payload };

    case 'SHED_LUXURY': {
      let rooms = { ...state.rooms };
      for (const roomId of Object.keys(rooms)) {
        const d = { ...rooms[roomId].devices };
        if ('tv' in d) d.tv = false;
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: d } };
      }
      const gd = { ...state.globalDevices };
      gd.decorativeLights = { ...gd.decorativeLights, on: false };
      gd.speaker = { ...gd.speaker, on: false };
      return { ...state, rooms, globalDevices: gd };
    }

    case 'SHED_NORMAL': {
      let rooms = { ...state.rooms };
      for (const roomId of Object.keys(rooms)) {
        const d = { ...rooms[roomId].devices };
        if (rooms[roomId].temp <= 30 && d.ac !== undefined) d.ac = false;
        if (d.fan !== undefined) d.fan = false;
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: d } };
      }
      const gd = { ...state.globalDevices };
      gd.washingMachine = { ...gd.washingMachine, on: false };
      return { ...state, rooms, globalDevices: gd };
    }

    case 'ALL_OFF': {
      let rooms = { ...state.rooms };
      for (const roomId of Object.keys(rooms)) {
        const d = {};
        for (const k of Object.keys(rooms[roomId].devices)) d[k] = false;
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: d } };
      }
      const gd = {};
      for (const [k, v] of Object.entries(state.globalDevices)) {
        gd[k] = (k === 'refrigerator' || k === 'router') ? v : { ...v, on: false };
      }
      return { ...state, rooms, globalDevices: gd, homeSecurity: true };
    }

    case 'TOGGLE_LOCKED_DEVICE': {
      const locked = state.lockedDevices.includes(action.payload)
        ? state.lockedDevices.filter(d => d !== action.payload)
        : [...state.lockedDevices, action.payload];
      return { ...state, lockedDevices: locked };
    }

    case 'SET_SCREEN_TIME':
      return { ...state, screenTimeMinutes: action.payload, screenTimeRemaining: action.payload };

    case 'TICK_SCREEN_TIME':
      return { ...state, screenTimeRemaining: Math.max(0, state.screenTimeRemaining - 1) };

    case 'SET_BEDTIME':
      return { ...state, bedtime: action.payload };

    case 'SET_STUDY_MODE':
      return { ...state, studyMode: action.payload };

    case 'ADD_KID_STAR':
      return { ...state, kidStars: state.kidStars + 1 };

    case 'ADD_PARENT_REQUEST':
      return { ...state, parentRequests: [...state.parentRequests, { device: action.payload, ts: new Date().toLocaleTimeString(), id: Date.now() }] };

    case 'CLEAR_PARENT_REQUEST':
      return { ...state, parentRequests: state.parentRequests.filter(r => r.id !== action.payload) };

    case 'CONFIRM_MEDICATION':
      return { ...state, medicationConfirmed: { ...state.medicationConfirmed, [action.payload]: true } };

    case 'SET_MEDICAL_NOTES':
      return { ...state, medicalNotes: action.payload };

    case 'ADD_AI_SAVINGS':
      return { ...state, aiSavings: state.aiSavings + action.payload };

    default:
      return state;
  }
}

export const HomeContext = createContext(null);

export function HomeProvider({ children }) {
  const [state, dispatch] = useReducer(homeReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;
  const noMotionTicks = useRef({ livingRoom: 0, bedroom: 0, kitchen: 0, bathroom: 0 });

  const evaluateAnomalies = useCallback((rooms) => {
    const hour = new Date().getHours();
    for (const [roomId, room] of Object.entries(rooms)) {
      if (!room.motion) noMotionTicks.current[roomId] = (noMotionTicks.current[roomId] ?? 0) + 1;
      else noMotionTicks.current[roomId] = 0;
      const noMotionSec = (noMotionTicks.current[roomId] ?? 0) * 5;

      if (roomId === 'kitchen' && room.temp > 40 && noMotionSec >= 300) {
        dispatch({ type: 'SET_ANOMALY', payload: { id: 'kitchen_fire_risk', type: 'danger', message: '🔥 Fire risk — kitchen unattended' } });
      } else if (roomId === 'kitchen') {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: 'kitchen_fire_risk' } });
      }
      if (roomId === 'bathroom' && noMotionSec >= 14400) {
        dispatch({ type: 'SET_ANOMALY', payload: { id: 'bathroom_inactivity', type: 'warning', message: '👴 Inactivity alert — check on elderly' } });
      }
      if (roomId === 'bedroom' && room.humidity > 80) {
        dispatch({ type: 'SET_ANOMALY', payload: { id: 'bedroom_mold', type: 'warning', message: '💧 Mold risk — ventilate bedroom' } });
      } else if (roomId === 'bedroom') {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: 'bedroom_mold' } });
      }
      if (hour >= 1 && hour < 5 && !room.motion) {
        const anyOn = Object.values(room.devices).some(v => v === true);
        if (anyOn) dispatch({ type: 'SET_ANOMALY', payload: { id: `${roomId}_night`, type: 'info', message: `🌙 Devices on at night in ${roomId}` } });
        else dispatch({ type: 'CLEAR_ANOMALY', payload: { id: `${roomId}_night` } });
      } else {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: `${roomId}_night` } });
      }
    }
  }, []);

  // Sensor loop every 5s
  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      const hour = new Date().getHours();
      const updated = {};
      for (const [roomId, room] of Object.entries(s.rooms)) {
        updated[roomId] = { temp: walkTemp(room.temp, roomId), humidity: walkHumidity(room.humidity), motion: markovMotion(room.motion, roomId, hour) };
      }
      for (const [roomId, data] of Object.entries(updated)) {
        dispatch({ type: 'UPDATE_SENSORS', payload: { roomId, ...data } });
      }
      const fresh = {};
      for (const [roomId, room] of Object.entries(s.rooms)) fresh[roomId] = { ...room, ...updated[roomId] };
      evaluateAnomalies(fresh);
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [evaluateAnomalies]);

  // Screen time countdown
  useEffect(() => {
    const id = setInterval(() => {
      if (stateRef.current.kidSafeEnabled && stateRef.current.screenTimeRemaining > 0) {
        dispatch({ type: 'TICK_SCREEN_TIME' });
      }
    }, 60000);
    return () => clearInterval(id);
  }, []);

  return <HomeContext.Provider value={{ state, dispatch }}>{children}</HomeContext.Provider>;
}

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error('useHome must be used inside HomeProvider');
  return ctx;
}
