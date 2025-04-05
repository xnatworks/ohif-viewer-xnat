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
  setDisplaySetFromImageIds,
  getDisplaySetFromImageIds,
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
  setDisplaySetFromImageIds,
  getDisplaySetFromImageIds,
};
