import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  createQuoteRequest,
  type Category,
} from '@/lib/quote-requests';

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export default function QuoteRequestScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ category?: string }>();

  const initial = CATEGORIES.includes(params.category as Category)
    ? (params.category as Category)
    : null;

  const [category, setCategory] = useState<Category | null>(initial);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!token || !category) return;
    setError(null);

    const desiredAmount = amount.trim() ? Number(amount) : undefined;
    if (desiredAmount !== undefined && (Number.isNaN(desiredAmount) || desiredAmount <= 0)) {
      setError('Desired budget must be a positive number');
      return;
    }

    setSubmitting(true);
    try {
      await createQuoteRequest(token, {
        category,
        desiredAmount,
        description: description.trim(),
        contactMethod: contactMethod.trim(),
      });
      router.replace('/quote'); // 등록 후 내 문의 목록으로
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !!category && description.trim().length >= 10 && contactMethod.trim().length >= 3;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <ThemedText type="subtitle">‹</ThemedText>
              </Pressable>
              <ThemedText type="subtitle">Request a Quote</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                Category
              </ThemedText>
              <View style={styles.grid}>
                {CATEGORIES.map((c) => (
                  <Card
                    key={c}
                    onPress={() => setCategory(c)}
                    style={{
                      ...styles.categoryCard,
                      ...(category === c ? styles.categorySelected : {}),
                    }}>
                    <ThemedText style={styles.categoryEmoji}>
                      {CATEGORY_META[c].emoji}
                    </ThemedText>
                    <ThemedText type="small">{CATEGORY_META[c].label}</ThemedText>
                  </Card>
                ))}
              </View>
            </View>

            <TextField
              label="Desired budget (optional, USD)"
              placeholder="400"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TextField
              label="What do you need? (at least 10 characters)"
              placeholder="Describe your situation — the more detail, the better the quote."
              multiline
              numberOfLines={5}
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
            />

            <TextField
              label="How should we contact you?"
              placeholder="email: you@example.com / WhatsApp: +82..."
              autoCapitalize="none"
              value={contactMethod}
              onChangeText={setContactMethod}
            />

            {error && (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            )}

            <Button
              label="Send a Request"
              size="lg"
              loading={submitting}
              disabled={!canSubmit}
              onPress={() => void onSubmit()}
            />

            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              We will review your request and send a quote within 24 hours.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  categorySelected: {
    borderColor: Brand.purple,
    backgroundColor: Brand.surfaceAlt,
  },
  categoryEmoji: {
    fontSize: 20,
    lineHeight: 28,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
  error: {
    color: Brand.danger,
  },
  note: {
    textAlign: 'center',
  },
});
