import { Tabs } from 'expo-router';
import { useHome } from '../../context/HomeContext';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ focused, emoji }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
    </View>
  );
}

function BadgeTabIcon({ focused, emoji, badge }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { state } = useHome();
  const unreadCount = state.anomalies.filter(a => !a.read).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => <BadgeTabIcon focused={focused} emoji="🏠" badge={unreadCount} /> }} />
      <Tabs.Screen name="command" options={{ title: 'AI', tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🤖" /> }} />
      <Tabs.Screen name="energy" options={{ title: 'Energy', tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚡" /> }} />
      <Tabs.Screen name="kidsafe" options={{ title: 'KidSafe', tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🔒" /> }} />
      <Tabs.Screen name="carewatch" options={{ title: 'Care', tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="❤️" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0', borderTopWidth: 1, height: 72, paddingBottom: 8, paddingTop: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 8 },
  tabLabel: { fontSize: 10, fontWeight: '700' },
  tabIconContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabEmoji: { fontSize: 22, opacity: 0.4 },
  tabEmojiFocused: { opacity: 1 },
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
});
