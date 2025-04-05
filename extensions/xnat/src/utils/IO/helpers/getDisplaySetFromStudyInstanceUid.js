import { utils } from '@ohif/core';

const { studyMetadataManager } = utils;

const getDisplaySet = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  const studies = studyMetadataManager.all();
  const studyMetadata = studies.find(
    study =>
      study.getStudyInstanceUID() === StudyInstanceUID &&
      study.displaySets.some(
        ds => ds.displaySetInstanceUID === displaySetInstanceUID
      )
  );

  if (!studyMetadata) {
    return;
  }

  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );

  return displaySet;
};

export default getDisplaySet;
