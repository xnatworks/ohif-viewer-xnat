/* eslint-disable no-console */
import cornerstone from 'cornerstone-core';

import { getState } from './state';
import { getConfig } from './configuration';
import { ARRAY_TYPES, getSegmentsOnPixelData, getFirstImageId } from './utils';
import { getLabelmap3D } from './getters';

import addLabelmap3D from './addLabelmap3D';
import triggerLabelmapModifiedEvent from './triggerLabelmapModifiedEvent';

const { UINT_16_ARRAY, FLOAT_32_ARRAY } = ARRAY_TYPES;

export function setMetadata(
  elementOrEnabledElementUID,
  labelmapIndex = 0,
  segmentIndex,
  metadata
) {
  const { element, firstImageId, numberOfFrames } = getFirstImageId(
    elementOrEnabledElementUID
  );
  if (!firstImageId) {
    return;
  }

  const state = getState();
  let brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    state.series[firstImageId] = {
      labelmapIndex,
      labelmaps3D: [],
    };

    brushStackState = state.series[firstImageId];
  }

  if (!brushStackState.labelmaps3D[labelmapIndex]) {
    const enabledElement = cornerstone.getEnabledElement(element);

    const { rows, columns } = enabledElement.image;
    const size = rows * columns * numberOfFrames;

    addLabelmap3D(brushStackState, labelmapIndex, size);
  }

  const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];

  labelmap3D.metadata[segmentIndex] = metadata;
}

export function setLabelmap3DForElement(
  elementOrEnabledElementUID,
  buffer,
  labelmapIndex,
  metadata = [],
  segmentsOnLabelmapArray,
  colorLUTIndex = 0
) {
  const { element, firstImageId, numberOfFrames } = getFirstImageId(
    elementOrEnabledElementUID
  );
  if (!firstImageId) {
    return;
  }

  setLabelmap3DByFirstImageId(
    firstImageId,
    buffer,
    labelmapIndex,
    metadata,
    numberOfFrames,
    segmentsOnLabelmapArray,
    colorLUTIndex
  );

  triggerLabelmapModifiedEvent(element, labelmapIndex);
}

export function setLabelmap3DByFirstImageId(
  firstImageId,
  buffer,
  labelmapIndex,
  metadata = [],
  numberOfFrames,
  segmentsOnLabelmapArray,
  colorLUTIndex = 0
) {
  const state = getState();
  let brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    state.series[firstImageId] = {
      activeLabelmapIndex: labelmapIndex,
      labelmaps3D: [],
    };

    brushStackState = state.series[firstImageId];
  }

  brushStackState.labelmaps3D[labelmapIndex] = {
    buffer,
    labelmaps2D: [],
    metadata,
    activeSegmentIndex: 1,
    colorLUTIndex,
    segmentsHidden: [],
    undo: [],
    redo: [],
  };

  const labelmaps2D = brushStackState.labelmaps3D[labelmapIndex].labelmaps2D;
  const slicelengthInBytes = buffer.byteLength / numberOfFrames;

  for (let i = 0; i < numberOfFrames; i++) {
    let pixelData;

    const configuration = getConfig();
    switch (configuration.arrayType) {
      case UINT_16_ARRAY:
        pixelData = new Uint16Array(
          buffer,
          slicelengthInBytes * i, // 2 bytes/voxel
          slicelengthInBytes / 2
        );

        break;

      case FLOAT_32_ARRAY:
        pixelData = new Float32Array(
          buffer,
          slicelengthInBytes * i,
          slicelengthInBytes / 4
        );
        break;

      default:
        throw new Error(`Unsupported Array Type ${configuration.arrayType}`);
    }

    const segmentsOnLabelmap = segmentsOnLabelmapArray
      ? segmentsOnLabelmapArray[i]
      : getSegmentsOnPixelData(pixelData);

    if (segmentsOnLabelmap && segmentsOnLabelmap.some(segment => segment)) {
      labelmaps2D[i] = {
        pixelData,
        segmentsOnLabelmap,
      };
    }
  }
}

export function setActiveSegmentIndex(
  elementOrEnabledElementUID,
  segmentIndex
) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    return;
  }

  const activeLabelmapIndex = brushStackState.activeLabelmapIndex;
  const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

  const configuration = getConfig();
  if (segmentIndex <= 0) {
    segmentIndex = 1;
  } else if (segmentIndex > configuration.segmentsPerLabelmap) {
    segmentIndex = configuration.segmentsPerLabelmap;
  }

  labelmap3D.activeSegmentIndex = segmentIndex;
}

export function incrementActiveSegmentIndex(elementOrEnabledElementUID) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  _changeActiveSegmentIndex(firstImageId, 'increase');
}

export function decrementActiveSegmentIndex(elementOrEnabledElementUID) {
  const { firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  _changeActiveSegmentIndex(firstImageId, 'decrease');
}

function _changeActiveSegmentIndex(
  firstImageId,
  increaseOrDecrease = 'increase'
) {
  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    return;
  }

  const configuration = getConfig();

  const activeLabelmapIndex = brushStackState.activeLabelmapIndex;
  const labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];

  switch (increaseOrDecrease) {
    case 'increase':
      labelmap3D.activeSegmentIndex++;

      if (labelmap3D.activeSegmentIndex > configuration.segmentsPerLabelmap) {
        labelmap3D.activeSegmentIndex = 1;
      }
      break;
    case 'decrease':
      labelmap3D.activeSegmentIndex--;

      if (labelmap3D.activeSegmentIndex <= 0) {
        labelmap3D.activeSegmentIndex = configuration.segmentsPerLabelmap;
      }
      break;
  }
}

export function toggleSegmentVisibility(
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
  const segmentsHidden = labelmap3D.segmentsHidden;

  segmentsHidden[segmentIndex] = !segmentsHidden[segmentIndex];

  return !segmentsHidden[segmentIndex];
}

export function deleteSegment(
  elementOrEnabledElementUID,
  segmentIndex,
  labelmapIndex
) {
  if (!segmentIndex) {
    return;
  }

  const { element, firstImageId } = getFirstImageId(elementOrEnabledElementUID);
  if (!firstImageId) {
    return;
  }

  const state = getState();
  const brushStackState = state.series[firstImageId];

  if (!brushStackState) {
    return;
  }

  labelmapIndex =
    labelmapIndex === undefined
      ? brushStackState.activeLabelmapIndex
      : labelmapIndex;

  const labelmap3D = brushStackState.labelmaps3D[labelmapIndex];

  if (!labelmap3D) {
    return;
  }

  // Delete metadata if present.
  delete labelmap3D.metadata[segmentIndex];

  const labelmaps2D = labelmap3D.labelmaps2D;

  // Clear segment's voxels.
  for (let i = 0; i < labelmaps2D.length; i++) {
    const labelmap2D = labelmaps2D[i];

    // If the labelmap2D has data, and it contains the segment, delete it.
    if (labelmap2D && labelmap2D.segmentsOnLabelmap.includes(segmentIndex)) {
      const pixelData = labelmap2D.pixelData;

      // Remove this segment from the list.
      const indexOfSegment = labelmap2D.segmentsOnLabelmap.indexOf(
        segmentIndex
      );

      labelmap2D.segmentsOnLabelmap.splice(indexOfSegment, 1);

      // Delete the label for this segment.
      for (let p = 0; p < pixelData.length; p++) {
        if (pixelData[p] === segmentIndex) {
          pixelData[p] = 0;
        }
      }
    }
  }

  cornerstone.updateImage(element);
}

export function setActiveLabelmapIndex(
  elementOrEnabledElementUID,
  labelmapIndex = 0
) {
  const { element, firstImageId, numberOfFrames } = getFirstImageId(
    elementOrEnabledElementUID
  );
  if (!firstImageId) {
    return;
  }

  const enabledElement = cornerstone.getEnabledElement(element);
  const { rows, columns } = enabledElement.image;
  const size = rows * columns * numberOfFrames;

  const state = getState();
  let brushStackState = state.series[firstImageId];

  if (brushStackState) {
    brushStackState.activeLabelmapIndex = labelmapIndex;

    if (!brushStackState.labelmaps3D[labelmapIndex]) {
      addLabelmap3D(brushStackState, labelmapIndex, size);
    }
  } else {
    state.series[firstImageId] = {
      activeLabelmapIndex: labelmapIndex,
      labelmaps3D: [],
    };

    brushStackState = state.series[firstImageId];

    addLabelmap3D(brushStackState, labelmapIndex, size);
  }

  cornerstone.updateImage(element);
}

export function setRadius(newRadius) {
  const configuration = getConfig();
  configuration.radius = Math.min(
    Math.max(newRadius, configuration.minRadius),
    configuration.maxRadius
  );
}

export function pushState(element, operations, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);

  labelmap3D.undo.push(operations);
  labelmap3D.redo = [];
}

export function undo(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);
  const { undo, redo } = labelmap3D;

  if (!undo.length) {
    console.warn('No undos left.');

    return;
  }

  // Pop last set of operations from undo.
  const operations = undo.pop();

  // Undo operations.
  applyState(labelmap3D, operations, 1);

  // Push set of operations to redo.
  redo.push(operations);

  cornerstone.updateImage(element);
}

export function redo(element, labelmapIndex) {
  const labelmap3D = getLabelmap3D(element, labelmapIndex);
  const { undo, redo } = labelmap3D;

  if (!redo.length) {
    console.warn('No redos left.');

    return;
  }

  // Pop last set of operations from redo.
  const operations = redo.pop();

  // Redo operations.
  applyState(labelmap3D, operations, 2);

  // Push set of operations to undo.
  undo.push(operations);

  cornerstone.updateImage(element);
}

function applyState(labelmap3D, operations, replaceIndex) {
  const { labelmaps2D } = labelmap3D;

  operations.forEach(operation => {
    const { imageIdIndex, diff } = operation;
    const labelmap2D = labelmaps2D[imageIdIndex];
    const pixelData = labelmap2D.pixelData;

    for (let i = 0; i < diff.length; i++) {
      const diffI = diff[i];

      pixelData[diffI[0]] = diffI[replaceIndex];
    }
  });
}
