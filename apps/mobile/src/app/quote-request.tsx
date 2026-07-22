import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
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
import { uploadAttachment, type AttachmentInput } from '@/lib/attachments';
import { useAuth } from '@/lib/auth-context';
import {
  CATEGORY_META,
  createQuoteRequest,
  type Category,
} from '@/lib/quote-requests';

const MAX_ATTACHMENTS = 5;

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

type ContactChannel = 'email' | 'phone' | 'whatsapp';

const CONTACT_CHANNELS: {
  key: ContactChannel;
  emoji: string;
  label: string;
  placeholder: string;
  keyboardType: 'email-address' | 'phone-pad';
}[] = [
  {
    key: 'email',
    emoji: '📧',
    label: 'Email',
    placeholder: 'you@example.com',
    keyboardType: 'email-address',
  },
  {
    key: 'phone',
    emoji: '📞',
    label: 'Phone',
    placeholder: '+82 10-1234-5678',
    keyboardType: 'phone-pad',
  },
  {
    key: 'whatsapp',
    emoji: '💬',
    label: 'WhatsApp',
    placeholder: '+1 555 123 4567',
    keyboardType: 'phone-pad',
  },
];

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
  const [channel, setChannel] = useState<ContactChannel | null>(null);
  const [contactValue, setContactValue] = useState('');
  const [attachments, setAttachments] = useState<
    (AttachmentInput & { uri: string })[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedChannel = CONTACT_CHANNELS.find((c) => c.key === channel);

  const onAddPhotos = async () => {
    if (!token) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_ATTACHMENTS - attachments.length,
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    setError(null);
    try {
      // 선택 즉시 업로드 — 제출 시점에는 메타데이터만 보낸다
      for (const asset of result.assets) {
        const uploaded = await uploadAttachment(token, {
          uri: asset.uri,
          fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
        setAttachments((prev) => [...prev, { ...uploaded, uri: asset.uri }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (s3Key: string) =>
    setAttachments((prev) => prev.filter((a) => a.s3Key !== s3Key));

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
      // 서버에는 "채널: 값" 형태의 문자열로 저장 (예: "whatsapp: +1 555 123 4567")
      await createQuoteRequest(token, {
        category,
        desiredAmount,
        description: description.trim(),
        contactMethod: `${channel}: ${contactValue.trim()}`,
        attachments: attachments.length
          ? attachments.map(({ uri: _uri, ...meta }) => meta)
          : undefined,
      });
      router.replace('/quote'); // 등록 후 내 문의 목록으로
    } catch (e) {
      // 이메일 미인증(403)이면 인증 화면으로 유도
      if (e instanceof ApiError && e.status === 403) {
        router.push('/verify-email');
        return;
      }
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !!category &&
    description.trim().length >= 10 &&
    !!channel &&
    contactValue.trim().length >= 3;

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

            <View style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                Photos (optional, up to {MAX_ATTACHMENTS})
              </ThemedText>
              <View style={styles.attachmentRow}>
                {attachments.map((a) => (
                  <View key={a.s3Key} style={styles.thumbWrap}>
                    <Image source={{ uri: a.uri }} style={styles.thumb} />
                    <Pressable
                      style={styles.thumbRemove}
                      hitSlop={8}
                      onPress={() => removeAttachment(a.s3Key)}>
                      <ThemedText type="small">✕</ThemedText>
                    </Pressable>
                  </View>
                ))}
                {attachments.length < MAX_ATTACHMENTS && (
                  <Card style={styles.addThumb} onPress={() => void onAddPhotos()}>
                    <ThemedText type="subtitle" themeColor="textSecondary">
                      {uploading ? '…' : '＋'}
                    </ThemedText>
                  </Card>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                How should we contact you?
              </ThemedText>
              <View style={styles.channelRow}>
                {CONTACT_CHANNELS.map((c) => (
                  <Card
                    key={c.key}
                    onPress={() => setChannel(c.key)}
                    style={{
                      ...styles.channelCard,
                      ...(channel === c.key ? styles.categorySelected : {}),
                    }}>
                    <ThemedText type="small">
                      {c.emoji} {c.label}
                    </ThemedText>
                  </Card>
                ))}
              </View>
              {selectedChannel && (
                <TextField
                  placeholder={selectedChannel.placeholder}
                  keyboardType={selectedChannel.keyboardType}
                  autoCapitalize="none"
                  value={contactValue}
                  onChangeText={setContactValue}
                />
              )}
            </View>

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
  channelRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  attachmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumb: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: Radius.md,
  },
  channelCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
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
