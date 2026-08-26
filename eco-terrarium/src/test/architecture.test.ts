import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const sourceRoot = resolve(process.cwd(), 'src');
const featureRoot = join(sourceRoot, 'features');
const requiredContexts = [
  'audio',
  'customization',
  'ecosystem',
  'hive',
  'i18n',
  'onboarding',
  'photo',
  'progression',
  'showcase',
  'species',
];

function findSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

/** Drops `//` and block comments so prose in a comment cannot fail a code rule. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Drops quoted strings so player-facing prose cannot fail a code rule. */
function stripQuotedStrings(source: string): string {
  return source.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
}

describe('lightweight DDD structure', () => {
  it('keeps every current bounded context behind an explicit public API', () => {
    for (const context of requiredContexts) {
      expect(existsSync(join(featureRoot, context, 'index.ts'))).toBe(true);
    }
  });

  it('does not restore the former technology-first source directories', () => {
    for (const legacyDirectory of ['audio', 'components', 'rendering', 'simulation', 'types', 'utils']) {
      expect(existsSync(join(sourceRoot, legacyDirectory))).toBe(false);
    }
  });

  it('keeps the application composition root on feature public APIs', () => {
    const appSource = readFileSync(join(sourceRoot, 'app', 'App.tsx'), 'utf8');
    expect(appSource).not.toMatch(/from ['"]\.\.\/features\/[^'"]+\/(?:domain|application|infrastructure|presentation)/);
    expect(appSource).toMatch(/from ['"]\.\.\/features\/ecosystem['"]/);
    expect(appSource).toMatch(/from ['"]\.\.\/features\/hive['"]/);
  });

  it('keeps domain code independent from presentation and browser technology', () => {
    const domainFiles = findSourceFiles(featureRoot).filter((path) => path.includes('/domain/'));
    expect(domainFiles.length).toBeGreaterThan(0);

    for (const path of domainFiles) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/from ['"][^'"]*(?:react|lucide-react|presentation)[^'"]*['"]/);
      // Locale catalogues are domain data made of prose, so the browser-API rule
      // is checked against code only.
      const code = stripQuotedStrings(stripComments(source));
      expect({ path, code: code.match(/\b(?:window|document|AudioContext|HTMLCanvasElement)\b/) }).toEqual({
        path,
        code: null,
      });
    }
  });

  it('keeps the microscope flow and sidebar responsive safeguards visible in the UI', () => {
    const hudSource = readFileSync(
      join(featureRoot, 'ecosystem', 'presentation', 'EnvironmentHUD.tsx'),
      'utf8'
    );
    const canvasSource = readFileSync(
      join(featureRoot, 'ecosystem', 'presentation', 'TerrariumCanvas.tsx'),
      'utf8'
    );
    const appSource = readFileSync(join(sourceRoot, 'app', 'App.tsx'), 'utf8');
    const stylesheet = readFileSync(join(sourceRoot, 'index.css'), 'utf8');
    const messagesSource = readFileSync(
      join(featureRoot, 'i18n', 'domain', 'messages.ts'),
      'utf8'
    );

    // The copy itself now lives in the locale catalogue, so the UI is checked
    // for the wiring and the Korean catalogue for the wording.
    expect(hudSource).toContain('t.hud.microscopeHowToTitle');
    expect(messagesSource).toContain('현미경 관찰 방법');
    expect(hudSource).toContain('sm:grid-cols-2');
    expect(canvasSource).toContain('t.canvas.hints[activeTool]');
    expect(messagesSource).toContain('클릭하거나 터치해 관찰창을 여세요');
    expect(canvasSource).toContain('cursor-inspect');
    expect(stylesheet).toContain('.cursor-inspect');
    expect(stylesheet).toContain("width='40'");
    expect(stylesheet).toContain("r='12' fill='none'");
    expect(stylesheet).toContain("stroke-opacity='.88'");
    expect(stylesheet).toContain('zoom-in');
    expect(appSource).toContain('lg:w-[440px] xl:w-[480px]');
    expect(appSource).toContain('min-w-0 hidden sm:block');
  });

  it('keeps every language catalogue complete and in the shipped order', () => {
    const localeSource = readFileSync(join(featureRoot, 'i18n', 'domain', 'locale.ts'), 'utf8');
    expect(localeSource).toContain("export const LOCALES = ['ko', 'en', 'ja'] as const;");
    expect(localeSource).toContain("export const DEFAULT_LOCALE: Locale = 'ko';");

    for (const catalogue of ['messages.en.ts', 'messages.ja.ts']) {
      expect(existsSync(join(featureRoot, 'i18n', 'domain', catalogue))).toBe(true);
    }
  });

  it('keeps player-facing Korean copy out of the feature components', () => {
    const componentFiles = findSourceFiles(featureRoot).filter(
      (path) => path.includes('/presentation/') && !path.includes(`${sep}i18n${sep}`)
    );
    expect(componentFiles.length).toBeGreaterThan(0);

    for (const path of [...componentFiles, join(sourceRoot, 'app', 'App.tsx')]) {
      const source = stripComments(readFileSync(path, 'utf8'));
      const hangul = source.match(/[\uAC00-\uD7A3]/g) ?? [];
      expect({ path, hangul }).toEqual({ path, hangul: [] });
    }
  });
});
