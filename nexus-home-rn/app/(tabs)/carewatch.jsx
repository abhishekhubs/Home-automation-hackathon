import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '../../context/HomeContext';

const TWILIO_SID = 'AC17421653fe1f689340be00e8db0e7af2';
const TWILIO_PHONE = '+15078794866';
const TWILIO_AUTH = 'Basic QUMxNzQyMTY1M2ZlMWY2ODkzNDBiZTAwZThkYjBlN2FmMjo2MWM0OTQ4YzE0NDU4MGM5MDA0NTQ0NDYyNDZjN2Q3Nw==';

const SCENES = [
  { id: 'morning',   emoji: '☀️', label: 'Morning',   desc: 'Lights on, AC on',          bg: '#fefce8', border: '#fde68a', text: '#92400e' },
  { id: 'mealtime',  emoji: '🍽️', label: 'Mealtime',  desc: 'Kitchen & dining ready',    bg: '#d1fae5', border: '#6ee7b7', text: '#064e3b' },
  { id: 'rest',      emoji: '😴', label: 'Rest',       desc: 'Quiet mode, AC 22°C',       bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  { id: 'emergency', emoji: '🚨', label: 'Emergency',  desc: 'Alert family now',          bg: '#fee2e2', border: '#fca5a5', text: '#7f1d1d' },
];

function ElderView() {
  const { state, dispatch } = useHome();
  const [sosSent, setSosSent] = useState(false);
  const [calling, setCalling] = useState(null);
  const [smsSent, setSmsSent] = useState(false);
  const [medModal, setMedModal] = useState(null);

  const makeTwilioCall = async (phone) => {
    setCalling(phone);
    try {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': TWILIO_AUTH,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `To=${encodeURIComponent(phone)}&From=${encodeURIComponent(TWILIO_PHONE)}&Twiml=${encodeURIComponent('<Response><Say>Emergency alert from Decode Home. Immediate assistance required. Please check on the elder immediately.</Say></Response>')}`
      });
      Alert.alert("Call Initiated", "Emergency call is being placed via Twilio.");
    } catch (e) {
      Alert.alert("Call Failed", "Could not reach Twilio.");
    }
    setTimeout(() => setCalling(null), 3000);
  };

  const sendTwilioSMS = async (phone) => {
    setSmsSent(true);
    try {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': TWILIO_AUTH,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `To=${encodeURIComponent(phone)}&From=${encodeURIComponent(TWILIO_PHONE)}&Body=${encodeURIComponent('Alert ! ')}`
      });
      Alert.alert("SMS Sent", "Emergency message dispatched via Twilio.");
    } catch (e) {
      Alert.alert("SMS Failed", "Could not reach Twilio.");
    }
    setTimeout(() => setSmsSent(false), 3000);
  };

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      for (const t of state.medicationSchedule) {
        if (t === hhmm && !state.medicationConfirmed[t]) setMedModal(t);
      }
    };
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [state.medicationSchedule, state.medicationConfirmed]);

  const handleScene = (id) => {
    switch (id) {
      case 'morning':
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'ac', value: true } });
        break;
      case 'mealtime':
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'kitchen', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'livingRoom', device: 'fan', value: true } });
        break;
      case 'rest':
        Object.entries(state.rooms).forEach(([roomId, room]) => {
          Object.keys(room.devices).forEach(d => dispatch({ type: 'SET_DEVICE', payload: { roomId, device: d, value: false } }));
        });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'lights', value: true } });
        dispatch({ type: 'SET_DEVICE', payload: { roomId: 'bedroom', device: 'ac', value: true } });
        break;
      case 'emergency':
        handleSOS();
        break;
    }
  };

  const handleSOS = () => {
    setSosSent(true);
    dispatch({ type: 'ADD_CARE_ALERT', payload: '🚨 SOS triggered at ' + new Date().toLocaleTimeString() });
    dispatch({ type: 'SET_SECURITY_MODE', payload: true });
    setTimeout(() => setSosSent(false), 5000);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Scene grid */}
      <View style={styles.sceneGrid}>
        {SCENES.map(s => (
          <TouchableOpacity key={s.id} style={[styles.sceneBtn, { backgroundColor: s.bg, borderColor: s.border }]} onPress={() => handleScene(s.id)} activeOpacity={0.8}>
            <Text style={styles.sceneEmoji}>{s.emoji}</Text>
            <Text style={[styles.sceneLabel, { color: s.text }]}>{s.label}</Text>
            <Text style={styles.sceneDesc}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* I'm Okay */}
      <TouchableOpacity style={styles.okayBtn} onPress={() => dispatch({ type: 'ELDER_CHECK_IN' })}>
        <Text style={styles.okayText}>✅  I'm Okay</Text>
      </TouchableOpacity>

      {/* SOS */}
      <TouchableOpacity style={[styles.sosBtn, sosSent && { backgroundColor: '#dc2626' }]} onPress={handleSOS}>
        <Text style={styles.sosText}>{sosSent ? '🚨 SOS SENT — Help is coming!' : '🆘  SOS — Emergency'}</Text>
      </TouchableOpacity>

      {/* Emergency contacts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📞 Emergency Contact</Text>
        {state.careContacts.slice(0, 1).map((c, i) => (
          <View key={i} style={styles.contactRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRole}>{c.role} • {c.phone}</Text>
            </View>
            <View style={styles.contactBtns}>
              <TouchableOpacity style={styles.callBtn} onPress={() => makeTwilioCall(c.phone)}>
                <Text style={styles.callBtnText}>{calling === c.phone ? 'Calling…' : '📞 Call'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smsBtn} onPress={() => sendTwilioSMS(c.phone)}>
                <Text style={styles.smsBtnText}>{smsSent ? 'Sent!' : '💬 SMS'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Medication modal */}
      <Modal visible={!!medModal} transparent animationType="slide">
        <View style={styles.medOverlay}>
          <View style={styles.medCard}>
            <Text style={styles.medEmoji}>💊</Text>
            <Text style={styles.medTitle}>Medication Time!</Text>
            <Text style={styles.medSub}>Scheduled dose at {medModal}</Text>
            <TouchableOpacity style={styles.medBtn} onPress={() => { dispatch({ type: 'CONFIRM_MEDICATION', payload: medModal }); setMedModal(null); }}>
              <Text style={styles.medBtnText}>✓ CONFIRM TAKEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function CaregiverDash() {
  const { state, dispatch } = useHome();
  const noMotion = Object.values(state.rooms).every(r => !r.motion);
  const totalTransitions = Object.values(state.rooms).reduce((s, r) => s + r.motionLog.length, 0);
  const tempOk = t => t >= 22 && t <= 26;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Check-in */}
      <View style={[styles.checkinCard, { borderColor: state.elderCheckInTime ? '#6ee7b7' : '#fcd34d' }]}>
        <Text style={styles.checkinEmoji}>{state.elderCheckInTime ? '✅' : '⏳'}</Text>
        <View>
          <Text style={styles.checkinTitle}>Last Check-In</Text>
          <Text style={[styles.checkinTime, { color: state.elderCheckInTime ? '#059669' : '#d97706' }]}>
            {state.elderCheckInTime ? new Date(state.elderCheckInTime).toLocaleTimeString() : 'No check-in yet today'}
          </Text>
        </View>
      </View>

      {noMotion && (
        <View style={styles.warnCard}>
          <Text style={styles.warnText}>⚠️ No motion detected anywhere — check on elder</Text>
        </View>
      )}

      {/* Room status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏠 Room Status</Text>
        {Object.entries(state.rooms).map(([roomId, room]) => {
          const last = room.motionLog.slice(-1)[0];
          return (
            <View key={roomId} style={styles.roomRow}>
              <View style={styles.roomLeft}>
                <View style={[styles.mDot, { backgroundColor: room.motion ? '#10b981' : '#cbd5e1' }]} />
                <Text style={styles.roomName}>{roomId.replace(/([A-Z])/g, ' $1')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.tempVal, { color: tempOk(room.temp) ? '#059669' : '#dc2626' }]}>{room.temp.toFixed(1)}°C</Text>
                <Text style={styles.lastLog}>{last ? `${last.entered ? 'Entered' : 'Left'} ${last.ts}` : 'No log'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Daily Activity</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.actItem}>
            <Text style={styles.actValue}>{totalTransitions}</Text>
            <Text style={styles.actLabel}>Transitions</Text>
          </View>
          <View style={styles.actItem}>
            <Text style={[styles.actValue, { color: '#059669' }]}>{Object.values(state.rooms).filter(r => r.motion).length}</Text>
            <Text style={styles.actLabel}>Active Rooms</Text>
          </View>
        </View>
        {totalTransitions < 5 && (
          <View style={styles.lessAlert}><Text style={styles.lessText}>📉 Less active than usual — consider checking in</Text></View>
        )}
      </View>

      {/* SOS history */}
      {state.careAlerts.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: '#dc2626' }]}>🚨 SOS History</Text>
          {state.careAlerts.slice(0, 5).map(a => (
            <View key={a.id} style={styles.sosItem}>
              <Text style={styles.sosMsg}>{a.message}</Text>
              <Text style={styles.sosTime}>{new Date(a.timestamp).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Medical Notes</Text>
        <TextInput value={state.medicalNotes} onChangeText={v => dispatch({ type: 'SET_MEDICAL_NOTES', payload: v })} placeholder="Enter medication details, allergies, conditions..." placeholderTextColor="#94a3b8" style={styles.notesInput} multiline numberOfLines={4} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function CareWatchScreen() {
  const { state, dispatch } = useHome();
  const [view, setView] = useState('elder');
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CareWatch</Text>
            <Text style={styles.subtitle}>Elder care & monitoring</Text>
          </View>
          <Switch value={state.careWatchEnabled} onValueChange={v => dispatch({ type: 'SET_CARE_WATCH', payload: v })} trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }} thumbColor={state.careWatchEnabled ? '#6366f1' : '#94a3b8'} />
        </View>

        <View style={styles.switcher}>
          {[{ id: 'elder', label: 'Elder View' }, { id: 'caregiver', label: 'Caregiver' }].map(({ id, label }) => (
            <TouchableOpacity key={id} style={[styles.switchBtn, view === id && styles.switchBtnActive]} onPress={() => setView(id)}>
              <Text style={[styles.switchText, view === id && styles.switchTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {view === 'elder' ? <ElderView /> : <CaregiverDash />}
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
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  switchBtnActive: { backgroundColor: '#6366f1' },
  switchText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  switchTextActive: { color: '#fff' },
  sceneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  sceneBtn: { width: '47%', borderRadius: 20, borderWidth: 2, padding: 20, alignItems: 'center' },
  sceneEmoji: { fontSize: 36, marginBottom: 8 },
  sceneLabel: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sceneDesc: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  okayBtn: { backgroundColor: '#d1fae5', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#6ee7b7' },
  okayText: { color: '#059669', fontSize: 20, fontWeight: '800' },
  sosBtn: { backgroundColor: '#fee2e2', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#fca5a5' },
  sosText: { color: '#dc2626', fontSize: 20, fontWeight: '900' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  contactName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  contactRole: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  contactBtns: { flexDirection: 'row', gap: 8 },
  callBtn: { backgroundColor: '#d1fae5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#6ee7b7' },
  callBtnText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  smsBtn: { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#93c5fd' },
  smsBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  medOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  medCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#c4b5fd', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  medEmoji: { fontSize: 72, marginBottom: 16 },
  medTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  medSub: { fontSize: 16, color: '#64748b', marginBottom: 24 },
  medBtn: { backgroundColor: '#6366f1', borderRadius: 16, padding: 18, width: '100%', alignItems: 'center' },
  medBtnText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  checkinCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  checkinEmoji: { fontSize: 32 },
  checkinTitle: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  checkinTime: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  warnCard: { backgroundColor: '#fef3c7', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#fcd34d' },
  warnText: { color: '#d97706', fontSize: 13, fontWeight: '700' },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  roomLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mDot: { width: 8, height: 8, borderRadius: 4 },
  roomName: { fontSize: 13, color: '#1e293b', textTransform: 'capitalize', fontWeight: '600' },
  tempVal: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  lastLog: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  actItem: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  actValue: { fontSize: 28, fontWeight: '900', color: '#6366f1', fontVariant: ['tabular-nums'] },
  actLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  lessAlert: { marginTop: 12, backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fcd34d' },
  lessText: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  sosItem: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#fca5a5' },
  sosMsg: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  sosTime: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  notesInput: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b', padding: 12, fontSize: 13, minHeight: 100, textAlignVertical: 'top' },
});
