import { describe, expect, it } from 'vitest';
import {
  buildQrMatrix,
  PUBLIC_PLAY_URL,
  QR_QUIET_ZONE,
  qrMatrixToSvgPath,
  qrViewBoxSize,
  resolvePlayUrl,
} from '../features/hive';

describe('play URL for the phone QR', () => {
  it('falls back to the public address when the stage laptop is on localhost', () => {
    for (const local of [
      'http://localhost:4173/',
      'http://localhost:3000/?v=2',
      'http://127.0.0.1:5173/',
      'http://0.0.0.0:8080/',
    ]) {
      expect(resolvePlayUrl(local)).toBe(PUBLIC_PLAY_URL);
    }
  });

  it('falls back when the page was opened as a file or has no address at all', () => {
    expect(resolvePlayUrl('file:///Users/me/dist/index.html')).toBe(PUBLIC_PLAY_URL);
    expect(resolvePlayUrl(null)).toBe(PUBLIC_PLAY_URL);
    expect(resolvePlayUrl('')).toBe(PUBLIC_PLAY_URL);
    expect(resolvePlayUrl('not a url')).toBe(PUBLIC_PLAY_URL);
  });

  it('keeps a real public address, minus the query string', () => {
    // 시연 중 붙은 ?v=2 나 긴 ?dna= 가 QR에 섞이면 코드만 복잡해진다.
    expect(resolvePlayUrl('https://eco-terrarium.pages.dev/?dna=N4Igb...')).toBe(
      'https://eco-terrarium.pages.dev/'
    );
    expect(resolvePlayUrl('https://example.com/game')).toBe('https://example.com/game');
  });

  it('carries the current language over to the phone', () => {
    expect(resolvePlayUrl('http://localhost:4173/', 'ko')).toBe(`${PUBLIC_PLAY_URL}?lang=ko`);
    expect(resolvePlayUrl('https://example.com/game', 'ja')).toBe('https://example.com/game?lang=ja');
  });
});

describe('QR matrix', () => {
  it('encodes the address into a square matrix with a quiet zone', () => {
    const matrix = buildQrMatrix(`${PUBLIC_PLAY_URL}?lang=ko`);

    expect(matrix.size).toBeGreaterThan(20);
    expect(matrix.modules).toHaveLength(matrix.size);
    for (const row of matrix.modules) expect(row).toHaveLength(matrix.size);
    expect(qrViewBoxSize(matrix)).toBe(matrix.size + QR_QUIET_ZONE * 2);
  });

  it('places the three finder patterns every scanner looks for', () => {
    const { modules, size } = buildQrMatrix(PUBLIC_PLAY_URL);
    // 파인더 패턴은 7x7이고 테두리가 검은색, 그 안쪽 한 칸이 흰색이다.
    for (const [top, left] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ]) {
      expect(modules[top][left]).toBe(true);
      expect(modules[top][left + 6]).toBe(true);
      expect(modules[top + 6][left]).toBe(true);
      expect(modules[top + 1][left + 1]).toBe(false);
      expect(modules[top + 3][left + 3]).toBe(true);
    }
  });

  it('renders every dark module into the svg path, offset by the quiet zone', () => {
    const matrix = buildQrMatrix(PUBLIC_PLAY_URL);
    const path = qrMatrixToSvgPath(matrix);

    const darkCount = matrix.modules.flat().filter(Boolean).length;
    expect(path.match(/M/g) ?? []).toHaveLength(darkCount);
    // 좌상단 파인더의 첫 칸은 여백만큼 밀려 있어야 한다.
    expect(path.startsWith(`M${QR_QUIET_ZONE} ${QR_QUIET_ZONE}h1v1h-1z`)).toBe(true);
  });
});
