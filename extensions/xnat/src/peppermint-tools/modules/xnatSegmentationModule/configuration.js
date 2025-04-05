let configuration;
const additionalConfig = {};

export function updateConfig(module) {
  configuration = module.configuration = {
    ...module.configuration,
    ...additionalConfig,
  };
}

export function getConfig() {
  return configuration;
}
