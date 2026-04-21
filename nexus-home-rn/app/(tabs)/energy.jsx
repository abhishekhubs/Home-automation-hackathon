import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '../../context/HomeContext';
import { computeTotalWatts, computeCostPerHour, computeDailyCost, loadPercentage, DEVICE_WATTS, DEVICE_TIERS } from '../../utils/energyCalc';

const TIER_COLORS = {
  essential: { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', dot: '#ef4444' },
  normal:    { bg: '#fef3c7', border: '#fcd34d', text: '#d97706', dot: '#f59e0b' },
  luxury:    { bg: '#d1fae5', border: '#6ee7b7', text: '#059669', dot: '#10b981' },
};

const GLOBAL_LABELS = {
  refrigerator: 'Refrigerator', router: 'Router', securityCam: 'Security Camera',
  washingMachine: 'Washing Machine', oven: 'Oven', speaker: 'Speaker', decorativeLights: 'Deco Lights',
};

function DeviceCard({ name, watts, on, tier, onToggle, peakHour }) {
  const tc = TIER_COLORS[tier] ?? TIER_COLORS.normal;
  const isEssential = tier === 'essential';
  return (
    <View style={[styles.deviceCard, on && { borderColor: '#a5b4fc', backgroundColor: '#f5f3ff' }]}>
      <View style={styles.deviceCardTop}>
        <Text style={styles.deviceName} numberOfLines={1}>{name}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
          <View style={[styles.tierDot, { backgroundColor: tc.dot }]} />
          <Text style={[styles.tierText, { color: tc.text }]}>{tier}</Text>
        </View>
      </View>
      <View style={styles.deviceCardBot}>
        <View>
          <Text style={[styles.deviceWatts, { color: on ? '#ea580c' : '#94a3b8' }]}>{on ? `${watts}W` : '—'}</Text>
          {peakHour && on && <Text style={styles.peakLabel}>⚡ 2× peak</Text>}
        </View>
        {!isEssential
          ? <Switch value={on} onValueChange={onToggle} trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }} thumbColor={on ? '#6366f1' : '#94a3b8'} />
          : <View style={styles.lockBadge}><Text style={styles.lockText}>🔒</Text></View>
        }
      </View>
    </View>
  );
}

export default function EnergyScreen() {
  const { state, dispatch } = useHome();
  const [showPanic, setShowPanic] = useState(false);
  const [shedMsg, setShedMsg] = useState('');

  const totalWatts = computeTotalWatts(state.rooms, state.globalDevices);
  const loadPct = loadPercentage(totalWatts, state.energyBudget);
  const costPerHour = computeCostPerHour(totalWatts, state.peakHourActive);
  const dailyCost = computeDailyCost(totalWatts, state.peakHourActive);

  const gaugeColor = loadPct > 90 ? '#ef4444' : loadPct > 70 ? '#f59e0b' : '#10b981';
  const gaugePct = Math.min(loadPct, 100);

  useEffect(() => {
    if (loadPct > 95) {
      dispatch({ type: 'SHED_LUXURY' });
      setShedMsg('⚡ Auto-shed: luxury devices removed');
      setTimeout(() => setShedMsg(''), 4000);
    }
    if (loadPct > 100) dispatch({ type: 'SHED_NORMAL' });
  }, [loadPct]);

  const roomDevices = [];
  for (const [roomId, room] of Object.entries(state.rooms)) {
    for (const [device, on] of Object.entries(room.devices)) {
      const name = `${roomId.replace(/([A-Z])/g, ' $1').trim()} ${device}`;
      roomDevices.push({ key: `${roomId}.${device}`, name: name.charAt(0).toUpperCase() + name.slice(1), watts: DEVICE_WATTS[device] ?? 0, on: on === true, tier: DEVICE_TIERS[device] ?? 'normal', roomId, device });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Energy Auction</Text>
            <Text style={styles.subtitle}>Real-time power budget</Text>
          </View>
          <TouchableOpacity style={[styles.peakBtn, state.peakHourActive && styles.peakBtnActive]} onPress={() => dispatch({ type: 'SET_PEAK_HOUR', payload: !state.peakHourActive })}>
            <Text style={[styles.peakBtnText, state.peakHourActive && { color: '#dc2626' }]}>⚡ Peak {state.peakHourActive ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>

        {/* Gauge card */}
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeTitle}>⚡ Power Budget</Text>
            <Text style={styles.gaugeWatts}>{totalWatts}W / {state.energyBudget}W</Text>
          </View>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${gaugePct}%`, backgroundColor: gaugeColor }]} />
          </View>
          <Text style={[styles.gaugePct, { color: gaugeColor }]}>{loadPct.toFixed(1)}% load</Text>

          {shedMsg ? (
            <View style={styles.shedAlert}><Text style={styles.shedText}>{shedMsg}</Text></View>
          ) : loadPct > 90 ? (
            <View style={styles.critAlert}><Text style={styles.critText}>⚠️ Critical — auto-shedding luxury devices</Text></View>
          ) : loadPct > 70 ? (
            <View style={styles.warnAlert}><Text style={styles.warnText}>⚠️ High load — consider turning off devices</Text></View>
          ) : (
            <View style={styles.okAlert}><Text style={styles.okText}>✅ Load is healthy</Text></View>
          )}

          <View style={styles.costRow}>
            <View style={styles.costItem}>
              <Text style={styles.costValue}>₹{costPerHour.toFixed(2)}</Text>
              <Text style={styles.costLabel}>per hour</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={[styles.costValue, { color: '#7c3aed' }]}>₹{dailyCost.toFixed(0)}</Text>
              <Text style={styles.costLabel}>daily est.</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={[styles.costValue, { color: '#059669' }]}>₹{state.aiSavings.toFixed(2)}</Text>
              <Text style={styles.costLabel}>AI saved</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>GLOBAL APPLIANCES</Text>
        <View style={styles.deviceGrid}>
          {Object.entries(state.globalDevices).map(([device, info]) => (
            <DeviceCard key={device} name={GLOBAL_LABELS[device] ?? device} watts={info.watts} on={info.on} tier={DEVICE_TIERS[device] ?? 'normal'} peakHour={state.peakHourActive} onToggle={() => dispatch({ type: 'SET_GLOBAL_DEVICE', payload: { device, value: !info.on } })} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>ROOM DEVICES</Text>
        <View style={styles.deviceGrid}>
          {roomDevices.map(d => (
            <DeviceCard key={d.key} name={d.name} watts={d.watts} on={d.on} tier={d.tier} peakHour={state.peakHourActive} onToggle={() => dispatch({ type: 'SET_DEVICE', payload: { roomId: d.roomId, device: d.device, value: !d.on } })} />
          ))}
        </View>

        <TouchableOpacity style={styles.panicBtn} onPress={() => setShowPanic(true)}>
          <Text style={styles.panicBtnText}>🛡️  Emergency Cut — All Non-Essential Power</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showPanic} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>🛡️</Text>
            <Text style={styles.modalTitle}>Activate Emergency Mode?</Text>
            <Text style={styles.modalDesc}>Cuts all non-essential power and activates security mode.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPanic(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => { dispatch({ type: 'ALL_OFF' }); setShowPanic(false); }}><Text style={styles.confirmText}>⚠️ Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  peakBtn: { backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  peakBtnActive: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  peakBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  gaugeCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gaugeTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  gaugeWatts: { fontSize: 14, fontWeight: '800', color: '#1e293b', fontVariant: ['tabular-nums'] },
  gaugeTrack: { height: 14, backgroundColor: '#f1f5f9', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  gaugeFill: { height: '100%', borderRadius: 8 },
  gaugePct: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  shedAlert: { backgroundColor: '#ede9fe', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#c4b5fd' },
  shedText: { color: '#6366f1', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  critAlert: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#fca5a5' },
  critText: { color: '#dc2626', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  warnAlert: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#fcd34d' },
  warnText: { color: '#d97706', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  okAlert: { backgroundColor: '#d1fae5', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#6ee7b7' },
  okText: { color: '#059669', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  costRow: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  costItem: { flex: 1, alignItems: 'center' },
  costValue: { fontSize: 20, fontWeight: '800', color: '#6366f1', fontVariant: ['tabular-nums'] },
  costLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  costDivider: { width: 1, backgroundColor: '#e2e8f0' },
  sectionTitle: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  deviceGrid: { gap: 10, marginBottom: 20 },
  deviceCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  deviceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  deviceName: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 8 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  deviceCardBot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deviceWatts: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  peakLabel: { fontSize: 10, color: '#dc2626', marginTop: 2, fontWeight: '600' },
  lockBadge: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8 },
  lockText: { fontSize: 16 },
  panicBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#fca5a5', marginTop: 4 },
  panicBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 28, width: '100%', borderWidth: 2, borderColor: '#fca5a5', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  modalIcon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  cancelText: { color: '#64748b', fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' },
});
