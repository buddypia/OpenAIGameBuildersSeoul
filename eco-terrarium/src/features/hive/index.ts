/** Public API for portable ecosystem DNA and Hive social UI. */
export {
  decodeEcosystemDNA,
  encodeEcosystemDNA,
  generateShortCode,
  isValidEcosystemDNA,
} from './infrastructure/dnaCodec';
export {
  clearEcosystemLocally,
  getDefaultSaveStorage,
  loadEcosystemLocally,
  LOCAL_SAVE_KEY,
  saveEcosystemLocally,
} from './infrastructure/localSave';
export type { LocalSaveSnapshot, SaveStorage } from './infrastructure/localSave';
export { HiveShareModal } from './presentation/HiveShareModal';
