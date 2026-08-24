import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

/**
 * 가입 완료(이메일 인증 성공) 직후 한 번 보여주는 환영 화면.
 * 카피는 웰컴 이메일과 동일 — 서비스가 뭘 해주는지(컨시어지)와
 * 이용 3단계를 첫 화면 진입 전에 각인시킨다. (기획 피드백 반영)
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const goHome = () => router.replace('/home');
  const goFirstRequest = () => {
    // 홈을 스택 바닥에 깔고 견적 요청으로 — 뒤로가기가 홈으로 자연스럽게 떨어진다
    router.replace('/home');
    router.push('/quote-request');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <ThemedText type="title" style={styles.centered}>
          {t('welcome.title')}
        </ThemedText>
        <ThemedText type="bodyStrong" style={styles.centered}>
          {t('welcome.tagline')}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="body" themeColor="textSecondary">
          {t('welcome.intro1')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('welcome.intro2')}
        </ThemedText>
      </View>

      <ThemedText type="heading">{t('welcome.howTitle')}</ThemedText>

      <Card>
        {([1, 2, 3] as const).map((n, i) => (
          <View key={n} style={[styles.step, i > 0 && styles.stepGap]}>
            <ThemedText type="bodyStrong">{t(`welcome.step${n}Title`)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t(`welcome.step${n}Body`)}
            </ThemedText>
          </View>
        ))}
      </Card>

      <View style={styles.section}>
        <ThemedText type="heading">{t('welcome.solutionTitle')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('welcome.solutionBody1')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('welcome.solutionBody2')}
        </ThemedText>
        <ThemedText type="bodyStrong">{t('welcome.solutionCta')}</ThemedText>
      </View>

      <View style={styles.actions}>
        <Button label={t('welcome.cta')} size="lg" onPress={goFirstRequest} />
        <Button label={t('welcome.later')} variant="ghost" onPress={goHome} />
      </View>
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
  section: {
    gap: Spacing.sm,
  },
  step: {
    gap: Spacing.xxs,
  },
  stepGap: {
    marginTop: Spacing.md,
  },
  actions: {
    gap: Spacing.xxs,
  },
});
