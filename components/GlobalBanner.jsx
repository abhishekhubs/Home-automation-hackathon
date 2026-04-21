import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useHome } from '../context/HomeContext';

export default function GlobalBanner() {
  const { state, dispatch } = useHome();
  if (!state.homeSecurity && !state.anomalies.some(a => a.type === 'danger')) return null;
  return (
    <View style={styles.container}>
      {state.homeSecurity && (
        <View style={styles.securityBanner}>
          <Text style={styles.bannerText}>🚨 Home Secured — Emergency Mode Active</Text>
          <TouchableOpacity onPress={() => dispatch({ type: 'SET_SECURITY_MODE', payload: false })}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      {state.anomalies.filter(a => a.type === 'danger').map(a => (
        <View key={a.id} style={styles.dangerBanner}>
          <Text style={styles.bannerText}>{a.message}</Text>
          <TouchableOpacity onPress={() => dispatch({ type: 'CLEAR_ANOMALY', payload: { id: a.id } })}>
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 100 },
  securityBanner: { backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  dangerBanner: { backgroundColor: '#ea580c', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  bannerText: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
  dismiss: { color: '#fff', fontSize: 18, marginLeft: 8 },
});
