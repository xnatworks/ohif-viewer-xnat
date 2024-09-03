let dicomMicroscopyViewer;

const getDicomMicroscopyApi = async () => {
  let api = dicomMicroscopyViewer;
  if (api === undefined) {
    console.info('Loading the dicomMicroscopyViewer module...');
    dicomMicroscopyViewer = await import(
      /* webpackChunkName: "dicom-microscopy-viewer" */
      'dicom-microscopy-viewer'
    );
    api = dicomMicroscopyViewer;
  }

  if (!api || !api.metadata) {
    throw new Error('Error loading the dicomMicroscopyViewer module.');
  }

  return api;
};

const dynamicLoaders = {
  getDicomMicroscopyApi,
};

export default dynamicLoaders;
