import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const forbiddenExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp3', '.wav', '.ogg', '.woff', '.woff2', '.ttf', '.otf']);
const scannedDirectories = ['src', 'public'];
const violations = [];

function visit(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) visit(path);
    else {
      const extension = entry.includes('.') ? `.${entry.split('.').pop().toLowerCase()}` : '';
      if (forbiddenExtensions.has(extension)) violations.push(`${relative(root, path)}: 외부 디자인/오디오 에셋 확장자 금지`);
      if (/\.(?:[cm]?[jt]sx?|css|html)$/i.test(entry)) {
        const source = readFileSync(path, 'utf8');
        if (/(?:https?:)?\/\//.test(source)) violations.push(`${relative(root, path)}: 외부 URL 의존 금지`);
        if (/<img\b|new\s+Image\s*\(/.test(source)) violations.push(`${relative(root, path)}: 이미지 렌더링 API 금지`);
        if (/<audio\b|new\s+Audio\s*\(/.test(source)) violations.push(`${relative(root, path)}: 파일 오디오 API 금지`);
      }
    }
  }
}

for (const directory of scannedDirectories) visit(join(root, directory));
if (violations.length) {
  console.error('ZERO-ASSET GATE: FAIL');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('ZERO-ASSET GATE: PASS — Canvas/CSS/Web Audio only; no external design resources detected.');
