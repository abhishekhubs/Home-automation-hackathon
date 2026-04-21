import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Svg, { Rect, Circle, Ellipse } from 'react-native-svg';
import { useState } from 'react';
import RoomDetailModal from './RoomDetailModal';

const ROOM_LABELS = { livingRoom: 'Living Room', bedroom: 'Bedroom', kitchen: 'Kitchen', bathroom: 'Bathroom' };
const ROOM_EMOJIS = { livingRoom: '🛋️', bedroom: '🛏️', kitchen: '🍳', bathroom: '🚿' };

function LivingRoomSVG({ devices }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 80">
      <Rect x="2" y="2" width="116" height="76" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <Rect x="10" y="42" width="55" height="22" rx="4" fill="#cbd5e1"/>
      <Rect x="10" y="36" width="55" height="10" rx="3" fill="#94a3b8"/>
      <Rect x="74" y="28" width="38" height="22" rx="3" fill={devices.tv ? '#6366f1' : '#e2e8f0'} stroke="#c7d2fe" strokeWidth="1"/>
      <Circle cx="60" cy="12" r="7" fill={devices.lights ? '#fbbf24' : '#cbd5e1'}/>
      <Rect x="80" y="6" width="30" height="12" rx="3" fill={devices.ac ? '#38bdf8' : '#e2e8f0'}/>
      <Circle cx="20" cy="14" r="8" fill={devices.fan ? '#a78bfa' : '#e2e8f0'}/>
      <Circle cx="20" cy="14" r="3" fill="#f8fafc"/>
    </Svg>
  );
}

function BedroomSVG({ devices }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 80">
      <Rect x="2" y="2" width="116" height="76" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <Rect x="20" y="28" width="75" height="44" rx="4" fill="#e2e8f0"/>
      <Rect x="20" y="24" width="75" height="14" rx="3" fill="#cbd5e1"/>
      <Rect x="26" y="27" width="22" height="10" rx="3" fill="#94a3b8"/>
      <Rect x="66" y="27" width="22" height="10" rx="3" fill="#94a3b8"/>
      <Rect x="4" y="14" width="26" height="16" rx="3" fill={devices.tv ? '#6366f1' : '#e2e8f0'} stroke="#c7d2fe"/>
      <Circle cx="60" cy="12" r="7" fill={devices.lights ? '#fbbf24' : '#cbd5e1'}/>
      <Rect x="90" y="6" width="24" height="10" rx="3" fill={devices.ac ? '#38bdf8' : '#e2e8f0'}/>
      <Circle cx="100" cy="50" r="7" fill={devices.fan ? '#a78bfa' : '#e2e8f0'}/>
    </Svg>
  );
}

function KitchenSVG({ devices }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 80">
      <Rect x="2" y="2" width="116" height="76" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <Rect x="4" y="42" width="112" height="7" rx="2" fill="#cbd5e1"/>
      <Rect x="10" y="49" width="40" height="26" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Circle cx="22" cy="60" r="7" fill={devices.stove ? '#ef4444' : '#e2e8f0'}/>
      <Circle cx="42" cy="60" r="7" fill={devices.stove ? '#f97316' : '#e2e8f0'}/>
      <Rect x="58" y="49" width="56" height="26" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Ellipse cx="86" cy="62" rx="18" ry="10" fill="#e2e8f0"/>
      <Rect x="4" y="6" width="22" height="32" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Circle cx="60" cy="12" r="7" fill={devices.lights ? '#fbbf24' : '#cbd5e1'}/>
      <Circle cx="100" cy="12" r="6" fill={devices.fan ? '#a78bfa' : '#e2e8f0'}/>
    </Svg>
  );
}

function BathroomSVG({ devices }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 120 80">
      <Rect x="2" y="2" width="116" height="76" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <Ellipse cx="42" cy="58" rx="34" ry="17" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Ellipse cx="42" cy="55" rx="28" ry="11" fill="#bae6fd"/>
      <Ellipse cx="94" cy="60" rx="16" ry="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Ellipse cx="94" cy="54" rx="12" ry="9" fill="#e2e8f0"/>
      <Ellipse cx="94" cy="26" rx="15" ry="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Circle cx="30" cy="12" r="7" fill={devices.lights ? '#fbbf24' : '#cbd5e1'}/>
      <Circle cx="18" cy="12" r="6" fill={devices.fan ? '#a78bfa' : '#e2e8f0'}/>
    </Svg>
  );
}

const SVG_MAP = { livingRoom: LivingRoomSVG, bedroom: BedroomSVG, kitchen: KitchenSVG, bathroom: BathroomSVG };

function computeHealth(roomId, room, anomalies) {
  let score = 100;
  for (const a of anomalies) {
    if (!a.id.includes(roomId)) continue;
    if (a.type === 'danger') score -= 30;
    if (a.type === 'warning') score -= 15;
    if (a.type === 'info') score -= 5;
  }
  if (room.humidity > 75) score -= 10;
  if (room.temp > 35) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function healthColors(score) {
  if (score >= 80) return { border: '#10b981', badge: '#d1fae5', text: '#059669' };
  if (score >= 50) return { border: '#f59e0b', badge: '#fef3c7', text: '#d97706' };
  return { border: '#ef4444', badge: '#fee2e2', text: '#dc2626' };
}

export default function RoomCard({ roomId, room, anomalies, onAskAI }) {
  const [showDetail, setShowDetail] = useState(false);
  const score = computeHealth(roomId, room, anomalies);
  const colors = healthColors(score);
  const SvgComp = SVG_MAP[roomId];
  const hasAnomaly = anomalies.some(a => a.id.includes(roomId));

  return (
    <>
      <TouchableOpacity style={[styles.card, { borderColor: colors.border }]} onPress={() => setShowDetail(true)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.roomEmoji}>{ROOM_EMOJIS[roomId]}</Text>
            <Text style={styles.roomLabel}>{ROOM_LABELS[roomId]}</Text>
            {hasAnomaly && <View style={styles.alertDot} />}
          </View>
          <View style={[styles.healthBadge, { backgroundColor: colors.badge }]}>
            <Text style={[styles.healthScore, { color: colors.text }]}>{score}</Text>
          </View>
        </View>

        <View style={styles.svgContainer}>
          {SvgComp && <SvgComp devices={room.devices} />}
        </View>

        <View style={styles.sensorRow}>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>🌡️</Text>
            <Text style={[styles.sensorValue, { color: '#f97316' }]}>{room.temp.toFixed(1)}°C</Text>
          </View>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>💧</Text>
            <Text style={[styles.sensorValue, { color: '#0284c7' }]}>{room.humidity.toFixed(0)}%</Text>
          </View>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>🚶</Text>
            <Text style={[styles.sensorValue, { color: room.motion ? '#059669' : '#94a3b8' }]}>
              {room.motion ? 'Active' : 'Empty'}
            </Text>
          </View>
        </View>

        <View style={styles.deviceRow}>
          {Object.entries(room.devices).map(([dev, on]) => (
            <View key={dev} style={[styles.deviceChip, on === true && styles.deviceChipOn]}>
              <View style={[styles.dot, on === true && styles.dotOn]} />
              <Text style={[styles.deviceText, on === true && styles.deviceTextOn]}>
                {dev.charAt(0).toUpperCase() + dev.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      <RoomDetailModal visible={showDetail} roomId={roomId} room={room} onClose={() => setShowDetail(false)} onAskAI={() => { setShowDetail(false); onAskAI?.(roomId); }} />
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 2, padding: 14, marginBottom: 12, shadowColor: '#6366f1', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomEmoji: { fontSize: 18 },
  roomLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 4 },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  healthScore: { fontSize: 12, fontWeight: '800' },
  svgContainer: { height: 110, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f8fafc', marginBottom: 12 },
  sensorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sensorItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sensorLabel: { fontSize: 13 },
  sensorValue: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  deviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  deviceChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#e2e8f0' },
  deviceChipOn: { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotOn: { backgroundColor: '#6366f1' },
  deviceText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  deviceTextOn: { color: '#6366f1' },
});
