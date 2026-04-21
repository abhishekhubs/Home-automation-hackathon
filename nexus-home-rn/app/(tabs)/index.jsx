import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, StatusBar, Dimensions, TextInput, Modal, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from '../../context/HomeContext';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const HALF = (width - 32 - CARD_GAP) / 2;

// ── HA colour tokens (light theme) ───────────────────────────
const C = {
  bg: '#f0f4f8',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  accent: '#1c91f2',
  accentDim: '#1565c0',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  text: '#1e293b',
  sub: '#64748b',
  divider: '#e2e8f0',
  active: '#eff6ff',
};

const ROOM_META = {
  livingRoom: { label: 'Living Room', icon: '🛋️', color: '#f97316' },
  bedroom: { label: 'Bedroom', icon: '🛏️', color: '#818cf8' },
  kitchen: { label: 'Kitchen', icon: '🍳', color: '#34d399' },
  bathroom: { label: 'Bathroom', icon: '🚿', color: '#38bdf8' },
};

const DEV_ICONS = { lights: '💡', fan: '🌀', ac: '❄️', tv: '📺', stove: '🔥' };
const GLOBAL_META = {
  refrigerator: { icon: '🧊', label: 'Refrigerator' },
  router: { icon: '📡', label: 'Router' },
  washingMachine: { icon: '🫧', label: 'Washer' },
  oven: { icon: '♨️', label: 'Oven' },
  speaker: { icon: '🔊', label: 'Speaker' },
  decorativeLights: { icon: '🎄', label: 'Deco Lights' },
  securityCam: { icon: '📹', label: 'Camera' },
};

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(id); }, []);
  return now;
}

// ── Top bar ───────────────────────────────────────────────────
function TopBar({ now, anomalies, emergency }) {
  const unread = anomalies.filter(a => !a.read).length;
  return (
    <View>
      <View style={[s.topBar, emergency && { borderBottomColor: C.red + '88' }]}>
        <View style={s.topBarLeft}>
          <View style={[s.haLogo, emergency && { backgroundColor: C.red + '22', borderColor: C.red + '88' }]}>
            <Text style={[s.haLogoText, emergency && { color: C.red }]}>{emergency ? '🚨' : '⌂'}</Text>
          </View>
          <View>
            <Text style={[s.haTitle, emergency && { color: C.red }]}>
              {emergency ? 'EMERGENCY MODE' : 'DECODE'}
            </Text>
            <Text style={s.haSub}>{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>
        <View style={s.topBarRight}>
          <Text style={s.clock}>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
          {unread > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{unread}</Text></View>
          )}
        </View>
      </View>
      {emergency && (
        <View style={s.emergencyBanner}>
          <Text style={s.emergencyBannerText}>🔴  Non-essential devices powered off  ·  Tap Security to deactivate</Text>
        </View>
      )}
    </View>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ title, right }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ── Stat chip (inside cards) ───────────────────────────────────
function Chip({ label, value, color }) {
  return (
    <View style={[s.chip, { borderColor: color || C.cardBorder }]}>
      <Text style={[s.chipVal, { color: color || C.accent }]}>{value}</Text>
      <Text style={s.chipLbl}>{label}</Text>
    </View>
  );
}

// ── Summary bar (like HA top entities) ────────────────────────
function SummaryBar({ rooms, globalDevices }) {
  const devicesOn = Object.values(rooms).reduce((acc, r) => acc + Object.values(r.devices).filter(Boolean).length, 0);
  const roomsActive = Object.values(rooms).filter(r => r.motion).length;
  const avgTemp = (Object.values(rooms).reduce((s, r) => s + r.temp, 0) / 4).toFixed(1);
  const globalOn = Object.values(globalDevices).filter(d => d.on).length;

  return (
    <View style={s.summaryBar}>
      <Chip label="Rooms Active" value={`${roomsActive}/4`} color={roomsActive ? C.green : C.sub} />
      <View style={s.sumDiv} />
      <Chip label="Devices On" value={devicesOn + globalOn} color={devicesOn + globalOn ? C.accent : C.sub} />
      <View style={s.sumDiv} />
      <Chip label="Avg Temp" value={`${avgTemp}°C`} color={C.amber} />
    </View>
  );
}

// ── HA-style Entity Card (half width) ─────────────────────────
function EntityCard({ icon, name, state, stateColor, subtext, onPress, active }) {
  return (
    <TouchableOpacity
      style={[s.entityCard, active && s.entityCardActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={s.entityIcon}>{icon}</Text>
      <View style={s.entityBody}>
        <Text style={s.entityName} numberOfLines={1}>{name}</Text>
        <Text style={[s.entityState, { color: stateColor || (active ? C.accent : C.sub) }]}>
          {state}
        </Text>
        {subtext ? <Text style={s.entitySub}>{subtext}</Text> : null}
      </View>
      <View style={[s.entityDot, { backgroundColor: stateColor || (active ? C.green : C.cardBorder) }]} />
    </TouchableOpacity>
  );
}

// ── Room Card (HA area card style) ────────────────────────────
function RoomCard({ roomId, room, dispatch }) {
  const meta = ROOM_META[roomId];
  const on = room.devices.lights === true;
  const devCount = Object.values(room.devices).filter(Boolean).length;
  return (
    <View style={[s.roomCard, room.motion && { borderColor: meta.color + '66' }]}>
      {/* Header */}
      <View style={s.roomHeader}>
        <Text style={s.roomIcon}>{meta.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.roomName}>{meta.label}</Text>
          <Text style={[s.roomMotion, { color: room.motion ? C.green : C.sub }]}>
            {room.motion ? '● Active' : '○ Empty'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.lightBtn, on && { backgroundColor: meta.color }]}
          onPress={() => dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'lights', value: !on } })}
        >
          <Text style={s.lightBtnIcon}>💡</Text>
        </TouchableOpacity>
      </View>
      {/* Sensors */}
      <View style={s.roomSensors}>
        <Text style={[s.roomTemp, { color: meta.color }]}>{room.temp.toFixed(1)}°C</Text>
        <Text style={s.roomHum}>💧 {room.humidity.toFixed(0)}%</Text>
      </View>
      {/* Devices */}
      <View style={s.devRow}>
        {Object.entries(room.devices).filter(([d]) => d !== 'lights').map(([device, active]) => (
          <TouchableOpacity
            key={device}
            style={[s.devPill, active === true && { backgroundColor: meta.color + '33', borderColor: meta.color }]}
            onPress={() => dispatch({ type: 'SET_DEVICE', payload: { roomId, device, value: !active } })}
          >
            <Text style={s.devPillIcon}>{DEV_ICONS[device] ?? '🔌'}</Text>
            <Text style={[s.devPillText, active === true && { color: meta.color }]}>
              {device.charAt(0).toUpperCase() + device.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {devCount > 0 && <Text style={[s.devCountText, { color: meta.color }]}>{devCount} device{devCount > 1 ? 's' : ''} on</Text>}
    </View>
  );
}

// ── Light toggle card ─────────────────────────────────────────
function LightCard({ roomId, room, dispatch }) {
  const meta = ROOM_META[roomId];
  const on = room.devices.lights === true;
  return (
    <TouchableOpacity
      style={[s.lightCard, on && { backgroundColor: meta.color + '22', borderColor: meta.color }]}
      onPress={() => dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'lights', value: !on } })}
      activeOpacity={0.8}
    >
      <Text style={[s.lightCardIcon, { opacity: on ? 1 : 0.4 }]}>💡</Text>
      <Text style={[s.lightCardLabel, on && { color: meta.color }]} numberOfLines={1}>{meta.label}</Text>
      <Text style={[s.lightCardState, { color: on ? meta.color : C.sub }]}>{on ? 'On' : 'Off'}</Text>
    </TouchableOpacity>
  );
}

// ── Climate card ──────────────────────────────────────────────
function ClimateCard({ roomId, room, dispatch }) {
  const meta = ROOM_META[roomId];
  const on = room.devices.ac === true;
  return (
    <View style={s.climateCard}>
      <View style={s.climateLeft}>
        <Text style={s.climateIcon}>❄️</Text>
        <View>
          <Text style={s.climateName}>{meta.label}</Text>
          <Text style={[s.climateState, { color: on ? C.accent : C.sub }]}>
            {on ? `Cooling · ${room.temp.toFixed(1)}°C` : `Off · ${room.temp.toFixed(1)}°C`}
          </Text>
        </View>
      </View>
      <Switch
        value={on}
        onValueChange={v => dispatch({ type: 'SET_DEVICE', payload: { roomId, device: 'ac', value: v } })}
        trackColor={{ false: C.cardBorder, true: C.accentDim }}
        thumbColor={on ? C.accent : '#555'}
        ios_backgroundColor={C.cardBorder}
      />
    </View>
  );
}

// ── Global appliance card ─────────────────────────────────────
function ApplianceCard({ device, info, dispatch }) {
  const meta = GLOBAL_META[device] || { icon: '🔌', label: device };
  return (
    <TouchableOpacity
      style={[s.appCard, info.on && { borderColor: C.accent, backgroundColor: C.active }]}
      onPress={() => dispatch({ type: 'SET_GLOBAL_DEVICE', payload: { device, value: !info.on } })}
      activeOpacity={0.8}
    >
      <Text style={s.appIcon}>{meta.icon}</Text>
      <Text style={[s.appLabel, info.on && { color: C.accent }]} numberOfLines={1}>{meta.label}</Text>
      {info.on && <View style={s.appDot} />}
    </TouchableOpacity>
  );
}

// ── Security card ─────────────────────────────────────────────
function SecuritySection({ state, dispatch }) {
  const armed = state.homeSecurity;
  const camOn = state.globalDevices.securityCam.on;
  return (
    <View style={s.secCard}>
      <View style={s.secRow}>
        <View style={s.secLeft}>
          <Text style={s.secIc}>{armed ? '🔴' : '🟢'}</Text>
          <View>
            <Text style={s.secCardTitle}>{armed ? 'Emergency Mode' : 'Home Secured'}</Text>
            <Text style={s.secCardSub}>{armed ? 'Non-essential devices off' : 'All clear'}</Text>
          </View>
        </View>
        <Switch
          value={armed}
          onValueChange={v => {
            if (v) {
              dispatch({ type: 'ALL_OFF' }); // turns off non-essential devices + sets homeSecurity: true
            } else {
              dispatch({ type: 'SET_SECURITY_MODE', payload: false });
            }
          }}
          trackColor={{ false: C.cardBorder, true: '#b71c1c' }}
          thumbColor={armed ? C.red : '#555'}
          ios_backgroundColor={C.cardBorder}
        />
      </View>
      <View style={s.secDivider} />
      <View style={s.secRow}>
        <View style={s.secLeft}>
          <Text style={s.secIc}>📹</Text>
          <View>
            <Text style={s.secCardTitle}>Security Camera</Text>
            <Text style={[s.secCardSub, { color: camOn ? C.accent : C.sub }]}>{camOn ? 'Recording' : 'Off'}</Text>
          </View>
        </View>
        <Switch
          value={camOn}
          onValueChange={v => dispatch({ type: 'SET_GLOBAL_DEVICE', payload: { device: 'securityCam', value: v } })}
          trackColor={{ false: C.cardBorder, true: C.accentDim }}
          thumbColor={camOn ? C.accent : '#555'}
          ios_backgroundColor={C.cardBorder}
        />
      </View>
    </View>
  );
}

// ── Alerts panel ──────────────────────────────────────────────
function AlertsSection({ anomalies, dispatch }) {
  if (!anomalies.length) return null;
  return (
    <View style={s.section}>
      <SectionHeader
        title="NOTIFICATIONS"
        right={
          <TouchableOpacity onPress={() => anomalies.forEach(a => dispatch({ type: 'MARK_ANOMALY_READ', payload: { id: a.id } }))}>
            <Text style={s.markRead}>Clear all</Text>
          </TouchableOpacity>
        }
      />
      {anomalies.map(a => (
        <TouchableOpacity
          key={a.id}
          style={[s.alertRow, a.type === 'danger' && s.alertDanger, a.type === 'info' && s.alertInfo, a.read && { opacity: 0.4 }]}
          onPress={() => dispatch({ type: 'MARK_ANOMALY_READ', payload: { id: a.id } })}
        >
          <Text style={[s.alertMsg, a.type === 'danger' && { color: C.red }, a.type === 'info' && { color: C.accent }]}>{a.message}</Text>
          <Text style={s.alertTime}>{a.timestamp}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Members / Guests section ─────────────────────────────────
const GUEST_EMOJIS = ['🧑', '👩', '👨', '🧒', '👦', '👧', '🧓', '🧔', '👱', '🙎'];

function MembersSection({ careContacts, rooms }) {
  const anyMotion = Object.values(rooms).some(r => r.motion);
  const [guests, setGuests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAccess, setGuestAccess] = useState('View Only');

  const ACCESS_OPTIONS = ['View Only', 'Lights & AC', 'Full Access'];

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) { Alert.alert('Name required', 'Please enter the guest name.'); return; }
    const emoji = GUEST_EMOJIS[Math.floor(Math.random() * GUEST_EMOJIS.length)];
    setGuests(prev => [...prev, { id: Date.now(), name, access: guestAccess, emoji, since: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
    setGuestName('');
    setGuestAccess('View Only');
    setShowModal(false);
  };

  const removeGuest = (id) => {
    Alert.alert('Remove Guest', 'Remove this guest from the home?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setGuests(prev => prev.filter(g => g.id !== id)) },
    ]);
  };

  return (
    <View style={s.section}>
      <View style={s.secHead}>
        <Text style={s.secTitle}>MEMBERS & GUESTS</Text>
        <TouchableOpacity style={s.addGuestBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addGuestBtnText}>+ Add Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll of member chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.memberRow}>
        {/* Owner chip */}
        <View style={[s.memberChip, anyMotion && s.memberChipHome]}>
          <View style={s.memberAvatar}>
            <Text style={s.memberAvatarText}>🧑‍💻</Text>
          </View>
          <View style={s.memberInfo}>
            <Text style={s.memberName}>Abhishek</Text>
            <Text style={[s.memberStatus, { color: anyMotion ? C.green : C.sub }]}>
              {anyMotion ? '● Home' : '○ Away'}
            </Text>
          </View>
          <View style={[s.memberRole, { backgroundColor: C.accent + '18', borderColor: C.accent + '44' }]}>
            <Text style={[s.memberRoleText, { color: C.accent }]}>Owner</Text>
          </View>
        </View>

        {/* Care contacts */}
        {careContacts.map((c, i) => (
          <View key={i} style={s.memberChip}>
            <View style={s.memberAvatar}>
              <Text style={s.memberAvatarText}>{i === 0 ? '👩' : '👨‍⚕️'}</Text>
            </View>
            <View style={s.memberInfo}>
              <Text style={s.memberName}>{c.name.split(' ')[0]}</Text>
              <Text style={s.memberStatus}>○ Away</Text>
            </View>
            <View style={[s.memberRole, { backgroundColor: C.purple + '18', borderColor: C.purple + '44' }]}>
              <Text style={[s.memberRoleText, { color: C.purple }]}>{c.role.split(' ')[0]}</Text>
            </View>
          </View>
        ))}

        {/* Guests */}
        {guests.map(g => (
          <TouchableOpacity key={g.id} style={[s.memberChip, s.memberChipGuest]} onLongPress={() => removeGuest(g.id)} activeOpacity={0.85}>
            <View style={[s.memberAvatar, { backgroundColor: C.amber + '22' }]}>
              <Text style={s.memberAvatarText}>{g.emoji}</Text>
            </View>
            <View style={s.memberInfo}>
              <Text style={s.memberName}>{g.name}</Text>
              <Text style={s.memberStatus}>Since {g.since}</Text>
            </View>
            <View style={[s.memberRole, { backgroundColor: C.amber + '18', borderColor: C.amber + '44' }]}>
              <Text style={[s.memberRoleText, { color: C.amber }]}>Guest</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty state */}
        {guests.length === 0 && (
          <TouchableOpacity style={s.addGuestPlaceholder} onPress={() => setShowModal(true)}>
            <Text style={s.addGuestPlaceholderText}>+ Invite a guest</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Guest Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Add Guest</Text>
              <Text style={s.modalSub}>Guests can control selected devices during their visit.</Text>

              <Text style={s.modalLabel}>Guest Name</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g. Rahul Verma"
                placeholderTextColor={C.sub}
                value={guestName}
                onChangeText={setGuestName}
                autoFocus
              />

              <Text style={s.modalLabel}>Access Level</Text>
              <View style={s.accessRow}>
                {ACCESS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[s.accessChip, guestAccess === opt && s.accessChipActive]}
                    onPress={() => setGuestAccess(opt)}
                  >
                    <Text style={[s.accessChipText, guestAccess === opt && { color: '#fff' }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={s.modalCancel} onPress={() => { setShowModal(false); setGuestName(''); }}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalConfirm} onPress={addGuest}>
                  <Text style={s.modalConfirmText}>Add Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export default function DashboardScreen() {
  const { state, dispatch } = useHome();
  const now = useNow();
  const acRooms = Object.entries(state.rooms).filter(([, r]) => 'ac' in r.devices);
  const allLightsOn = Object.values(state.rooms).every(r => r.devices.lights === true);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: state.homeSecurity ? '#b71c1c' : C.card }]} edges={['top']}>
      <StatusBar barStyle={state.homeSecurity ? 'light-content' : 'dark-content'} backgroundColor={state.homeSecurity ? '#b71c1c' : C.card} />
      <TopBar now={now} anomalies={state.anomalies} emergency={state.homeSecurity} />
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* Summary */}
        <SummaryBar rooms={state.rooms} globalDevices={state.globalDevices} />

        {/* Members & Guests */}
        <MembersSection careContacts={state.careContacts} rooms={state.rooms} />

        {/* Alerts */}
        <AlertsSection anomalies={state.anomalies} dispatch={dispatch} />

        {/* Areas */}
        <View style={s.section}>
          <SectionHeader title="AREAS" />
          {Object.entries(state.rooms).map(([roomId, room]) => (
            <RoomCard key={roomId} roomId={roomId} room={room} dispatch={dispatch} />
          ))}
        </View>

        {/* Lights */}
        <View style={s.section}>
          <SectionHeader
            title="LIGHTS"
            right={
              <TouchableOpacity
                style={[s.toggleAllBtn, allLightsOn && s.toggleAllBtnOn]}
                onPress={() => Object.keys(state.rooms).forEach(id =>
                  dispatch({ type: 'SET_DEVICE', payload: { roomId: id, device: 'lights', value: !allLightsOn } })
                )}
              >
                <Text style={[s.toggleAllText, allLightsOn && { color: '#fff' }]}>
                  {allLightsOn ? 'All On' : 'All Off'}
                </Text>
              </TouchableOpacity>
            }
          />
          <View style={s.lightGrid}>
            {Object.entries(state.rooms).map(([roomId, room]) => (
              <LightCard key={roomId} roomId={roomId} room={room} dispatch={dispatch} />
            ))}
          </View>
        </View>

        {/* Climate */}
        {acRooms.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="CLIMATE" />
            {acRooms.map(([roomId, room]) => (
              <ClimateCard key={roomId} roomId={roomId} room={room} dispatch={dispatch} />
            ))}
          </View>
        )}

        {/* Appliances */}
        <View style={s.section}>
          <SectionHeader title="APPLIANCES" />
          <View style={s.appGrid}>
            {Object.entries(state.globalDevices).map(([device, info]) => (
              <ApplianceCard key={device} device={device} info={info} dispatch={dispatch} />
            ))}
          </View>
        </View>

        {/* Quick entity states */}
        <View style={s.section}>
          <SectionHeader title="ENTITY STATES" />
          <View style={s.entityGrid}>
            <EntityCard
              icon="🏠" name="Motion" active={Object.values(state.rooms).some(r => r.motion)}
              state={Object.values(state.rooms).some(r => r.motion) ? 'Detected' : 'Clear'}
              stateColor={Object.values(state.rooms).some(r => r.motion) ? C.green : C.sub}
            />
            <EntityCard
              icon="⚡" name="Peak Hour" active={state.peakHourActive}
              state={state.peakHourActive ? 'Active' : 'Normal'}
              stateColor={state.peakHourActive ? C.amber : C.sub}
            />
            <EntityCard
              icon="👶" name="Kid Safe" active={state.kidSafeEnabled}
              state={state.kidSafeEnabled ? 'Enabled' : 'Disabled'}
              stateColor={state.kidSafeEnabled ? C.purple : C.sub}
              onPress={() => dispatch({ type: 'SET_KID_SAFE', payload: !state.kidSafeEnabled })}
            />
            <EntityCard
              icon="👴" name="CareWatch" active={state.careWatchEnabled}
              state={state.careWatchEnabled ? 'Monitoring' : 'Off'}
              stateColor={state.careWatchEnabled ? C.accent : C.sub}
              onPress={() => dispatch({ type: 'SET_CARE_WATCH', payload: !state.careWatchEnabled })}
            />
          </View>
        </View>

        {/* Security */}
        <View style={s.section}>
          <SectionHeader title="SECURITY" />
          <SecuritySection state={state} dispatch={dispatch} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.card },
  scroll: { flex: 1 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.cardBorder, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  haLogo: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '55', marginRight: 10 },
  haLogoText: { fontSize: 18, color: C.accent },
  haTitle: { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: 1.5 },
  haSub: { fontSize: 10, color: C.sub, marginTop: 1 },
  topBarRight: { alignItems: 'flex-end' },
  clock: { fontSize: 18, fontWeight: '700', color: C.text, fontVariant: ['tabular-nums'] },
  badge: { backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-end' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  emergencyBanner: { backgroundColor: '#b71c1c', paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center' },
  emergencyBannerText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.4 },

  // Summary
  summaryBar: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'space-around' },
  chip: { alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  chipVal: { fontSize: 18, fontWeight: '800' },
  chipLbl: { fontSize: 9, color: C.sub, marginTop: 2, fontWeight: '600', letterSpacing: 0.8 },
  sumDiv: { width: 1, height: 36, backgroundColor: C.cardBorder },

  // Section
  section: { marginTop: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secTitle: { fontSize: 10, fontWeight: '800', color: C.sub, letterSpacing: 1.8 },
  markRead: { fontSize: 12, color: C.accent, fontWeight: '600' },

  // Room card
  roomCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  roomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  roomIcon: { fontSize: 22, marginRight: 8 },
  roomName: { fontSize: 14, fontWeight: '800', color: C.text },
  roomMotion: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  lightBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  lightBtnIcon: { fontSize: 16 },
  roomSensors: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  roomTemp: { fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  roomHum: { fontSize: 13, color: C.accent, fontWeight: '700' },
  devRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4, alignItems: 'center' },
  devPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: C.cardBorder },
  devPillIcon: { fontSize: 12 },
  devPillText: { fontSize: 10, fontWeight: '700', color: C.sub },
  devCountText: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Light grid
  lightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, alignItems: 'flex-start' },
  lightCard: { width: HALF, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 14, alignItems: 'center' },
  lightCardIcon: { fontSize: 28, marginBottom: 6 },
  lightCardLabel: { fontSize: 11, fontWeight: '700', color: C.text, marginBottom: 4 },
  lightCardState: { fontSize: 11, fontWeight: '600' },

  // Toggle all
  toggleAllBtn: { backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.cardBorder },
  toggleAllBtnOn: { backgroundColor: C.accentDim, borderColor: C.accent },
  toggleAllText: { fontSize: 11, fontWeight: '700', color: C.sub },

  // Climate
  climateCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  climateLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  climateIcon: { fontSize: 26 },
  climateName: { fontSize: 14, fontWeight: '700', color: C.text },
  climateState: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Appliances
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' },
  appCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.cardBorder, minWidth: (width - 32 - 8) / 2, flexShrink: 1 },
  appIcon: { fontSize: 18 },
  appLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  appDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },

  // Entity grid
  entityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, alignItems: 'flex-start' },
  entityCard: { width: HALF, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  entityCardActive: { borderColor: C.accent + '66', backgroundColor: C.active },
  entityIcon: { fontSize: 22 },
  entityBody: { flex: 1 },
  entityName: { fontSize: 11, fontWeight: '700', color: C.text },
  entityState: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  entitySub: { fontSize: 9, color: C.sub, marginTop: 2 },
  entityDot: { width: 8, height: 8, borderRadius: 4 },

  // Security
  secCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
  secRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  secLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secIc: { fontSize: 24 },
  secCardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  secCardSub: { fontSize: 11, color: C.sub, marginTop: 2 },
  secDivider: { height: 1, backgroundColor: C.cardBorder, marginHorizontal: 14 },

  // Alerts
  alertRow: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#fcd34d' },
  alertDanger: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  alertInfo: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  alertMsg: { fontSize: 13, fontWeight: '600', color: C.amber },
  alertTime: { fontSize: 10, color: C.sub, marginTop: 3 },

  // Members & Guests
  memberRow: {},
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, borderWidth: 1, borderColor: C.cardBorder, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  memberChipHome: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  memberChipGuest: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent + '18', alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 22 },
  memberInfo: { justifyContent: 'center' },
  memberName: { fontSize: 13, fontWeight: '700', color: C.text },
  memberStatus: { fontSize: 10, color: C.sub, marginTop: 2, fontWeight: '600' },
  memberRole: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  memberRoleText: { fontSize: 10, fontWeight: '700' },
  addGuestBtn: { backgroundColor: C.accent + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.accent + '44' },
  addGuestBtnText: { fontSize: 12, fontWeight: '700', color: C.accent },
  addGuestPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1.5, borderColor: C.cardBorder, borderStyle: 'dashed' },
  addGuestPlaceholderText: { fontSize: 13, fontWeight: '600', color: C.sub },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.cardBorder, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.sub, marginBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  modalInput: { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
  accessRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  accessChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.bg },
  accessChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  accessChipText: { fontSize: 12, fontWeight: '700', color: C.sub },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: C.sub },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
