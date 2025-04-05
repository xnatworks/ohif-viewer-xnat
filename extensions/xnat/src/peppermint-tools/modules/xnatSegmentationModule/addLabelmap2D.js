import { getConfig } from './configuration';
import { ARRAY_TYPES } from './utils';

const { UINT_16_ARRAY, FLOAT_32_ARRAY } = ARRAY_TYPES;

export default function addLabelmap2D(
  brushStackState,
  labelmapIndex,
  imageIdIndex,
  rows,
  columns
) {
  const sliceLength = rows * columns;

  const elementOffset = sliceLength * imageIdIndex;

  let pixelData;

  const configuration = getConfig();
  switch (configuration.arrayType) {
    case UINT_16_ARRAY:
      pixelData = new Uint16Array(
        brushStackState.labelmaps3D[labelmapIndex].buffer,
        elementOffset * 2, // 2 bytes/voxel
        sliceLength
      );

      break;

    case FLOAT_32_ARRAY:
      pixelData = new Float32Array(
        brushStackState.labelmaps3D[labelmapIndex].buffer,
        elementOffset * 4, // 4 bytes/voxel
        sliceLength
      );
      break;

    default:
      throw new Error(`Unsupported Array Type ${configuration.arrayType}`);
  }

  brushStackState.labelmaps3D[labelmapIndex].labelmaps2D[imageIdIndex] = {
    pixelData,
    segmentsOnLabelmap: [],
  };
}
