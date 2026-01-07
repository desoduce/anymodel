import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import WelcomeScreen from '@/components/WelcomeScreen';
import EncryptedStorage from '@/src/services/EncryptedStorage';

function RootLayoutInner() {
  const { theme } = useAppTheme();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingWelcome, setIsCheckingWelcome] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // Check if user has seen welcome screen
      const hasSeenWelcome = await AsyncStorage.getItem('has_seen_welcome');

      // Check if user has any API keys configured
      const hasKeys = await EncryptedStorage.hasApiKeys();

      // Show welcome if they haven't seen it AND don't have API keys
      if (!hasSeenWelcome && !hasKeys) {
        setShowWelcome(true);
      }
    } catch (error) {
      if (__DEV__) console.error('Error checking first launch:', error);
    } finally {
      setIsCheckingWelcome(false);
    }
  };

  const handleWelcomeComplete = async () => {
    try {
      // Mark welcome as seen
      await AsyncStorage.setItem('has_seen_welcome', 'true');
      setShowWelcome(false);
    } catch (error) {
      if (__DEV__) console.error('Error saving welcome completion:', error);
      setShowWelcome(false);
    }
  };

  // Don't render anything until we've checked welcome status
  if (isCheckingWelcome) {
    return null;
  }

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <WelcomeScreen visible={showWelcome} onComplete={handleWelcomeComplete} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
