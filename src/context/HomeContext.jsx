import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { walkTemp, walkHumidity, markovMotion } from '../utils/sensorSim';

// ─── Initial State ────────────────────────────────────────────────────────────
const makeRoom = (temp, humidity, motion, devices) => ({
  temp,
  humidity,
  motion,
  motionSince: null,       // timestamp when motion last changed
  sensorHistory: [],        // [{temp, humidity, ts}] last 30 ticks
  motionLog: [],            // [{entered: bool, ts: string}] for KidSafe
  devices,
});

const INITIAL_STATE = {
  rooms: {
    livingRoom: makeRoom(24, 52, false, { lights: false, fan: false, ac: false, tv: false }),
    bedroom:    makeRoom(22, 48, false, { lights: false, fan: false, ac: false, tv: false }),
    kitchen:    makeRoom(26, 55, false, { lights: false, fan: false, stove: false }),
    bathroom:   makeRoom(25, 60, false, { lights: false, fan: false }),
  },
  // Global appliances (not room-specific)
  globalDevices: {
    refrigerator: { on: true,  watts: 150 },
    router:       { on: true,  watts: 20  },
    securityCam:  { on: false, watts: 30  },
    washingMachine:{ on: false, watts: 800 },
    oven:         { on: false, watts: 2000 },
    speaker:      { on: false, watts: 50  },
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
  // KidSafe
  lockedDevices: [],        // ['bedroom.tv', 'bedroom.lights']
  screenTimeMinutes: 120,
  screenTimeRemaining: 120,
  bedtime: '21:00',
  studyMode: false,
  kidStars: 0,
  parentRequests: [],
  // CareWatch
  medicationSchedule: ['08:00', '13:00', '20:00'],
  medicationConfirmed: {},  // { '08:00': true }
  medicalNotes: '',
  careContacts: [
    { name: 'Priya (Daughter)', role: 'Primary Caregiver', phone: '+91-98765-43210' },
    { name: 'Dr. Sharma',       role: 'Family Doctor',     phone: '+91-98765-12345' },
  ],
  // AI
  apiKey: '',
  aiSavings: 0,
  shedHistory: [],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
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
            devices: {
              ...state.rooms[roomId].devices,
              [device]: value,
            },
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
      const { actions } = action.payload;
      let rooms = { ...state.rooms };
      for (const act of actions) {
        if (!rooms[act.room]) continue;
        if (act.device === undefined) continue;
        rooms = {
          ...rooms,
          [act.room]: {
            ...rooms[act.room],
            devices: {
              ...rooms[act.room].devices,
              [act.device]: act.state,
            },
          },
        };
      }
      return { ...state, rooms };
    }

    case 'UPDATE_SENSORS': {
      const { roomId, temp, humidity, motion } = action.payload;
      const room = state.rooms[roomId];
      const now = Date.now();
      const newHistory = [
        ...room.sensorHistory.slice(-29),
        { temp, humidity, ts: now },
      ];
      const motionChanged = motion !== room.motion;
      const newMotionLog = motionChanged
        ? [...room.motionLog.slice(-49), { entered: motion, ts: new Date().toLocaleTimeString() }]
        : room.motionLog;
      return {
        ...state,
        rooms: {
          ...state.rooms,
          [roomId]: {
            ...room,
            temp,
            humidity,
            motion,
            motionSince: motionChanged ? now : room.motionSince,
            sensorHistory: newHistory,
            motionLog: newMotionLog,
          },
        },
      };
    }

    case 'SET_ANOMALY': {
      const { id, message, type } = action.payload;
      const existing = state.anomalies.findIndex(a => a.id === id);
      if (existing >= 0) return state; // already present
      return {
        ...state,
        anomalies: [
          ...state.anomalies,
          { id, message, type, timestamp: new Date().toLocaleTimeString(), read: false },
        ],
      };
    }

    case 'CLEAR_ANOMALY': {
      return {
        ...state,
        anomalies: state.anomalies.filter(a => a.id !== action.payload.id),
      };
    }

    case 'MARK_ANOMALY_READ': {
      return {
        ...state,
        anomalies: state.anomalies.map(a =>
          a.id === action.payload.id ? { ...a, read: true } : a
        ),
      };
    }

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

    case 'ADD_COMMAND': {
      const cmd = action.payload;
      return {
        ...state,
        commandHistory: [cmd, ...state.commandHistory].slice(0, 10),
      };
    }

    case 'ELDER_CHECK_IN':
      return { ...state, elderCheckInTime: new Date().toISOString() };

    case 'ADD_CARE_ALERT': {
      return {
        ...state,
        careAlerts: [
          { message: action.payload, timestamp: new Date().toISOString(), id: Date.now() },
          ...state.careAlerts,
        ].slice(0, 50),
      };
    }

    case 'SET_ENERGY_BUDGET':
      return { ...state, energyBudget: action.payload };

    case 'SHED_LUXURY': {
      // Turn off all luxury devices in rooms
      let rooms = { ...state.rooms };
      const luxuryRoomDevices = ['tv'];
      for (const roomId of Object.keys(rooms)) {
        const newDevices = { ...rooms[roomId].devices };
        for (const d of luxuryRoomDevices) {
          if (d in newDevices) newDevices[d] = false;
        }
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: newDevices } };
      }
      // Global luxury
      const globalDevices = { ...state.globalDevices };
      globalDevices.decorativeLights = { ...globalDevices.decorativeLights, on: false };
      globalDevices.speaker = { ...globalDevices.speaker, on: false };
      return { ...state, rooms, globalDevices };
    }

    case 'SHED_NORMAL': {
      let rooms = { ...state.rooms };
      for (const roomId of Object.keys(rooms)) {
        const newDevices = { ...rooms[roomId].devices };
        // Keep AC if temp > 30
        if (rooms[roomId].temp <= 30 && newDevices.ac !== undefined) newDevices.ac = false;
        if (newDevices.fan !== undefined) newDevices.fan = false;
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: newDevices } };
      }
      const globalDevices = { ...state.globalDevices };
      globalDevices.washingMachine = { ...globalDevices.washingMachine, on: false };
      return { ...state, rooms, globalDevices };
    }

    case 'ALL_OFF': {
      let rooms = { ...state.rooms };
      for (const roomId of Object.keys(rooms)) {
        const newDevices = {};
        for (const d of Object.keys(rooms[roomId].devices)) newDevices[d] = false;
        rooms = { ...rooms, [roomId]: { ...rooms[roomId], devices: newDevices } };
      }
      const globalDevices = {};
      for (const [k, v] of Object.entries(state.globalDevices)) {
        if (k === 'refrigerator' || k === 'router') {
          globalDevices[k] = v; // Essential — keep on
        } else {
          globalDevices[k] = { ...v, on: false };
        }
      }
      return { ...state, rooms, globalDevices, homeSecurity: true };
    }

    case 'TOGGLE_LOCKED_DEVICE': {
      const key = action.payload;
      const locked = state.lockedDevices.includes(key)
        ? state.lockedDevices.filter(d => d !== key)
        : [...state.lockedDevices, key];
      return { ...state, lockedDevices: locked };
    }

    case 'SET_SCREEN_TIME':
      return { ...state, screenTimeMinutes: action.payload, screenTimeRemaining: action.payload };

    case 'TICK_SCREEN_TIME':
      return {
        ...state,
        screenTimeRemaining: Math.max(0, state.screenTimeRemaining - 1),
      };

    case 'SET_BEDTIME':
      return { ...state, bedtime: action.payload };

    case 'SET_STUDY_MODE':
      return { ...state, studyMode: action.payload };

    case 'ADD_KID_STAR':
      return { ...state, kidStars: state.kidStars + 1 };

    case 'ADD_PARENT_REQUEST': {
      return {
        ...state,
        parentRequests: [
          ...state.parentRequests,
          { device: action.payload, ts: new Date().toLocaleTimeString(), id: Date.now() },
        ],
      };
    }

    case 'CLEAR_PARENT_REQUEST':
      return {
        ...state,
        parentRequests: state.parentRequests.filter(r => r.id !== action.payload),
      };

    case 'SET_MEDICATION_SCHEDULE':
      return { ...state, medicationSchedule: action.payload };

    case 'CONFIRM_MEDICATION': {
      return {
        ...state,
        medicationConfirmed: { ...state.medicationConfirmed, [action.payload]: true },
      };
    }

    case 'SET_MEDICAL_NOTES':
      return { ...state, medicalNotes: action.payload };

    case 'ADD_AI_SAVINGS':
      return { ...state, aiSavings: state.aiSavings + action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const HomeContext = createContext(null);

export function HomeProvider({ children }) {
  const [state, dispatch] = useReducer(homeReducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track consecutive no-motion ticks per room (for anomaly engine)
  const noMotionTicks = useRef({ livingRoom: 0, bedroom: 0, kitchen: 0, bathroom: 0 });

  // ─── Anomaly Engine ────────────────────────────────────────────────────────
  const evaluateAnomalies = useCallback((rooms) => {
    const hour = new Date().getHours();

    for (const [roomId, room] of Object.entries(rooms)) {
      // Track no-motion ticks (each tick = 5s)
      if (!room.motion) {
        noMotionTicks.current[roomId] = (noMotionTicks.current[roomId] ?? 0) + 1;
      } else {
        noMotionTicks.current[roomId] = 0;
      }

      const noMotionSeconds = (noMotionTicks.current[roomId] ?? 0) * 5;

      // Kitchen fire risk: temp > 40 + no motion for 5 min
      if (roomId === 'kitchen' && room.temp > 40 && noMotionSeconds >= 300) {
        dispatch({
          type: 'SET_ANOMALY',
          payload: {
            id: 'kitchen_fire_risk',
            type: 'danger',
            message: '🔥 Fire risk — kitchen unattended',
          },
        });
      } else if (roomId === 'kitchen' && !(room.temp > 40 && noMotionSeconds >= 300)) {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: 'kitchen_fire_risk' } });
      }

      // Bathroom inactivity alert: no motion for 4+ hours
      if (roomId === 'bathroom' && noMotionSeconds >= 14400) {
        dispatch({
          type: 'SET_ANOMALY',
          payload: {
            id: 'bathroom_inactivity',
            type: 'warning',
            message: '👴 Inactivity alert — check on elderly',
          },
        });
      }

      // Bedroom mold risk: humidity > 80%
      if (roomId === 'bedroom' && room.humidity > 80) {
        dispatch({
          type: 'SET_ANOMALY',
          payload: {
            id: 'bedroom_mold',
            type: 'warning',
            message: '💧 Mold risk — consider ventilation',
          },
        });
      } else if (roomId === 'bedroom' && room.humidity <= 80) {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: 'bedroom_mold' } });
      }

      // Night device anomaly: 1AM–5AM, devices ON, no motion
      if (hour >= 1 && hour < 5 && !room.motion) {
        const anyOn = Object.values(room.devices).some(v => v === true);
        if (anyOn) {
          dispatch({
            type: 'SET_ANOMALY',
            payload: {
              id: `${roomId}_night_devices`,
              type: 'info',
              message: `🌙 Unusual — devices on at night in ${roomId}`,
            },
          });
        } else {
          dispatch({ type: 'CLEAR_ANOMALY', payload: { id: `${roomId}_night_devices` } });
        }
      } else {
        dispatch({ type: 'CLEAR_ANOMALY', payload: { id: `${roomId}_night_devices` } });
      }
    }
  }, []);

  // ─── Sensor Simulation Loop (every 5s) ────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      const hour = new Date().getHours();
      const updatedRooms = {};

      for (const [roomId, room] of Object.entries(s.rooms)) {
        const newTemp = walkTemp(room.temp, roomId);
        const newHumidity = walkHumidity(room.humidity);
        const newMotion = markovMotion(room.motion, roomId, hour);
        updatedRooms[roomId] = { temp: newTemp, humidity: newHumidity, motion: newMotion };
      }

      // Dispatch all sensor updates
      for (const [roomId, data] of Object.entries(updatedRooms)) {
        dispatch({
          type: 'UPDATE_SENSORS',
          payload: { roomId, ...data },
        });
      }

      // Evaluate anomalies with fresh room data
      const freshRooms = {};
      for (const [roomId, room] of Object.entries(s.rooms)) {
        freshRooms[roomId] = { ...room, ...updatedRooms[roomId] };
      }
      evaluateAnomalies(freshRooms);
    };

    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [evaluateAnomalies]);

  // ─── Screen time countdown (every 60s) ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (stateRef.current.kidSafeEnabled && stateRef.current.screenTimeRemaining > 0) {
        dispatch({ type: 'TICK_SCREEN_TIME' });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Bedtime automation ───────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const s = stateRef.current;
      if (!s.kidSafeEnabled || !s.bedtime) return;
      const now = new Date();
      const [bh, bm] = s.bedtime.split(':').map(Number);
      if (now.getHours() === bh && now.getMinutes() === bm) {
        // Dim lights, set AC, lock entertainment
        for (const roomId of ['livingRoom', 'bedroom']) {
          if (s.rooms[roomId]?.devices?.lights !== undefined) {
            dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'lights', value: true } });
          }
          if (s.rooms[roomId]?.devices?.tv !== undefined) {
            dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'tv', value: false } });
          }
          if (s.rooms[roomId]?.devices?.ac !== undefined) {
            dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'ac', value: true } });
          }
        }
      }
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const value = { state, dispatch };
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error('useHome must be used within HomeProvider');
  return ctx;
}
