import { updateState } from './state';
import { updateConfig } from './configuration';
import { getSegmentsOnPixelData, getFirstImageId } from './utils';
import {
  getMetadata,
  getLabelmap3D,
  getLabelmaps3D,
  getActiveLabelmapIndex,
  getActiveSegmentIndex,
  isSegmentVisible,
  getLabelmap2D,
  getLabelmap2DByImageIdIndex,
  getLabelmapStats,
  getSegmentOfActiveLabelmapAtEvent,
  getBrushColor,
  getLabelmapBuffers,
  getActiveLabelmapBuffer,
} from './getters';
import {
  setMetadata,
  setLabelmap3DForElement,
  setLabelmap3DByFirstImageId,
  incrementActiveSegmentIndex,
  decrementActiveSegmentIndex,
  setActiveSegmentIndex,
  toggleSegmentVisibility,
  deleteSegment,
  setActiveLabelmapIndex,
  setRadius,
  pushState,
  undo,
  redo,
} from './setters';

export default function applyXnatSegmentationModule(module) {
  const { getters, setters } = module;
  updateState(module);
  updateConfig(module);

  getters.metadata = getMetadata;
  getters.labelmap3D = getLabelmap3D;
  getters.labelmaps3D = getLabelmaps3D;
  getters.activeLabelmapIndex = getActiveLabelmapIndex;
  getters.activeSegmentIndex = getActiveSegmentIndex;
  getters.isSegmentVisible = isSegmentVisible;
  getters.labelmap2D = getLabelmap2D;
  getters.labelmap2DByImageIdIndex = getLabelmap2DByImageIdIndex;
  getters.labelmapStats = getLabelmapStats;
  getters.segmentOfActiveLabelmapAtEvent = getSegmentOfActiveLabelmapAtEvent;
  getters.brushColor = getBrushColor;
  getters.labelmapBuffers = getLabelmapBuffers;
  getters.activeLabelmapBuffer = getActiveLabelmapBuffer;
  // getters.colorLUT = getColorLUT;
  // getters.colorForSegmentIndexColorLUT = getColorForSegmentIndexColorLUT;

  setters.metadata = setMetadata;
  setters.labelmap3DForElement = setLabelmap3DForElement;
  setters.labelmap3DByFirstImageId = setLabelmap3DByFirstImageId;
  // setters.fractionalLabelmap3DByFirstImageId = setFractionalLabelmap3DByFirstImageId;
  setters.incrementActiveSegmentIndex = incrementActiveSegmentIndex;
  setters.decrementActiveSegmentIndex = decrementActiveSegmentIndex;
  setters.activeSegmentIndex = setActiveSegmentIndex;
  setters.toggleSegmentVisibility = toggleSegmentVisibility;
  setters.updateSegmentsOnLabelmap2D = labelmap2D => {
    labelmap2D.segmentsOnLabelmap = getSegmentsOnPixelData(
      labelmap2D.pixelData
    );
  };
  setters.deleteSegment = deleteSegment;
  // setters.colorLUT = setColorLUT;
  // setters.colorLUTIndexForLabelmap3D = setColorLUTIndexForLabelmap3D;
  // setters.colorForSegmentIndexOfColorLUT = setColorForSegmentIndexOfColorLUT;
  setters.activeLabelmapIndex = setActiveLabelmapIndex;
  setters.radius = setRadius;
  setters.pushState = pushState;
  setters.undo = undo;
  setters.redo = redo;
}

export { getFirstImageId };
