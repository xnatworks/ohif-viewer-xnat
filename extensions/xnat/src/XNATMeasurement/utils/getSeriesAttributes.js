import cornerstone from 'cornerstone-core';
import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const seriesAttributesMap = new Map();

const getSeriesAttributes = displaySetInstanceUID => {
  let seriesAttributes = seriesAttributesMap.get(displaySetInstanceUID);
  if (seriesAttributes) {
    return seriesAttributes;
  }

  let imageId = undefined;
  let imageIds = [];
  let actualDisplaySetInstanceUID = displaySetInstanceUID;

  const studies = studyMetadataManager.all();
  for (let i = 0; i < studies.length; i++) {
    const study = studies[i];
    const displaySets = study.getDisplaySets();

    for (let j = 0; j < displaySets.length; j++) {
      const displaySet = displaySets[j];

      if (displaySet.images === undefined) {
        continue;
      }

      if (displaySet.displaySetInstanceUID === displaySetInstanceUID) {
        const numberOfFrames = displaySet.numImageFrames;
        if (displaySet.isSubStack) {
          const refDisplaySet = displaySet.refDisplaySet;
          imageId = _getRootImageId(refDisplaySet.images[0]._data.url);
          actualDisplaySetInstanceUID = refDisplaySet.displaySetInstanceUID;
          const images = displaySet.images;
          for (let i = 0; i < numberOfFrames; i++) {
            imageIds.push(images[i]._data.url);
          }
        } else {
          imageId = _getRootImageId(displaySet.images[0]._data.url);
          if (displaySet.isMultiFrame) {
            for (let i = 0; i < numberOfFrames; i++) {
              imageIds.push(`${imageId}?frame=${i}`);
            }
          } else {
            const images = displaySet.images;
            for (let i = 0; i < numberOfFrames; i++) {
              imageIds.push(images[i]._data.url);
            }
          }
        }
        break;
      }
    }

    if (imageId) {
      break;
    }
  }

  if (imageId) {
    const {
      PatientID,
      PatientName,
      PatientBirthDate = '',
      StudyInstanceUID,
      SeriesInstanceUID,
      Modality,
      SeriesNumber,
    } = cornerstone.metaData.get('instance', imageId);

    seriesAttributes = {
      PatientID,
      PatientName,
      PatientBirthDate,
      StudyInstanceUID,
      SeriesInstanceUID,
      Modality,
      SeriesNumber,
      displaySetInstanceUID: actualDisplaySetInstanceUID,
      imageIds,
    };
  }

  seriesAttributesMap.set(displaySetInstanceUID, seriesAttributes);

  return seriesAttributes;
};

const _getRootImageId = imageId => {
  const splitImageId = imageId.split('?frame=');
  return splitImageId[0];
};

export default getSeriesAttributes;
