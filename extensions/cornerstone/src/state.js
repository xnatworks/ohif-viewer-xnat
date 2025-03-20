import OHIF from '@ohif/core';

const { state } = OHIF;

const {
  // Elements state
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
  // Windowing state
  setWindowing,
  getWindowing,
  setDisplaySetForFirstImageId,
  getDisplaySetForFirstImageId,
} = state;

export {
  // Elements state
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
  // Windowing state
  setWindowing,
  getWindowing,
  setDisplaySetForFirstImageId,
  getDisplaySetForFirstImageId,
};
