import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * 문서가 코드를 따라오게 만드는 테스트.
 *
 * 요구사항(FR/NFR ID) → 컨텍스트 SPEC → 코드의 사슬은 사람이 손으로 맞추면
 * 반드시 어긋난다. 어긋나는 순간을 빌드에서 잡는다.
 */
const projectRoot = resolve(process.cwd());
const contextsRoot = join(projectRoot, 'docs', 'contexts');
const featureRoot = join(projectRoot, 'src', 'features');

const read = (relativePath: string) => readFileSync(join(projectRoot, relativePath), 'utf8');

/** `FR-ENV-01`, `NFR-UX-02` 형태의 추적 키. */
const ID_PATTERN = /\bN?FR-[A-Z]+-\d{2}\b/g;
const idsIn = (source: string) => new Set(source.match(ID_PATTERN) ?? []);

function collectMarkdown(directory: string): string[] {
  return readdirSync(join(projectRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return collectMarkdown(relativePath);
    return entry.name.endsWith('.md') ? [relativePath] : [];
  });
}

function collectSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSources(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const docFiles = [
  'FEATURES.md',
  'README.md',
  'AGENTS.md',
  'REQUIREMENTS.md',
  'PRD.md',
  'PLAN.md',
  ...collectMarkdown('docs'),
];

/** 컨텍스트 SPEC 파일명은 `src/features/<name>` 과 같아야 한다. */
const contextSpecs = readdirSync(contextsRoot)
  .filter(
    (name) =>
      name.endsWith('.md') && !name.startsWith('_') && !name.startsWith('.') && name !== 'README.md',
  )
  .map((name) => name.replace(/\.md$/, ''));

const featureContexts = readdirSync(featureRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

describe('requirement traceability', () => {
  const declaredIds = idsIn(read('REQUIREMENTS.md'));

  it('lists every declared requirement in the feature index', () => {
    const listedIds = idsIn(read('FEATURES.md'));
    const unlisted = [...declaredIds].filter((id) => !listedIds.has(id));
    expect(unlisted, 'REQUIREMENTS.md에 있으나 FEATURES.md에 없는 요구사항').toEqual([]);
  });

  it('keeps the feature index free of requirements that do not exist', () => {
    const listedIds = idsIn(read('FEATURES.md'));
    const orphans = [...listedIds].filter((id) => !declaredIds.has(id));
    expect(orphans, 'FEATURES.md가 참조하지만 REQUIREMENTS.md에 없는 ID').toEqual([]);
  });

  it('keeps every context spec citing requirements that actually exist', () => {
    for (const context of contextSpecs) {
      const orphans = [...idsIn(read(`docs/contexts/${context}.md`))].filter(
        (id) => !declaredIds.has(id),
      );
      expect(orphans, `docs/contexts/${context}.md의 고아 ID`).toEqual([]);
    }
  });
});

describe('context specs', () => {
  it('pairs every bounded context with exactly one spec', () => {
    expect([...contextSpecs].sort()).toEqual([...featureContexts].sort());
  });

  it('keeps every spec on the seven-section shape', () => {
    const sections = ['## 1.', '## 2.', '## 3.', '## 4.', '## 5.', '## 6.', '## 7.'];
    for (const context of contextSpecs) {
      const body = read(`docs/contexts/${context}.md`);
      const missing = sections.filter((section) => !body.includes(section));
      expect(missing, `docs/contexts/${context}.md의 누락된 절`).toEqual([]);
    }
  });

  it('cites only identifiers that exist somewhere in the source', () => {
    const sourceBlob = collectSources(join(projectRoot, 'src'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    // 약어는 식별자가 아니라 산문이다.
    const prose = new Set(['DoD', 'SPEC', 'API', 'HUD', 'DNA', 'QR', 'FPS', 'GC', 'UI']);
    // 대문자를 하나라도 포함한 토큰만 식별자로 본다. `domain`, `presentation` 같은
    // 순수 소문자 낱말은 레이어를 가리키는 산문이라 코드에 있을 필요가 없다.
    const identifier = /`([A-Za-z][A-Za-z0-9_]*[A-Z][A-Za-z0-9_]*)`/g;

    for (const context of contextSpecs) {
      const cited = new Set(
        [...read(`docs/contexts/${context}.md`).matchAll(identifier)].map((match) => match[1]),
      );
      const invented = [...cited].filter(
        (name) => !prose.has(name) && !new RegExp(`\\b${name}\\b`).test(sourceBlob),
      );
      expect(invented, `docs/contexts/${context}.md가 인용한 없는 식별자`).toEqual([]);
    }
  });
});

describe('documentation references', () => {
  it('resolves every relative link', () => {
    const linkPattern = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
    const broken: string[] = [];

    for (const doc of docFiles) {
      for (const [, href] of read(doc).matchAll(linkPattern)) {
        if (/^(https?:|mailto:)/.test(href)) continue;
        if (!existsSync(resolve(projectRoot, dirname(doc), href))) broken.push(`${doc} -> ${href}`);
      }
    }

    expect(broken, '깨진 상대 링크').toEqual([]);
  });

  it('quotes only source paths that exist', () => {
    const pathPattern = /`(src\/[A-Za-z0-9_./-]+)`/g;
    const missing: string[] = [];

    for (const doc of docFiles) {
      for (const [, quoted] of read(doc).matchAll(pathPattern)) {
        if (!existsSync(join(projectRoot, quoted))) missing.push(`${doc} -> ${quoted}`);
      }
    }

    expect(missing, '문서가 인용한 존재하지 않는 경로').toEqual([]);
  });

  it('keeps the spec archive numbered so work stays ordered', () => {
    const entries = readdirSync(join(projectRoot, 'docs', 'specs')).filter(
      (name) => !name.startsWith('_') && !name.startsWith('.') && name !== 'README.md',
    );
    for (const entry of entries) {
      expect(entry, `docs/specs/${entry}는 NNNN- 접두사를 가져야 한다`).toMatch(/^\d{4}-/);
    }
    expect(entries.length).toBeGreaterThan(0);
  });

  it('keeps the spec index listing every archived task', () => {
    const index = read('docs/specs/README.md');
    const entries = readdirSync(join(projectRoot, 'docs', 'specs')).filter(
      (name) => !name.startsWith('_') && !name.startsWith('.') && name !== 'README.md',
    );
    const unlisted = entries.filter((entry) => !index.includes(entry));
    expect(unlisted, 'docs/specs/README.md에 없는 작업').toEqual([]);
  });
});

describe('claims that drift when content grows', () => {
  it('keeps the encyclopedia at or above the fifteen species FR-BIO-01 promises', () => {
    const species = read('src/features/ecosystem/domain/speciesData.ts').match(/^\s+id: /gm) ?? [];
    expect(species.length).toBeGreaterThanOrEqual(15);
    expect(read('docs/contexts/species.md')).toContain(`현 빌드 ${species.length}종`);
  });

  it('keeps the quest list at or above the ten FR-PROG-01 promises', () => {
    const quests = read('src/features/progression/domain/questData.ts').match(/^\s+id: /gm) ?? [];
    expect(quests.length).toBeGreaterThanOrEqual(10);
    expect(read('docs/contexts/progression.md')).toContain(`현 빌드 ${quests.length}개`);
  });

  it('keeps every context spec pointing at test files that exist', () => {
    const testFiles = new Set(readdirSync(join(projectRoot, 'src', 'test')));
    for (const context of contextSpecs) {
      const cited = [...read(`docs/contexts/${context}.md`).matchAll(/`src\/test\/([\w.-]+\.ts)`/g)];
      for (const [, file] of cited) {
        expect(testFiles.has(file), `docs/contexts/${context}.md -> src/test/${file}`).toBe(true);
      }
    }
  });
});

describe('spec templates stay usable', () => {
  it('ships the three-file change template', () => {
    for (const file of ['spec.md', 'plan.md', 'tasks.md']) {
      expect(statSync(join(projectRoot, 'docs', 'specs', '_TEMPLATE', file)).size).toBeGreaterThan(0);
    }
  });

  it('ships the context spec template', () => {
    expect(statSync(join(contextsRoot, '_TEMPLATE.md')).size).toBeGreaterThan(0);
  });
});
