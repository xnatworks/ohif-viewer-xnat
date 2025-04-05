import cornerstone from 'cornerstone-core';
import { getToolState } from 'cornerstone-tools';
import { getFirstImageId } from '../peppermint-tools';

export default function getElementFromFirstImageId(firstImageId) {
  const enabledElements = cornerstone.getEnabledElements();

  for (let i = 0; i < enabledElements.length; i++) {
    const enabledElement = enabledElements[i];
    const { element } = enabledElement;
    const { firstImageId: firstImageIdOfEnabledElement } = getFirstImageId(
      element
    );

    if (firstImageIdOfEnabledElement === firstImageId) {
      return element;
    }
  }
}
