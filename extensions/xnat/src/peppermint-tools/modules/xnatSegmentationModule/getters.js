/* eslint-disable no-console */
import cornerstone from 'cornerstone-core';

import addLabelmap3D from './addLabelmap3D';
import addLabelmap2D from './addLabelmap2D';
import { getState } from './state';
import { getConfig } from './configuration';
import {
  ARRAY_TYPES,
  getElement,
  getFirstImageId,
  getSegmentsOnPixelData,
  getImagePlanes,
  calculateLabelmapStats,
  isPointInImage,
} from './utils';

const { UINT_16_ARRAY, FLOAT_32_ARRAY } = ARRAY_TYPES;

export function getMetadata(
  elementOrEnabledElementUID,
  labelmapIndex,
  segmentIndex
) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    console.warn(`brushStackState is undefined`);

    return;
  }

  labelmapIndex =
    labelmapIndex === undefined
      ? brushStackState.activeLabelmapIndex
      : labelmapIndex;

  if (!brushStackState.labelmaps3D[labelmapIndex]) {
    console.warn(`No labelmap3D of labelmap index ${labelmapIndex} on stack.`);
    return;
  }

  const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];

  if (segmentIndex === undefined) {
    return labelmap3D.metadata;
  }

  return labelmap3D.metadata[segmentIndex];
}

export function getLabelmap3D(elementOrEnabledElementUID, labelmapIndex) {
  const { labelmaps3D, activeLabelmapIndex } = getLabelmaps3D(
    elementOrEnabledElementUID
  );

  if (!labelmaps3D) {
    return;
  }

  labelmapIndex =
    labelmapIndex !== undefined ? labelmapIndex : activeLabelmapIndex;

  return labelmaps3D[labelmapIndex];
}

export function getLabelmaps3D(elementOrEnabledElementUID) {
  const { firstImageId, currentImageIdIndex } = getFirstImageId(
    elementOrEnabledElementUID
  );
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  let labelmaps3D;
  let activeLabelmapIndex;

  if (brushStackState) {
    labelmaps3D = brushStackState.labelmaps3D;
    activeLabelmapIndex = brushStackState.activeLabelmapIndex;
  }

  return {
    labelmaps3D,
    activeLabelmapIndex,
    currentImageIdIndex: currentImageIdIndex,
  };
}

export function getActiveLabelmapIndex(elementOrEnabledElementUID) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    return;
  }

  return brushStackState.activeLabelmapIndex;
}

export function getActiveSegmentIndex(
  elementOrEnabledElementUID,
  labelmapIndex
) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (brushStackState) {
    labelmapIndex =
      labelmapIndex === undefined
        ? brushStackState.activeLabelmapIndex
        : labelmapIndex;

    const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];

    if (labelmap3D) {
      return labelmap3D.activeSegmentIndex;
    }
  }

  return 1;
}

export function isSegmentVisible(
  elementOrEnabledElementUID,
  segmentIndex,
  labelmapIndex
) {
  if (!segmentIndex) {
    return;
  }

  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    console.warn(`brushStackState is undefined`);

    return;
  }

  labelmapIndex =
    labelmapIndex === undefined
      ? brushStackState.activeLabelmapIndex
      : labelmapIndex;

  if (!brushStackState.labelmaps3D[labelmapIndex]) {
    console.warn(`No labelmap3D of labelmap index ${labelmapIndex} on stack.`);

    return;
  }

  const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];
  return !labelmap3D.segmentsHidden[segmentIndex];
}

export function getLabelmap2D(elementOrEnabledElementUID) {
  const {
    element,
    firstImageId,
    currentImageIdIndex,
    numberOfFrames,
  } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const enabledElement = cornerstone.getEnabledElement(element);

  const { rows, columns } = enabledElement.image;

  const state = getState();
  let brushStackState = state.series[firstImageId];

  let activeLabelmapIndex;

  if (brushStackState) {
    activeLabelmapIndex = brushStackState.activeLabelmapIndex;

    if (!brushStackState.labelmaps3D[activeLabelmapIndex]) {
      const size = rows * columns * numberOfFrames;

      addLabelmap3D(brushStackState, activeLabelmapIndex, size);
    }

    if (
      !brushStackState.labelmaps3D[activeLabelmapIndex].labelmaps2D[
        currentImageIdIndex
      ]
    ) {
      addLabelmap2D(
        brushStackState,
        activeLabelmapIndex,
        currentImageIdIndex,
        rows,
        columns
      );
    }
  } else {
    activeLabelmapIndex = 0;

    state.series[firstImageId] = {
      activeLabelmapIndex,
      labelmaps3D: [],
    };

    brushStackState = state.series[firstImageId];

    const size = rows * columns * numberOfFrames;

    addLabelmap3D(brushStackState, activeLabelmapIndex, size);

    addLabelmap2D(
      brushStackState,
      activeLabelmapIndex,
      currentImageIdIndex,
      rows,
      columns
    );
  }

  const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

  return {
    labelmap2D: labelmap3D.labelmaps2D[currentImageIdIndex],
    labelmap3D,
    currentImageIdIndex,
    activeLabelmapIndex,
  };
}

export function getLabelmap2DByImageIdIndex(
  labelmap3D,
  imageIdIndex,
  rows,
  columns
) {
  if (!labelmap3D.labelmaps2D[imageIdIndex]) {
    const sliceLength = rows * columns;

    const elementOffset = sliceLength * imageIdIndex;

    let pixelData;

    const configuration = getConfig();
    switch (configuration.arrayType) {
      case UINT_16_ARRAY:
        pixelData = new Uint16Array(
          labelmap3D.buffer,
          elementOffset * 2, // 2 bytes/voxel
          sliceLength
        );

        break;

      case FLOAT_32_ARRAY:
        pixelData = new Float32Array(
          labelmap3D.buffer,
          elementOffset * 4, // 4 bytes/voxel
          sliceLength
        );
        break;

      default:
        throw new Error(`Unsupported Array Type ${configuration.arrayType}`);
    }

    labelmap3D.labelmaps2D[imageIdIndex] = {
      pixelData,
      segmentsOnLabelmap: getSegmentsOnPixelData(pixelData),
    };
  }

  return labelmap3D.labelmaps2D[imageIdIndex];
}

export function getLabelmapStats(
  elementOrEnabledElementUID,
  segmentIndex,
  labelmapIndex
) {
  const { firstImageId, imageIds } = getFirstImageId(
    elementOrEnabledElementUID
  );
  if (!firstImageId) {
    return;
  }

  return new Promise(resolve => {
    const state = getState();
    const brushStackState = state.series[firstImageId];

    if (!brushStackState) {
      resolve(null);
    }

    const { sufficientMetadata, imagePlanes } = getImagePlanes(imageIds);

    if (!sufficientMetadata) {
      console.warn(
        'Insufficient imagePlaneModule information to calculate volume statistics.'
      );
      resolve(null);
    }

    labelmapIndex =
      labelmapIndex === undefined
        ? brushStackState.activeLabelmapIndex
        : labelmapIndex;

    const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];

    const imagePromises = [];

    for (let i = 0; i < imageIds.length; i++) {
      imagePromises.push(cornerstone.loadAndCacheImage(imageIds[i]));
    }

    Promise.all(imagePromises).then(images => {
      const stats = calculateLabelmapStats(
        labelmap3D,
        images,
        imagePlanes,
        segmentIndex
      );

      resolve(stats);
    });
  });
}

export function getSegmentOfActiveLabelmapAtEvent(evt) {
  const eventData = evt.detail;
  const { element, image, currentPoints } = eventData;

  if (!currentPoints) {
    console.warn('Not a cornerstone input event.');

    return;
  }

  const cols = image.width;
  const rows = image.height;

  const { firstImageId, currentImageIdIndex } = getFirstImageId(element);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  const activeLabelmapIndex = brushStackState.activeLabelmapIndex;

  const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

  if (!labelmap3D) {
    // No labelmap3D === no segment here.
    return;
  }

  const labelmap2D = labelmap3D.labelmaps2D[currentImageIdIndex];

  if (!labelmap2D) {
    // No labelmap on this imageId === no segment here.
    return;
  }

  const pixelData = labelmap2D.pixelData;

  let { x, y } = currentPoints.image;

  x = Math.floor(x);
  y = Math.floor(y);

  if (isPointInImage({ x, y }, rows, cols)) {
    const segmentIndex = pixelData[y * cols + x];

    if (segmentIndex === 0) {
      return;
    }

    return {
      segmentIndex,
      metadata: labelmap3D.metadata[segmentIndex],
    };
  }
}

export function getBrushColor(elementOrEnabledElementUID, drawing = false) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  let color;

  if (brushStackState) {
    const activeLabelmapIndex = brushStackState.activeLabelmapIndex;
    const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

    const activeSegmentIndex = labelmap3D.activeSegmentIndex;

    color = state.colorLutTables[labelmap3D.colorLUTIndex][activeSegmentIndex];
  } else {
    // No data yet, make brush the default color of colormap 0.
    color = state.colorLutTables[0][1];
  }

  return drawing
    ? `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1.0 )`
    : `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8 )`;
}

export function getLabelmapBuffers(elementOrEnabledElementUID, labelmapIndex) {
  const element = getElement(elementOrEnabledElementUID);

  if (!element) {
    return;
  }

  const { labelmaps3D } = getLabelmaps3D(element);

  if (!labelmaps3D) {
    return [];
  }

  let type;
  let bytesPerVoxel;

  const configuration = getConfig();
  switch (configuration.arrayType) {
    case UINT_16_ARRAY:
      type = 'Uint16Array';
      bytesPerVoxel = '2';

      break;

    case FLOAT_32_ARRAY:
      type = 'Float32Array';
      bytesPerVoxel = '4';
      break;

    default:
      throw new Error(`Unsupported Array Type ${configuration.arrayType}`);
  }

  const state = getState();
  const colorLutTables = state.colorLutTables;

  if (labelmapIndex !== undefined) {
    const labelmap3D = labelmaps3D[labelmapIndex];

    if (labelmap3D) {
      return {
        labelmapIndex,
        bytesPerVoxel,
        type,
        buffer: labelmap3D.buffer,
        colorLUT: colorLutTables[labelmap3D.colorLUTIndex],
      };
    }

    return;
  }

  const labelmapBuffers = [];

  for (let i = 0; i < labelmaps3D.length; i++) {
    const labelmap3D = labelmaps3D[i];

    if (labelmap3D) {
      labelmapBuffers.push({
        labelmapIndex: i,
        bytesPerVoxel: 2,
        buffer: labelmap3D.buffer,
        colorLUT: colorLutTables[labelmap3D.colorLUTIndex],
      });
    }
  }

  return labelmapBuffers;
}

export function getActiveLabelmapBuffer(elementOrEnabledElementUID) {
  const { element, firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    return;
  }

  const activeLabelmapIndex = brushStackState.activeLabelmapIndex;

  return getLabelmapBuffers(element, activeLabelmapIndex);
}

export function getColorLUT(labelmap3DOrColorLUTIndex) {
  const state = getState();
  if (typeof labelmap3DOrColorLUTIndex === 'number') {
    return state.colorLutTables[labelmap3DOrColorLUTIndex];
  }

  return state.colorLutTables[labelmap3DOrColorLUTIndex.colorLUTIndex];
}

export function getColorForSegmentIndexColorLUT(
  labelmap3DOrColorLUTIndex,
  segmentIndex
) {
  const colorLUT = getColorLUT(labelmap3DOrColorLUTIndex);

  return colorLUT[segmentIndex];
}
