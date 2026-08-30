import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import { resolvePlayUrl } from '../domain/qrCode';

/**
 * 지금 화면을 폰에서 여는 주소.
 *
 * 배지와 모달이 각자 계산하면 언어를 바꿨을 때 둘이 다른 주소를 가리킬 수
 * 있어, 한 훅으로 묶어 둔다.
 */
export function usePlayUrl(): string {
  const { locale } = useI18n();
  const href = typeof window === 'undefined' ? null : window.location.href;
  return useMemo(() => resolvePlayUrl(href, locale), [href, locale]);
}
