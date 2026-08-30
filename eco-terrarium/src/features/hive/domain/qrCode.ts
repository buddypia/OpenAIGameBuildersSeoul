import qrcode from 'qrcode-generator';

/**
 * 관객이 폰으로 바로 열 수 있는 주소.
 *
 * 무대에서는 로컬 프리뷰(`localhost`)로 시연하는 경우가 많은데, 그 주소를 QR로
 * 찍으면 관객 폰에서는 열리지 않는다. 로컬에서 띄운 화면이라도 QR만은 항상
 * 공개 주소를 가리키게 한다.
 */
export const PUBLIC_PLAY_URL = 'https://eco-terrarium.pages.dev/';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1']);

/**
 * QR에 실을 주소를 고른다.
 *
 * 쿼리 문자열은 버린다 — 시연 중에 붙은 `?v=2` 같은 값이 QR에 섞이면 코드만
 * 복잡해지고 관객에게 아무 도움이 되지 않는다. 대신 지금 보고 있는 언어를
 * `?lang=`으로 넘겨, 폰에서도 같은 언어로 열리게 한다.
 */
export function resolvePlayUrl(href: string | null | undefined, locale?: string): string {
  const base = toShareableBase(href);
  return locale ? `${base}${base.includes('?') ? '&' : '?'}lang=${locale}` : base;
}

function toShareableBase(href: string | null | undefined): string {
  if (!href) return PUBLIC_PLAY_URL;
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return PUBLIC_PLAY_URL;
  }
  // file:// 로 열린 화면이나 로컬 서버는 관객 폰에서 닿을 수 없다.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return PUBLIC_PLAY_URL;
  if (LOCAL_HOSTNAMES.has(parsed.hostname)) return PUBLIC_PLAY_URL;
  return `${parsed.origin}${parsed.pathname}`;
}

export interface QrMatrix {
  /** 한 변의 모듈 수 (테두리 여백 제외). */
  size: number;
  /** `modules[row][col]`이 true면 검은 칸. */
  modules: boolean[][];
}

/**
 * 오류 정정 수준은 가장 높은 H를 쓴다. 무대 조명이나 촬영 각도, 프로젝터의
 * 낮은 대비에서도 읽히는 쪽이, 코드가 조금 촘촘해지는 것보다 중요하다.
 */
export function buildQrMatrix(text: string): QrMatrix {
  const qr = qrcode(0, 'H');
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    const line: boolean[] = [];
    for (let col = 0; col < size; col++) line.push(qr.isDark(row, col));
    modules.push(line);
  }
  return { size, modules };
}

/** QR 규격이 요구하는 여백(quiet zone). 이게 없으면 스캐너가 코드를 못 찾는다. */
export const QR_QUIET_ZONE = 4;

/** 뷰박스 한 변의 길이 — 여백을 포함한 모듈 수. */
export function qrViewBoxSize(matrix: QrMatrix): number {
  return matrix.size + QR_QUIET_ZONE * 2;
}

/** 검은 칸을 하나의 SVG path로 합친다. 요소가 하나뿐이라 렌더가 가볍다. */
export function qrMatrixToSvgPath(matrix: QrMatrix): string {
  const parts: string[] = [];
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.modules[row][col]) continue;
      parts.push(`M${col + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`);
    }
  }
  return parts.join('');
}
