import { xnatMeasurementApi } from '../api';
import refreshViewports from '../../utils/refreshViewports';
import { getSeriesAttributes } from './index';

const toggleItemVisibility = (
  uuid,
  _displaySetInstanceUID,
  importedCollectionUuid = undefined
) => {
  const seriesAttributes = getSeriesAttributes(_displaySetInstanceUID);
  const collections = xnatMeasurementApi.getMeasurementCollections(
    seriesAttributes
  );

  let collection;
  if (importedCollectionUuid) {
    collection = collections.importedCollections.find(
      collectionI => collectionI.metadata.uuid === importedCollectionUuid
    );
  } else {
    collection = collections.workingCollection;
  }

  const collectionVisible = collection.internal.visible;
  const measurement = collection.getMeasurement(uuid);
  measurement.metadata.visible = !measurement.metadata.visible;

  measurement.csData.visible =
    collectionVisible && measurement.metadata.visible;

  refreshViewports();
};

const toggleCollectionVisibility = (
  _displaySetInstanceUID,
  importedCollectionUuid = undefined
) => {
  const seriesAttributes = getSeriesAttributes(_displaySetInstanceUID);
  const collections = xnatMeasurementApi.getMeasurementCollections(
    seriesAttributes
  );

  let collection;
  if (importedCollectionUuid) {
    collection = collections.importedCollections.find(
      collectionI => collectionI.metadata.uuid === importedCollectionUuid
    );
  } else {
    collection = collections.workingCollection;
  }

  collection.internal.visible = !collection.internal.visible;
  collection.measurements.forEach(measurement => {
    measurement.csData.visible =
      collection.internal.visible && measurement.metadata.visible;
  });

  refreshViewports();
};

const toggleVisibility = {
  item: toggleItemVisibility,
  collection: toggleCollectionVisibility,
};

export default toggleVisibility;
