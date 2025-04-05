import cornerstone from 'cornerstone-core';
import { getFirstImageId } from '../peppermint-tools';

export default function getSeriesInstanceUidFromEnabledElement(enabledElement) {
  if (!enabledElement) {
    return;
  }

  const firstImageIdData = getFirstImageId(enabledElement);
  if (!firstImageIdData) {
    return;
  }

  // const imageId = enabledElement.image.imageId;
  const generalSeriesModule = cornerstone.metaData.get(
    'generalSeriesModule',
    firstImageIdData.firstImageId
  );

  return generalSeriesModule.seriesInstanceUID;
}
