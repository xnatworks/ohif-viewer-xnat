import React from 'react';
import PropTypes from 'prop-types';
import LockedCollectionsListItem from './LockedCollectionsListItem.js';

import '../XNATRoiPanel.styl';
import { getDisplaySetFromStudyInstanceUid } from '../../utils';

/**
 * @class LockedCollectionsList - Renders a list of LockedCollectionsListItems,
 * displaying metadata of locked ROIContour Collections.
 */
export default class LockedCollectionsList extends React.Component {
  static propTypes = {
    lockedCollectionIds: PropTypes.array,
    onUnlockClick: PropTypes.func,
    SeriesInstanceUID: PropTypes.string,
    onContourClick: PropTypes.func,
    viewportData: PropTypes.object,
  };

  static defaultProps = {
    lockedCollectionIds: undefined,
    onUnlockClick: undefined,
    SeriesInstanceUID: undefined,
    onContourClick: undefined,
    viewportData: undefined,
  };

  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      lockedCollectionIds,
      onUnlockClick,
      SeriesInstanceUID,
      onContourClick,
      viewportData,
    } = this.props;

    const displaySet = getDisplaySetFromStudyInstanceUid(viewportData);

    return (
      <React.Fragment>
        {lockedCollectionIds.map(collectionId => (
          <LockedCollectionsListItem
            key={collectionId}
            collectionId={collectionId}
            onUnlockClick={onUnlockClick}
            SeriesInstanceUID={SeriesInstanceUID}
            onClick={onContourClick}
            displaySet={displaySet}
          />
        ))}
      </React.Fragment>
    );
  }
}
