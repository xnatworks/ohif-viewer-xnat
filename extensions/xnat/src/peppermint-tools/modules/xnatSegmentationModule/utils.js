import cornerstone from 'cornerstone-core';
import { store as csStore, getToolState } from 'cornerstone-tools';
import OHIF from '@ohif/core';

const ARRAY_TYPES = {
  UINT_16_ARRAY: 0,
  FLOAT_32_ARRAY: 1,
};

const { getDisplaySetFromImageIds } = OHIF.state;

export { ARRAY_TYPES };

export function getElement(elementOrEnabledElementUID) {
  if (elementOrEnabledElementUID instanceof HTMLElement) {
    return elementOrEnabledElementUID;
  }

  return elementOrEnabledElementUID.element;
}

export function getFirstImageId(elementOrEnabledElementUID) {
  const element = getElement(elementOrEnabledElementUID);

  if (!element) {
    return {};
  }

  const stackState = getToolState(element, 'stack');

  if (!stackState) {
    console.error(
      'Consumers must define stacks in their application if using segmentations in cornerstoneTools.'
    );

    return {};
  }

  const stackData = stackState.data[0];
  const imageIds = stackState.data[0].imageIds;
  let firstImageId = imageIds[0];
  let numberOfFrames = stackData.imageIds.length;
  let currentImageIdIndex = stackData.currentImageIdIndex;

  const displaySet = getDisplaySetFromImageIds(imageIds);
  if (displaySet) {
    const { stackData: subStackData, refDisplaySet } = displaySet;
    const refIndices = subStackData.refIndices;

    firstImageId = refDisplaySet.firstImageId;
    numberOfFrames = refDisplaySet.numImageFrames;
    currentImageIdIndex = refIndices[currentImageIdIndex];
  }

  return {
    element,
    firstImageId,
    currentImageIdIndex,
    imageIds,
    numberOfFrames,
  };
}

export function getImagePlanes(imageIds) {
  const imagePlanes = [];
  const metadataProvider = cornerstone.metaData;

  let sufficientMetadata = true;

  for (let i = 0; i < imageIds.length; i++) {
    const imagePlaneModule = metadataProvider.get(
      'imagePlaneModule',
      imageIds[i]
    );

    if (!imagePlaneModule) {
      sufficientMetadata = false;
      break;
    }

    imagePlanes.push(imagePlaneModule);
  }

  return { sufficientMetadata, imagePlanes };
}

export function calculateLabelmapStats(
  labelmap3D,
  images,
  imagePlanes,
  segmentIndex
) {
  const voxelsPerFrame = getVoxelsPerFrameForSegment(
    labelmap3D,
    images,
    imagePlanes,
    segmentIndex
  );

  let volumeWeightedMean = 0;
  let max = voxelsPerFrame[0].values[0];
  let min = max;
  let volume = 0;

  // Calculate Min, Max, volume and mean.
  for (let i = 0; i < voxelsPerFrame.length; i++) {
    const { values, voxelInMM3 } = voxelsPerFrame[i];

    volume += voxelInMM3 * values.length;

    let sum = 0;

    values.forEach(value => {
      if (value > max) {
        max = value;
      } else if (value < min) {
        min = value;
      }

      sum += value;
    });

    volumeWeightedMean += sum * voxelInMM3;
  }

  volumeWeightedMean /= volume;

  let volumeWeightedStDev = 0;

  // Calculate the volume weigthed standard deviation.
  for (let i = 0; i < voxelsPerFrame.length; i++) {
    const { values, voxelInMM3 } = voxelsPerFrame[i];

    let stdDevSum = 0;

    values.forEach(value => {
      stdDevSum += Math.pow(value - volumeWeightedMean, 2);
    });

    volumeWeightedStDev += stdDevSum * voxelInMM3;
  }

  volumeWeightedStDev /= volume;
  volumeWeightedStDev = Math.sqrt(volumeWeightedStDev);

  return {
    volume,
    mean: volumeWeightedMean,
    stdDev: volumeWeightedStDev,
    max,
    min,
  };
}

export function getVoxelsPerFrameForSegment(
  labelmap3D,
  images,
  imagePlanes,
  segmentIndex
) {
  const { rowPixelSpacing, columnPixelSpacing } = images[0];
  const labelmaps2D = labelmap3D.labelmaps2D;
  const voxelsPerFrame = [];

  for (let i = 0; i < labelmaps2D.length; i++) {
    const labelmap2D = labelmaps2D[i];

    if (labelmap2D && labelmap2D.segmentsOnLabelmap.includes(segmentIndex)) {
      const sliceThickness = getSliceThickness(images, imagePlanes, i);
      const voxelInMM3 = sliceThickness * rowPixelSpacing * columnPixelSpacing;
      const segmentationPixelData = labelmap2D.pixelData;
      const imagePixelData = images[i].getPixelData();
      const values = [];

      // Iterate over segmentationPixelData and count voxels.
      for (let p = 0; p < segmentationPixelData.length; p++) {
        if (segmentationPixelData[p] === segmentIndex) {
          values.push(imagePixelData[p]);
        }
      }

      voxelsPerFrame.push({
        voxelInMM3,
        values,
      });
    }
  }

  return voxelsPerFrame;
}

export function getSliceThickness(images, imagePlanes, frameIndex) {
  const numberOfSlices = images.length;
  const ipp = imagePlanes[frameIndex].imagePositionPatient;

  // Special cases: Edge of volume - Assume thickness is the distance
  // between the current slice and the closest slice as this is all the information we have.
  if (frameIndex === 0) {
    const ippAbove = imagePlanes[frameIndex + 1].imagePositionPatient;

    return distanceBetweenSlices(ipp, ippAbove);
  } else if (frameIndex === numberOfSlices - 1) {
    const ippBelow = imagePlanes[frameIndex - 1].imagePositionPatient;

    return distanceBetweenSlices(ipp, ippBelow);
  }

  // Estimate slice thickness from the two adjacent slices.
  const ippBelow = imagePlanes[frameIndex - 1].imagePositionPatient;
  const ippAbove = imagePlanes[frameIndex + 1].imagePositionPatient;

  return (
    (distanceBetweenSlices(ipp, ippBelow) +
      distanceBetweenSlices(ipp, ippAbove)) /
    2
  );
}

export function distanceBetweenSlices(ipp1, ipp2) {
  return Math.sqrt(
    Math.pow(ipp1[0] - ipp2[0], 2) +
      Math.pow(ipp1[1] - ipp2[1], 2) +
      Math.pow(ipp1[2] - ipp2[2], 2)
  );
}

export function isPointInImage({ x, y }, rows, cols) {
  return x < cols && x >= 0 && y < rows && y >= 0;
}

export function getSegmentsOnPixelData(pixelData) {
  const segmentSet = new Set(pixelData);
  const iterator = segmentSet.values();

  const segmentsOnLabelmap = [];
  let done = false;

  while (!done) {
    const next = iterator.next();

    done = next.done;

    if (!done) {
      segmentsOnLabelmap.push(next.value);
    }
  }

  return segmentsOnLabelmap;
}

