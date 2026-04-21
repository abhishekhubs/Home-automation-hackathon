import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHome } from '../../context/HomeContext';
import RoomCard from '../../components/RoomCard';

export default function DashboardScreen() {
  const { state, dispatch } = useHome();
  const router = useRouter();

  const totalRooms = Object.keys(state.rooms).length;
  const activeRooms = Object.values(state.rooms).filter(r => r.motion).length;
  const avgTemp = (Object.values(state.rooms).reduce((s, r) => s + r.temp, 0) / totalRooms).toFixed(1);
  const avgHumidity = (Object.values(state.rooms).reduce((s, r) => s + r.humidity, 0) / totalRooms).toFixed(0);
  const devicesOn = Object.values(state.rooms).reduce((s, r) => s + Object.values(r.devices).filter(v => v === true).length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Digital Twin</Text>
            <Text style={styles.subtitle}>Live sensors · updates every 5s</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeRooms}/{totalRooms}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ea580c' }]}>{avgTemp}°C</Text>
            <Text style={styles.statLabel}>Avg Temp</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#0284c7' }]}>{avgHumidity}%</Text>
            <Text style={styles.statLabel}>Humidity</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#6366f1' }]}>{devicesOn}</Text>
            <Text style={styles.statLabel}>Devices On</Text>
          </View>
        </View>

        {/* Anomalies */}
        {state.anomalies.length > 0 && (
          <View style={styles.anomalyHeader}>
            <Text style={styles.anomalyTitle}>⚠️ {state.anomalies.length} Alert{state.anomalies.length > 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={() => state.anomalies.forEach(a => dispatch({ type: 'MARK_ANOMALY_READ', payload: { id: a.id } }))}>
              <Text style={styles.markRead}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        )}
        {state.anomalies.map(a => (
          <View key={a.id} style={[styles.anomalyItem, a.type === 'danger' && styles.anomalyDanger, a.type === 'info' && styles.anomalyInfo]}>
            <Text style={[styles.anomalyMsg, a.type === 'danger' && { color: '#dc2626' }, a.type === 'info' && { color: '#1d4ed8' }]}>{a.message}</Text>
            <Text style={styles.anomalyTime}>{a.timestamp}</Text>
          </View>
        ))}

        {/* All clear */}
        {state.anomalies.length === 0 && (
          <View style={styles.allClear}>
            <Text style={styles.allClearText}>✅  All systems normal</Text>
          </View>
        )}

        {/* Room Cards */}
        {Object.entries(state.rooms).map(([roomId, room]) => (
          <RoomCard key={roomId} roomId={roomId} room={room} anomalies={state.anomalies} onAskAI={() => router.push('/command')} />
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#6ee7b7' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  statsBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#059669', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  anomalyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  anomalyTitle: { fontSize: 13, color: '#d97706', fontWeight: '700' },
  markRead: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  anomalyItem: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#fcd34d' },
  anomalyDanger: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  anomalyInfo: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  anomalyMsg: { color: '#d97706', fontSize: 13, fontWeight: '600' },
  anomalyTime: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  allClear: { backgroundColor: '#d1fae5', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#6ee7b7', alignItems: 'center' },
  allClearText: { color: '#059669', fontWeight: '700', fontSize: 13 },
});
