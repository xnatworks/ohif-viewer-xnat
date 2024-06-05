import OHIF from '@ohif/core';

const { utils } = OHIF;

const SOP_CLASS_UIDS = {
  VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE: '1.2.840.10008.5.1.4.1.1.77.1.6',
};

const DicomMicroscopySopClassHandler = {
  id: 'DicomMicroscopySopClassHandlerPlugin',
  sopClassUIDs: [SOP_CLASS_UIDS.VL_WHOLE_SLIDE_MICROSCOPY_IMAGE_STORAGE],
  getDisplaySetFromSeries(series, study, dicomWebClient) {
    const instance = series.getFirstInstance();

    const metadata = instance.getData().metadata;
    const {
      SeriesDescription: rawDescription,
      SeriesNumber,
      ContentDate,
      ContentTime,
    } = metadata;

    let SeriesDescription = rawDescription;
    if (metadata.hasOwnProperty('ContainerIdentifier')) {
      SeriesDescription = SeriesDescription
        ? `${SeriesDescription} - ${metadata.ContainerIdentifier}`
        : metadata.ContainerIdentifier;
    }

    const microscopyInstances = {
      volume: [],
      thumbnail: [],
      overview: [],
      label: [],
    };
    series._instances.forEach(instance => {
      const microscopyInstance = extractMicroscopyInstance(instance);
      const imageType = microscopyInstance.metadata.ImageType;
      const imageSubtype = imageType[2];
      switch (imageSubtype) {
        case 'VOLUME':
          microscopyInstances.volume.push(microscopyInstance);
          break;
        case 'THUMBNAIL':
          microscopyInstances.thumbnail.push(microscopyInstance);
          break;
        case 'OVERVIEW':
          microscopyInstances.overview.push(microscopyInstance);
          break;
        case 'LABEL':
          microscopyInstances.label.push(microscopyInstance);
          break;
      }
    });

    let thumbnailImageId;
    if (microscopyInstances.thumbnail.length) {
      thumbnailImageId = microscopyInstances.thumbnail[0].imageId;
    } else if (microscopyInstances.overview.length) {
      thumbnailImageId = microscopyInstances.overview[0].imageId;
    } else if (microscopyInstances.label.length) {
      thumbnailImageId = microscopyInstances.label[0].imageId;
    }

    return {
      plugin: 'microscopy',
      Modality: 'SM',
      displaySetInstanceUID: utils.guid(),
      dicomWebClient,
      SOPInstanceUID: instance.getSOPInstanceUID(),
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      SeriesDescription,
      SeriesDate: ContentDate, // Map ContentDate/Time to SeriesTime for series list sorting.
      SeriesTime: ContentTime,
      SeriesNumber,
      metadata,
      microscopyInstances,
      thumbnailImageId,
      isThumbnailViewEnabled: true,
    };
  },
};

const extractMicroscopyInstance = instance => {
  const instanceData = instance._data;
  const metadata = instanceData.metadata;
  const srcMetadata = instanceData.srcMetadata;
  const imageId = instance.getImageId();

  return {
    metadata,
    srcMetadata,
    imageId,
  };
};

export default DicomMicroscopySopClassHandler;
