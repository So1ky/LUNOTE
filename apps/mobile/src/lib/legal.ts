import { Linking } from 'react-native';

/** lunoteapp.com에 게시된 법적 문서 — 앱은 링크만 하고 본문은 웹이 단일 원천 */
export const LEGAL_URLS = {
  terms: 'https://lunoteapp.com/terms',
  privacy: 'https://lunoteapp.com/privacy',
  refund: 'https://lunoteapp.com/refund',
} as const;

export type LegalDoc = keyof typeof LEGAL_URLS;

export function openLegal(doc: LegalDoc) {
  void Linking.openURL(LEGAL_URLS[doc]);
}
