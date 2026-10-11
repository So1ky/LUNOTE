import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { PushResponseHandler } from '@/components/push-response-handler';
import { Brand } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';

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
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider value={LunoteTheme}>
          <PushResponseHandler />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
