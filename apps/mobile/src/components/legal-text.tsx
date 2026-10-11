import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/i18n';
import { openLegal, type LegalDoc } from '@/lib/legal';

const DOCS: LegalDoc[] = ['terms', 'privacy', 'refund'];
const PLACEHOLDER = new RegExp(`(\\{\\{(?:${DOCS.join('|')})\\}\\})`);

type Props = {
  /** `{{terms}}` `{{privacy}}` `{{refund}}` 자리표시자를 가진 번역 키 */
  k: string;
};

/**
 * 법적 문서 링크가 섞인 안내 문구. 번역 문자열의 자리표시자를 탭 가능한 링크로 바꾼다.
 * i18n-js는 값이 없는 자리표시자를 "[missing …]"으로 바꾸므로 자리표시자 자체를 값으로 넘겨 보존한다.
 */
export function LegalText({ k }: Props) {
  const { t } = useTranslation();
  const template = t(k, Object.fromEntries(DOCS.map((d) => [d, `{{${d}}}`])));
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {template.split(PLACEHOLDER).map((part, i) => {
        const doc = DOCS.find((d) => part === `{{${d}}}`);
        return doc ? (
          <ThemedText key={i} type="link" accessibilityRole="link" onPress={() => openLegal(doc)}>
            {t(`legal.${doc}`)}
          </ThemedText>
        ) : (
          part
        );
      })}
    </ThemedText>
  );
}
