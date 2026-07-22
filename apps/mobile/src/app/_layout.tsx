import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { Brand } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth-context';

const LunoteTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.purple,
    background: Brand.bg,
    card: Brand.surface,
    text: Brand.text,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={LunoteTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </AuthProvider>
  );
}
