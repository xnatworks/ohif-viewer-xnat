import RetrieveMetadataLoaderSync from './retrieveMetadataLoaderSync';
import RetrieveMetadataLoaderAsync from './retrieveMetadataLoaderAsync';

/**
 * Retrieve Study metadata from a DICOM server. If the server is configured to use lazy load, only the first series
 * will be loaded and the property "studyLoader" will be set to let consumer load remaining series as needed.
 *
 * @param {Object} server Object with server configuration parameters
 * @param {string} StudyInstanceUID The Study Instance UID of the study which needs to be loaded
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @returns {Object} A study descriptor object
 */
async function RetrieveMetadata(server, StudyInstanceUID, filters = {}) {
  const RetrieveMetadataLoader =
    server.enableStudyLazyLoad != false
      ? RetrieveMetadataLoaderAsync
      : RetrieveMetadataLoaderSync;

  const retrieveMetadataLoader = new RetrieveMetadataLoader(
    server,
    StudyInstanceUID,
    filters
  );
  const studyMetadata = retrieveMetadataLoader.execLoad();

  return studyMetadata;
}

async function RetrieveMetadataFromXnat(
  server,
  StudyInstanceUID,
  filters = {}
) {
  const RetrieveMetadataLoader =
    server.enableStudyLazyLoad != false
      ? RetrieveMetadataLoaderAsync
      : RetrieveMetadataLoaderSync;

  const rml = new RetrieveMetadataLoader(server, StudyInstanceUID, filters);

  await rml.configLoad();
  const preLoadData = await rml.preLoad();
  const loadData = await rml.load(preLoadData);

  if (process.env.NODE_ENV === 'development') {
    reassignUrlsToProxy(loadData);
  }

  const studyMetadata = await rml.posLoad(loadData);
  studyMetadata.instancesMetadata = loadData;

  return studyMetadata;
}

const reassignUrlsToProxy = loadData => {
  const host = process.env.XNAT_DOMAIN + '/';
  const proxy = process.env.XNAT_PROXY;
  loadData.forEach(elements => {
    doUrlReassignment(elements, host, proxy);
  });
};

const doUrlReassignment = (elements, host, proxy) => {
  Object.keys(elements).forEach(tag => {
    if ('BulkDataURI' in elements[tag]) {
      const bulkdataUri = elements[tag]['BulkDataURI'];
      elements[tag]['BulkDataURI'] = bulkdataUri.replace(host, proxy);
    } else if ('Value' in elements[tag] && elements[tag].vr === 'SQ') {
      const value = elements[tag].Value;
      value.forEach(item => {
        doUrlReassignment(item, host, proxy);
      });
    }
  });
};

export default RetrieveMetadata;

export { RetrieveMetadata, RetrieveMetadataFromXnat };
