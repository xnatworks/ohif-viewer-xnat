const viewportState = {
  enabledElements: {},
  activeViewportIndex: -1,
  apis: new Map(),
};

/**
 * Sets the enabled element `dom` reference for an active viewport.
 * @param {HTMLElement} dom Active viewport element.
 * @return void
 */
const setEnabledElement = (viewportIndex, element) =>
  (viewportState.enabledElements[viewportIndex] = element);

/**
 * Grabs the enabled element `dom` reference of an active viewport.
 *
 * @return {HTMLElement} Active viewport element.
 */
const getEnabledElement = viewportIndex =>
  viewportState.enabledElements[viewportIndex];

const setActiveViewportIndex = viewportIndex => {
  viewportState.activeViewportIndex = viewportIndex;
};

const getActiveViewportIndex = () => viewportState.activeViewportIndex;

export {
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
};

const setApi = (apiUID, api) => viewportState.apis.set(apiUID, api);

const getApi = apiUID => viewportState.apis.get(apiUID);

const removeApi = apiUId => viewportState.apis.delete(apiUId);

export { setApi, getApi, removeApi };

/**
 * Windowing state
 */
const windowingState = new Map();

const setWindowing = (enabledElementUuid, type) => {
  windowingState.set(enabledElementUuid, type);
};

const getWindowing = enabledElementUuid => {
  return windowingState.get(enabledElementUuid);
};

export { setWindowing, getWindowing };

const state = {
  // Elements state
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
  // API state (currently used only for the microscopy plugin)
  setApi,
  getApi,
  removeApi,
  // Windowing state
  setWindowing,
  getWindowing,
};

export default state;
