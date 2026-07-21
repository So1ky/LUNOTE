import { DarkTheme, Stack, ThemeProvider } from 'expo-router';

import { Brand } from '@/constants/theme';

const LunoteTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.purple,
    background: Brand.navy,
    card: Brand.navyDeep,
    text: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={LunoteTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
