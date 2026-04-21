import { View, Text, Modal, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useHome } from '../context/HomeContext';
import { LineChart } from 'react-native-gifted-charts';
import { DEVICE_WATTS } from '../utils/energyCalc';

const ROOM_LABELS = { livingRoom: 'Living Room', bedroom: 'Bedroom', kitchen: 'Kitchen', bathroom: 'Bathroom' };
const DEVICE_ICONS = { lights: '💡', fan: '🌀', ac: '❄️', tv: '📺', stove: '🔥' };

export default function RoomDetailModal({ visible, roomId, room, onClose, onAskAI }) {
  const { dispatch } = useHome();

  const chartData = room.sensorHistory.slice(-20).map((h) => ({
    value: parseFloat(h.temp.toFixed(1)),
  }));

  const activeWatts = Object.entries(room.devices)
    .filter(([, v]) => v === true)
    .reduce((s, [d]) => s + (DEVICE_WATTS[d] ?? 0), 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{ROOM_LABELS[roomId]}</Text>
            <Text style={styles.subtitle}>Room Details</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Sensor cards */}
          <View style={styles.sensorGrid}>
            <View style={[styles.sensorCard, { borderColor: '#fed7aa' }]}>
              <Text style={styles.sensorIcon}>🌡️</Text>
              <Text style={[styles.sensorBig, { color: '#ea580c' }]}>{room.temp.toFixed(1)}°C</Text>
              <Text style={styles.sensorLbl}>Temperature</Text>
            </View>
            <View style={[styles.sensorCard, { borderColor: '#bae6fd' }]}>
              <Text style={styles.sensorIcon}>💧</Text>
              <Text style={[styles.sensorBig, { color: '#0284c7' }]}>{room.humidity.toFixed(0)}%</Text>
              <Text style={styles.sensorLbl}>Humidity</Text>
            </View>
            <View style={[styles.sensorCard, { borderColor: room.motion ? '#a7f3d0' : '#e2e8f0' }]}>
              <Text style={styles.sensorIcon}>🚶</Text>
              <Text style={[styles.sensorBig, { color: room.motion ? '#059669' : '#94a3b8', fontSize: 15 }]}>
                {room.motion ? 'Active' : 'Empty'}
              </Text>
              <Text style={styles.sensorLbl}>Motion</Text>
            </View>
          </View>

          {/* Sparkline */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🌡️  Temperature History</Text>
            {chartData.length > 2 ? (
              <LineChart
                data={chartData}
                height={80}
                width={280}
                color="#f97316"
                thickness={2.5}
                noOfSections={3}
                hideDataPoints
                hideYAxisText
                xAxisColor="#e2e8f0"
                yAxisColor="#e2e8f0"
                rulesColor="#f1f5f9"
                backgroundColor="#ffffff"
                curved
              />
            ) : (
              <Text style={styles.noData}>Collecting data… updates every 5s</Text>
            )}
          </View>

          {/* Devices */}
          <View style={styles.devicesCard}>
            <View style={styles.devicesHeader}>
              <Text style={styles.devicesTitle}>Devices</Text>
              <View style={styles.wattsBadge}>
                <Text style={styles.wattsLabel}>⚡ {activeWatts}W</Text>
              </View>
            </View>
            {Object.entries(room.devices).map(([device, isOn]) => (
              <View key={device} style={[styles.deviceRow, isOn && styles.deviceRowOn]}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceIcon}>{DEVICE_ICONS[device] ?? '🔌'}</Text>
                  <View>
                    <Text style={styles.deviceName}>{device.charAt(0).toUpperCase() + device.slice(1)}</Text>
                    <Text style={[styles.deviceWatts, { color: isOn ? '#f97316' : '#94a3b8' }]}>
                      {isOn ? `${DEVICE_WATTS[device] ?? 0}W` : 'Off'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isOn === true}
                  onValueChange={(v) => dispatch({ type: 'SET_DEVICE', payload: { roomId, device, value: v } })}
                  trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                  thumbColor={isOn ? '#6366f1' : '#94a3b8'}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.aiBtn} onPress={onAskAI}>
            <Text style={styles.aiBtnText}>🤖  Ask AI about this room</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  closeText: { color: '#64748b', fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  sensorGrid: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
  sensorCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 2, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sensorIcon: { fontSize: 22, marginBottom: 4 },
  sensorBig: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sensorLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  chartCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 12, color: '#64748b', fontWeight: '700', marginBottom: 10 },
  noData: { color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 20 },
  devicesCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  devicesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  devicesTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  wattsBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  wattsLabel: { fontSize: 12, color: '#d97706', fontWeight: '700' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  deviceRowOn: { backgroundColor: '#faf5ff', borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8, borderBottomColor: 'transparent' },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deviceIcon: { fontSize: 22 },
  deviceName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  deviceWatts: { fontSize: 11, marginTop: 1 },
  aiBtn: { backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
