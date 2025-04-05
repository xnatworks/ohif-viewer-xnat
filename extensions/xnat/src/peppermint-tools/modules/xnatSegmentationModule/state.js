let state;
const additionalState = {};

export function updateState(module) {
  state = module.state = {
    ...module.state,
    ...additionalState,
  };
}

export function getState() {
  return state;
}
