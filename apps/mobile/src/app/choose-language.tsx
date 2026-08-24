import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Brand, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LANGUAGES, type LanguageCode } from '@/lib/languages';

/**
 * 첫 실행 온보딩 — 스플래시 직후, 언어가 어디에도 정해지지 않았을 때 한 번 뜬다.
 * 기획 결정: 선택 전 화면 문구의 디폴트는 영어. 언어를 고르면 문구가 즉시 그 언어로
 * 미리보기되고, Continue를 눌러야 저장·확정된다.
 */
export default function ChooseLanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { token, profile, updateProfile } = useAuth();
  const { setLocalLanguage } = useLanguage();
  const [selected, setSelected] = useState<LanguageCode>('en');
  const [saving, setSaving] = useState(false);

  // 확정 전이므로 컨텍스트 로케일 대신 화면 내 선택값으로 문구를 렌더링한다
  const tp = (key: string) => t(key, { locale: selected });

  const onContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setLocalLanguage(selected);
      if (token && profile) {
        // 로그인 상태로 이 화면을 봤다면(언어 미설정 계정) 프로필에도 반영.
        // 실패해도 로컬 선택은 살아 있으므로 온보딩을 막지 않는다.
        await updateProfile({ language: selected }).catch(() => undefined);
      }
      router.replace('/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen center narrow>
      <View style={styles.hero}>
        <ThemedText type="display">LUNOTE</ThemedText>
        <ThemedText type="title" style={styles.centered}>
          {tp('chooseLanguage.title')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          {tp('chooseLanguage.subtitle')}
        </ThemedText>
      </View>

      <Card style={styles.listCard}>
        {LANGUAGES.map((lang, i) => (
          <View key={lang.code}>
            {i > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: lang.code === selected }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setSelected(lang.code)}>
              <ThemedText type={lang.code === selected ? 'bodyStrong' : 'body'}>
                {lang.label}
              </ThemedText>
              {lang.code === selected && (
                <ThemedText type="bodyStrong" style={styles.check}>
                  ✓
                </ThemedText>
              )}
            </Pressable>
          </View>
        ))}
      </Card>

      <Button
        label={tp('chooseLanguage.continue')}
        size="lg"
        loading={saving}
        onPress={() => void onContinue()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  centered: {
    textAlign: 'center',
  },
  listCard: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  rowPressed: {
    opacity: 0.6,
  },
  check: {
    color: Brand.purple,
  },
});
