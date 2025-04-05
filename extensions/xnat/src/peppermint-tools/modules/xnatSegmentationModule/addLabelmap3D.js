import { getConfig } from './configuration';
import { ARRAY_TYPES } from './utils';

const { UINT_16_ARRAY, FLOAT_32_ARRAY } = ARRAY_TYPES;

export default function addLabelmap3D(brushStackState, labelmapIndex, size) {
  let bytesPerVoxel;

  const configuration = getConfig();

  switch (configuration.arrayType) {
    case UINT_16_ARRAY:
      bytesPerVoxel = 2;

      break;

    case FLOAT_32_ARRAY:
      bytesPerVoxel = 4;
      break;

    default:
      throw new Error(`Unsupported Array Type ${configuration.arrayType}`);
  }

  // Buffer size is multiplied by bytesPerVoxel to allocate enough space.
  brushStackState.labelmaps3D[labelmapIndex] = {
    buffer: new ArrayBuffer(size * bytesPerVoxel),
    labelmaps2D: [],
    metadata: [],
    activeSegmentIndex: 1,
    colorLUTIndex: 0,
    segmentsHidden: [],
    undo: [],
    redo: [],
  };
}
