const getDicomMicroscopyApi = async () => {
  let api = window.dicomMicroscopyViewer;
  if (api === undefined) {
    console.info('Loading the dicomMicroscopyViewer module...');
    await import(
      /* webpackIgnore: true */
      `${process.env.PUBLIC_URL}dicom-microscopy-viewer/dicomMicroscopyViewer.min.js`
    );
    api = window.dicomMicroscopyViewer;
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
