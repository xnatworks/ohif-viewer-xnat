import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';

import { getActiveLabelmapIndex } from './getters';

export default function triggerLabelmapModifiedEvent(element, labelmapIndex) {
  labelmapIndex =
    labelmapIndex === undefined
      ? getActiveLabelmapIndex(element)
      : labelmapIndex;

  cornerstone.triggerEvent(element, csTools.EVENTS.LABELMAP_MODIFIED, {
    labelmapIndex,
  });
}
