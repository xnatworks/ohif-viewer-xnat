// DICOMWeb instance, study, and metadata retrieval
import Instances from './qido/instances.js';
import Studies from './qido/studies.js';
import {
  RetrieveMetadata,
  RetrieveMetadataFromXnat,
} from './wado/retrieveMetadata.js';

const WADO = {
  RetrieveMetadata,
  RetrieveMetadataFromXnat,
};

const QIDO = {
  Studies,
  Instances,
};

export { QIDO, WADO };
