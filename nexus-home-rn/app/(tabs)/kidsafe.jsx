import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '../../context/HomeContext';

const LOCKABLE = [
  { key: 'bedroom.tv',     label: 'Bedroom TV',     emoji: '📺' },
  { key: 'bedroom.lights', label: 'Bedroom Lights', emoji: '💡' },
  { key: 'bedroom.fan',    label: 'Bedroom Fan',    emoji: '🌀' },
  { key: 'livingRoom.tv',  label: 'Living Room TV', emoji: '📺' },
  { key: 'bedroom.ac',     label: 'Bedroom AC',     emoji: '❄️' },
];

function ParentConfig() {
  const { state, dispatch } = useHome();
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Device Locks */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔒 Device Locks</Text>
        {LOCKABLE.map(d => {
          const isLocked = state.lockedDevices.includes(d.key);
          return (
            <TouchableOpacity key={d.key} style={[styles.lockRow, isLocked && styles.lockRowLocked]} onPress={() => dispatch({ type: 'TOGGLE_LOCKED_DEVICE', payload: d.key })}>
              <View style={styles.lockLeft}>
                <Text style={styles.lockEmoji}>{d.emoji}</Text>
                <Text style={[styles.lockLabel, isLocked && { color: '#dc2626' }]}>{d.label}</Text>
              </View>
              <Text style={styles.lockIcon}>{isLocked ? '🔒' : '🔓'}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.hint}>Tap to lock/unlock. Locked devices show padlock in Child View.</Text>
      </View>

      {/* Time Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏰ Time Controls</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Screen Time Limit</Text>
          <Text style={[styles.label, { color: '#6366f1', fontWeight: '800' }]}>{state.screenTimeMinutes} min</Text>
        </View>
        <Slider style={styles.slider} minimumValue={0} maximumValue={480} step={15} value={state.screenTimeMinutes} onValueChange={v => dispatch({ type: 'SET_SCREEN_TIME', payload: v })} minimumTrackTintColor="#6366f1" maximumTrackTintColor="#e2e8f0" thumbTintColor="#6366f1" />
        <View style={[styles.statBox, { borderColor: state.screenTimeRemaining <= 15 ? '#fca5a5' : '#c7d2fe' }]}>
          <Text style={styles.statBoxLabel}>Time Remaining</Text>
          <Text style={[styles.statBoxValue, { color: state.screenTimeRemaining <= 15 ? '#dc2626' : '#6366f1' }]}>
            {Math.floor(state.screenTimeRemaining / 60)}h {state.screenTimeRemaining % 60}m
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>📚 Study Mode</Text>
            <Text style={styles.hint}>Locks TV + speaker in all rooms</Text>
          </View>
          <Switch value={state.studyMode} onValueChange={v => dispatch({ type: 'SET_STUDY_MODE', payload: v })} trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }} thumbColor={state.studyMode ? '#6366f1' : '#94a3b8'} />
        </View>
      </View>

      {/* Monitoring */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Monitoring</Text>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Child Location</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={[styles.motionDot, { backgroundColor: state.rooms.bedroom.motion ? '#10b981' : '#cbd5e1' }]} />
            <Text style={[styles.statBoxValue, { color: state.rooms.bedroom.motion ? '#059669' : '#94a3b8', fontSize: 15 }]}>
              {state.rooms.bedroom.motion ? 'Bedroom Occupied' : 'Not Detected'}
            </Text>
          </View>
        </View>
        {state.parentRequests.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>🔔 Unlock Requests ({state.parentRequests.length})</Text>
            {state.parentRequests.map(r => (
              <View key={r.id} style={styles.requestRow}>
                <Text style={styles.requestText}>Unlock: {r.device} at {r.ts}</Text>
                <TouchableOpacity onPress={() => dispatch({ type: 'CLEAR_PARENT_REQUEST', payload: r.id })}>
                  <Text style={styles.dismissIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.sectionLabel}>🚶 Motion Log</Text>
        {Object.entries(state.rooms).flatMap(([roomId, room]) =>
          room.motionLog.slice(-3).map((log, i) => (
            <View key={`${roomId}-${i}`} style={styles.logRow}>
              <View style={[styles.logDot, { backgroundColor: log.entered ? '#10b981' : '#94a3b8' }]} />
              <Text style={styles.logTime}>{log.ts}</Text>
              <Text style={styles.logText}>{log.entered ? 'Entered' : 'Left'} {roomId}</Text>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ChildView() {
  const { state, dispatch } = useHome();
  const devices = state.rooms.bedroom?.devices ?? {};
  const milestones = { 5: '🌟 Starter', 10: '⭐ Helper', 20: '💫 Champion' };
  const milestone = Object.entries(milestones).filter(([n]) => state.kidStars >= Number(n)).slice(-1)[0];
  const DEVICE_EMOJIS = { lights: '💡', fan: '🌀', ac: '❄️', tv: '📺' };

  const handleToggle = (device) => {
    const lockKey = `bedroom.${device}`;
    if (state.lockedDevices.includes(lockKey)) {
      dispatch({ type: 'ADD_PARENT_REQUEST', payload: device });
      Alert.alert('🔒 Locked!', 'This device is locked. Your parent will get notified.');
      return;
    }
    const newVal = !devices[device];
    dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device, value: newVal } });
    if (!newVal) dispatch({ type: 'ADD_KID_STAR' });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.childGreeting}>
        <Text style={styles.childGreetingText}>👋 Hi there!</Text>
        <Text style={styles.childGreetingSubtitle}>Control your room</Text>
      </View>

      {/* Stars */}
      <View style={styles.starsCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.starsTitle}>⭐ My Stars</Text>
          <Text style={styles.starsCount}>{state.kidStars}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
          {Array.from({ length: Math.min(state.kidStars, 20) }).map((_, i) => <Text key={i} style={{ fontSize: 14 }}>⭐</Text>)}
        </View>
        {milestone && <Text style={styles.milestoneText}>{milestone[1]}</Text>}
        <Text style={styles.starsHint}>Turn off a device to earn a star! 🌟</Text>
      </View>

      {/* Screen time */}
      <View style={[styles.screenTimeCard, state.screenTimeRemaining <= 15 && { borderColor: '#fca5a5', backgroundColor: '#fff5f5' }]}>
        <Text style={styles.starsTitle}>🕒 Screen Time Left</Text>
        <Text style={[styles.starsCount, { color: state.screenTimeRemaining <= 15 ? '#dc2626' : '#6366f1' }]}>
          {Math.floor(state.screenTimeRemaining / 60)}h {state.screenTimeRemaining % 60}m
        </Text>
      </View>

      {/* Device grid */}
      <View style={styles.childGrid}>
        {Object.entries(devices).map(([device, on]) => {
          const lockKey = `bedroom.${device}`;
          const isLocked = state.lockedDevices.includes(lockKey);
          return (
            <TouchableOpacity key={device} style={[styles.childCard, on && !isLocked && styles.childCardOn, isLocked && styles.childCardLocked]} onPress={() => handleToggle(device)} activeOpacity={0.8}>
              <Text style={styles.childCardEmoji}>{DEVICE_EMOJIS[device] ?? '🔌'}</Text>
              <Text style={styles.childCardName}>{device.charAt(0).toUpperCase() + device.slice(1)}</Text>
              <Text style={[styles.childCardState, isLocked ? { color: '#ef4444' } : on ? { color: '#6366f1' } : { color: '#94a3b8' }]}>
                {isLocked ? '🔒' : on ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function KidSafeScreen() {
  const { state, dispatch } = useHome();
  const [view, setView] = useState('parent');
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>KidSafe</Text>
            <Text style={styles.subtitle}>Parental controls & monitoring</Text>
          </View>
          <Switch value={state.kidSafeEnabled} onValueChange={v => dispatch({ type: 'SET_KID_SAFE', payload: v })} trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }} thumbColor={state.kidSafeEnabled ? '#6366f1' : '#94a3b8'} />
        </View>

        <View style={styles.switcher}>
          {[{ id: 'parent', label: 'Parent Config' }, { id: 'child', label: 'Child View' }].map(({ id, label }) => (
            <TouchableOpacity key={id} style={[styles.switchBtn, view === id && styles.switchBtnActive]} onPress={() => setView(id)}>
              <Text style={[styles.switchText, view === id && styles.switchTextActive]}>{label}</Text>
              {id === 'parent' && state.parentRequests.length > 0 && (
                <View style={styles.switchBadge}><Text style={styles.switchBadgeText}>{state.parentRequests.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {view === 'parent' ? <ParentConfig /> : <ChildView />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  switcher: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: '#ffffff', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', position: 'relative' },
  switchBtnActive: { backgroundColor: '#6366f1' },
  switchText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  switchTextActive: { color: '#ffffff' },
  switchBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  switchBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14 },
  lockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  lockRowLocked: { backgroundColor: '#fff5f5', borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8, borderBottomColor: 'transparent' },
  lockLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockEmoji: { fontSize: 22 },
  lockLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  lockIcon: { fontSize: 18 },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  slider: { marginVertical: 4 },
  statBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1.5, borderColor: '#c7d2fe' },
  statBoxLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  statBoxValue: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  motionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 6 },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#fcd34d' },
  requestText: { color: '#d97706', fontSize: 12, fontWeight: '600', flex: 1 },
  dismissIcon: { color: '#94a3b8', fontSize: 16, marginLeft: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logTime: { fontSize: 10, color: '#94a3b8', fontVariant: ['tabular-nums'], width: 64 },
  logText: { fontSize: 12, color: '#64748b' },
  childGreeting: { alignItems: 'center', paddingVertical: 18, backgroundColor: '#ede9fe', borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#c4b5fd' },
  childGreetingText: { fontSize: 28, fontWeight: '900', color: '#4f46e5' },
  childGreetingSubtitle: { fontSize: 13, color: '#7c3aed', marginTop: 4 },
  starsCard: { backgroundColor: '#fefce8', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#fde68a' },
  starsTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  starsCount: { fontSize: 28, fontWeight: '900', color: '#d97706', fontVariant: ['tabular-nums'] },
  milestoneText: { color: '#d97706', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  starsHint: { fontSize: 11, color: '#92400e' },
  screenTimeCard: { backgroundColor: '#ede9fe', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: '#c4b5fd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  childGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  childCard: { width: '47%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  childCardOn: { borderColor: '#6366f1', backgroundColor: '#f5f3ff' },
  childCardLocked: { opacity: 0.6, borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  childCardEmoji: { fontSize: 40, marginBottom: 8 },
  childCardName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  childCardState: { fontSize: 13, fontWeight: '700' },
});
