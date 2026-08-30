/** Public API for portable ecosystem DNA and Hive social UI. */
export {
  buildQrMatrix,
  PUBLIC_PLAY_URL,
  QR_QUIET_ZONE,
  qrMatrixToSvgPath,
  qrViewBoxSize,
  resolvePlayUrl,
} from './domain/qrCode';
export type { QrMatrix } from './domain/qrCode';
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
export { QrCodeArt } from './presentation/QrCodeArt';
export { QrPlayBadge } from './presentation/QrPlayBadge';
export { QrShareModal } from './presentation/QrShareModal';
export { usePlayUrl } from './presentation/usePlayUrl';
