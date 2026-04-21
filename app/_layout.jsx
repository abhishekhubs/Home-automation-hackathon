import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HomeProvider } from '../context/HomeContext';
import GlobalBanner from '../components/GlobalBanner';

export default function RootLayout() {
  return (
    <HomeProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <GlobalBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f1f5f9' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </HomeProvider>
  );
}
