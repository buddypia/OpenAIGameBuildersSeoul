import { describe, it, expect } from 'vitest';
import { encodeEcosystemDNA, decodeEcosystemDNA, generateShortCode } from '../features/hive';
import { HiveEcosystemDNA } from '../shared/kernel';

describe('Hive DNA Serialization & Codec', () => {
  const sampleDNA: HiveEcosystemDNA = {
    version: '1.0.0',
    creatorName: '테스트_지휘자',
    terrariumName: '신비의 보틀',
    timestamp: 1724450000000,
    env: {
      sunlight: 70,
      moisture: 60,
      temperature: 24,
      nutrients: 50,
      dayNightCycle: 0.3,
      autoDayNight: true,
      timeSpeed: 1,
    },
    customization: {
      bottleShape: 'geometric-dome',
      substrate: 'moss-forest',
      background: 'cozy-lab',
    },
    speciesUnlocked: ['lumi_flora', 'jelly_wiggle', 'solar_bloom'],
    stats: {
      totalAge: 120,
      highestScore: 780,
      discoveredCount: 3,
    },
    organisms: [
      {
        speciesId: 'jelly_wiggle',
        generation: 3,
        customName: '코덱스 젤리',
        genome: {
          size: 1.1,
          speed: 1.2,
          metabolism: 1,
          tempOpt: 22,
          tempTol: 10,
          moistOpt: 60,
          hue: 330,
          mutationRate: 0.15,
          defense: 0.2,
          bioluminescence: 0.6,
        },
      },
    ],
  };

  it('compresses and encodes ecosystem DNA into a URI-safe string', () => {
    const encoded = encodeEcosystemDNA(sampleDNA);
    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(10);
  });

  it('decompresses encoded DNA back into an identical payload object', () => {
    const encoded = encodeEcosystemDNA(sampleDNA);
    const decoded = decodeEcosystemDNA(encoded);
    expect(decoded).toBeDefined();
    expect(decoded?.creatorName).toBe(sampleDNA.creatorName);
    expect(decoded?.env.temperature).toBe(24);
    expect(decoded?.customization.bottleShape).toBe('geometric-dome');
    expect(decoded?.organisms[0].customName).toBe('코덱스 젤리');
  });

  it('rejects malformed DNA instead of passing unsafe values into the simulation', () => {
    const encoded = encodeEcosystemDNA({
      ...sampleDNA,
      env: { ...sampleDNA.env, temperature: Number.NaN },
    });
    expect(decodeEcosystemDNA(encoded)).toBeNull();
  });

  it('loads version 1.0 DNA samples by assigning their missing generation safely', () => {
    const legacyDNA = {
      ...sampleDNA,
      version: '1.0.0',
      sampleOrganisms: sampleDNA.organisms.map(({ generation: _generation, ...organism }) => organism),
    } as any;
    delete legacyDNA.organisms;

    const decoded = decodeEcosystemDNA(encodeEcosystemDNA(legacyDNA));
    expect(decoded?.organisms[0].generation).toBe(1);
  });

  it('generates an 8-character human-readable short code in ECO-XXXX-XX format', () => {
    const encoded = encodeEcosystemDNA(sampleDNA);
    const shortCode = generateShortCode(encoded);
    expect(shortCode).toMatch(/^ECO-[A-Z0-9]{4}-[A-Z0-9]{2,4}$/);
  });
});
