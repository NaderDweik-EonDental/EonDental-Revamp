import type { AttachmentType } from '../1-domain/caseRules.js';

export interface PhotoTileDef {
  key: string;
  label: string;
  type: AttachmentType;
  fileName: string;
  required?: boolean;
  recommended?: boolean;
  beta?: boolean;
}

export interface PhotoSectionDef {
  title: string;
  tiles: PhotoTileDef[];
}

export const PHOTO_SECTIONS: PhotoSectionDef[] = [
  {
    title: 'Intra-Oral Photos',
    tiles: [
      { key: 'right-buccal', label: 'Right buccal', type: 'photo', fileName: 'Right_buccal.png', required: true },
      { key: 'frontal', label: 'Frontal', type: 'photo', fileName: 'Frontal.png', required: true },
      { key: 'left-buccal', label: 'Left buccal', type: 'photo', fileName: 'Left_buccal.png', required: true },
      { key: 'upper-occlusal', label: 'Upper occlusal', type: 'photo', fileName: 'Upper_occlusal.png', recommended: true },
      { key: 'lower-occlusal', label: 'Lower occlusal', type: 'photo', fileName: 'Lower_occlusal.png', recommended: true },
    ],
  },
  {
    title: 'Facial Images',
    tiles: [
      { key: 'front-smiling', label: 'Front smiling', type: 'photo', fileName: 'Front_smiling.png', recommended: true },
      { key: 'front-non-smiling', label: 'Front non-smiling', type: 'photo', fileName: 'Front_non_smiling.png' },
      { key: 'profile', label: 'Profile', type: 'photo', fileName: 'Profile.png' },
    ],
  },
  {
    title: 'Radiographs',
    tiles: [
      { key: 'panoramic', label: 'Panoramic', type: 'xray', fileName: 'Panoramic.dcm' },
      { key: 'cephalometric', label: 'Cephalometric', type: 'xray', fileName: 'Cephalometric.dcm' },
      { key: 'cbct', label: 'CBCT scans', type: 'xray', fileName: 'CBCT_scans.dcm', beta: true },
    ],
  },
];
