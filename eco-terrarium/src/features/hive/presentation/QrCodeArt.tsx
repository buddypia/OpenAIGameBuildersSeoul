import React, { useMemo } from 'react';
import { buildQrMatrix, qrMatrixToSvgPath, qrViewBoxSize } from '../domain/qrCode';

interface Props {
  /** 인코딩할 주소. aria-label로도 그대로 쓰인다. */
  value: string;
  /** 크기는 호출부가 정한다. 배지는 작게, 모달은 프로젝터용으로 크게. */
  className?: string;
}

/**
 * QR 그 자체만 그리는 조각.
 *
 * 배지와 모달이 같은 행렬 계산과 같은 명암 대비를 쓰도록 여기 한 곳에 모아
 * 둔다. 스캐너는 밝은 바탕의 어두운 코드를 기대하므로 다크 UI 안에서도 흰
 * 바탕을 직접 칠한다.
 */
export const QrCodeArt: React.FC<Props> = ({ value, className }) => {
  const { path, viewBox } = useMemo(() => {
    const matrix = buildQrMatrix(value);
    return { path: qrMatrixToSvgPath(matrix), viewBox: qrViewBoxSize(matrix) };
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      role="img"
      aria-label={value}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={viewBox} height={viewBox} fill="#ffffff" />
      <path d={path} fill="#0b1f18" />
    </svg>
  );
};
