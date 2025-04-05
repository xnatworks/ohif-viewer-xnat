import React from 'react';
import PropTypes from 'prop-types';
import cornerstoneTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import ColoredCircle from '../common/ColoredCircle';
import ProgressColoredCircle from '../common/ProgressColoredCircle';
import { FormattedValue, SortIcon } from '../../elements';
import {
  getSortIndices,
  refreshViewports,
  ROI_COLOR_TEMPLATES,
  DATA_IMPORT_STATUS,
} from '../../utils';

import '../XNATRoiPanel.styl';

const modules = cornerstoneTools.store.modules;
const globalToolStateManager =
  cornerstoneTools.globalImageIdSpecificToolStateManager;

/**
 * @class LockedCollectionsListItem - Renders metadata for an individual locked
 * ROIContour Collection.
 */
export default class LockedCollectionsListItem extends React.Component {
  static propTypes = {
    collectionId: PropTypes.string.isRequired,
    onUnlockClick: PropTypes.func.isRequired,
    SeriesInstanceUID: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    displaySet: PropTypes.object,
  };

  static defaultProps = {
    displaySet: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { collectionId, SeriesInstanceUID, displaySet } = props;

    this._structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collectionId
    );

    const {
      visible: collectionVisible,
      expanded,
      ROIContourCollection,
      activeColorTemplate,
    } = this._structureSet;
    this._ROIContourArray = ROIContourCollection;

    const contourRoiVisible = {};
    const contourRoiImportStatus = {};
    ROIContourCollection.forEach(roi => {
      contourRoiVisible[roi.uid] = roi.visible;
      contourRoiImportStatus[roi.uid] = roi.importStatus;
    });

    const someRoisNotLoaded = ROIContourCollection.some(roi => {
      return roi.importStatus === DATA_IMPORT_STATUS.NOT_IMPORTED;
    });

    const roiSortingOrder = { ...this._structureSet.roiSortingOrder };
    const sortIndices = getSortIndices(
      this._ROIContourArray,
      'name',
      roiSortingOrder
    );

    const { isSubStack, subStackRoiContours } = this._getOnStackRoiContours();

    this.state = {
      expanded,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      someRoisNotLoaded,
      roiSortingOrder,
      sortIndices,
      activeColorTemplate,
      isSubStack,
      subStackRoiContours,
    };

    this.onToggleExpandClick = this.onToggleExpandClick.bind(this);
    this.onCollectionShowHideClick = this.onCollectionShowHideClick.bind(this);
    this.onShowHideClick = this.onShowHideClick.bind(this);
    this.onLoadRoiClick = this.onLoadRoiClick.bind(this);
    this.onLoadRoiComplete = this.onLoadRoiComplete.bind(this);
    this.onLoadAllRoiClick = this.onLoadAllRoiClick.bind(this);
    this.onSortClick = this.onSortClick.bind(this);
    this.onCollectionColorTemplateChanged = this.onCollectionColorTemplateChanged.bind(
      this
    );

    document.addEventListener(
      'xnatcontourroiextracted',
      this.onLoadRoiComplete
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'xnatcontourroiextracted',
      this.onLoadRoiComplete
    );
  }

  _getOnStackRoiContours() {
    const { displaySet } = this.props;
    const ownRoiUids = this._ROIContourArray.map(roi => roi.uid);
    let isSubStack = false;
    const subStackRoiContours = {};
    if (displaySet && displaySet.isSubStack) {
      isSubStack = displaySet.isSubStack;
      const toolStateManager = globalToolStateManager.saveToolState();
      const keys = Object.keys(toolStateManager);
      const imageIds = displaySet.images.map(image => image._data.url);
      imageIds.forEach(imageId => {
        if (keys.includes(imageId)) {
          const toolData =
            toolStateManager[imageId].FreehandRoi3DTool &&
            toolStateManager[imageId].FreehandRoi3DTool.data;
          if (!toolData) {
            return;
          }
          const allRoiUids = toolData.map(contour => contour.ROIContourUid);
          const roiUids = allRoiUids.filter(roiUid =>
            ownRoiUids.includes(roiUid)
          );
          roiUids.forEach(roiUid => {
            if (!subStackRoiContours[roiUid]) {
              subStackRoiContours[roiUid] = 1;
            } else {
              subStackRoiContours[roiUid] += 1;
            }
          });
        }
      });
    }

    return { isSubStack, subStackRoiContours };
  }

  /**
   * onToggleExpandClick - Callback that toggles the expands/collapses the
   * list of collection metadata.
   *
   * @returns {null}
   */
  onToggleExpandClick() {
    const { expanded } = this.state;

    this._structureSet.expanded = !expanded;
    this.setState({ expanded: !expanded });
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onCollectionShowHideClick() {
    const { collectionVisible } = this.state;

    this._structureSet.visible = !collectionVisible;
    this.setState({ collectionVisible: !collectionVisible });

    refreshViewports();
  }

  /**
   * onCollectionShowHideClick - Toggles the visibility of the collections ROI Contours.
   *
   * @returns {null}
   */
  onShowHideClick(roiId) {
    const { contourRoiVisible } = this.state;

    const contourRoi = this._ROIContourArray.find(roi => roi.uid === roiId);

    if (contourRoi) {
      const visible = contourRoiVisible[roiId];

      contourRoi.visible = contourRoiVisible[roiId] = !visible;
      this.setState({ contourRoiVisible: contourRoiVisible });

      refreshViewports();
    }
  }

  onLoadRoiClick(uid, loadFunc) {
    const { contourRoiImportStatus } = this.state;
    contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
    this.setState({ contourRoiImportStatus });
    loadFunc(uid);
  }

  onLoadRoiComplete(evt) {
    const { structUid, roiUid } = evt.detail;
    const { contourRoiImportStatus } = this.state;

    if (this._structureSet.uid !== structUid) {
      return;
    }

    if (Object.keys(contourRoiImportStatus).includes(roiUid)) {
      contourRoiImportStatus[roiUid] = DATA_IMPORT_STATUS.IMPORTED;
      const someRoisNotLoaded = Object.values(contourRoiImportStatus).some(
        value => value === DATA_IMPORT_STATUS.NOT_IMPORTED
      );
      const { isSubStack, subStackRoiContours } = this._getOnStackRoiContours();
      this.setState({
        contourRoiImportStatus,
        someRoisNotLoaded,
        isSubStack,
        subStackRoiContours,
      });
    }
  }

  onLoadAllRoiClick() {
    const { contourRoiImportStatus } = this.state;

    let updateState = false;
    this._ROIContourArray.forEach(roi => {
      const { uid, loadFunc } = roi;
      if (contourRoiImportStatus[uid] === DATA_IMPORT_STATUS.NOT_IMPORTED) {
        contourRoiImportStatus[uid] = DATA_IMPORT_STATUS.IMPORTING;
        loadFunc(uid);
        updateState = true;
      }
    });

    if (updateState) {
      this.setState({ contourRoiImportStatus });
    }
  }

  onSortClick(columnId, newOrder) {
    const { roiSortingOrder } = this.state;
    const newSortingOrder = { ...roiSortingOrder, [columnId]: newOrder };

    const sortIndices = getSortIndices(
      this._ROIContourArray,
      'name',
      newSortingOrder
    );

    this._structureSet.roiSortingOrder = { ...newSortingOrder };

    this.setState({
      roiSortingOrder: newSortingOrder,
      sortIndices,
    });
  }

  onCollectionColorTemplateChanged(evt) {
    const value = evt.target.value;

    const { collectionId, SeriesInstanceUID } = this.props;

    const structureSet = modules.freehand3D.getters.structureSet(
      SeriesInstanceUID,
      collectionId
    );

    modules.freehand3D.setters.updateStructureSetColorTemplate(
      structureSet,
      value
    );

    this.setState({ activeColorTemplate: value });

    refreshViewports();
  }

  render() {
    const { onUnlockClick, onClick } = this.props;
    const {
      expanded,
      collectionVisible,
      contourRoiVisible,
      contourRoiImportStatus,
      someRoisNotLoaded,
      roiSortingOrder,
      sortIndices,
      activeColorTemplate,
      isSubStack,
      subStackRoiContours,
    } = this.state;

    const { uid: collectionUid, name: collectionName } = this._structureSet;

    const expandStyle = expanded ? {} : { transform: 'rotate(90deg)' };

    const listBody = sortIndices.map(index => {
      const contourRoi = this._ROIContourArray[index];
      const {
        uid,
        color,
        name,
        polygonCount: allPolygonCount,
        importPercent,
        loadFunc,
        stats,
      } = contourRoi;
      const importStatus = contourRoiImportStatus[uid];
      const isLoaded = importStatus === DATA_IMPORT_STATUS.IMPORTED;
      const onStackPolygonCount =
        subStackRoiContours[uid] !== undefined ? subStackRoiContours[uid] : 0;
      let polygonCount = allPolygonCount;
      let polygonCountRep = `${allPolygonCount}`;
      if (isSubStack && allPolygonCount > 0) {
        polygonCountRep = `${onStackPolygonCount}/${allPolygonCount}`;
        polygonCount = onStackPolygonCount;
      }

      let indexComponent = <ColoredCircle color={color} />;
      if (importStatus === DATA_IMPORT_STATUS.NOT_IMPORTED) {
        indexComponent = (
          <button
            className="small"
            onClick={() => this.onLoadRoiClick(uid, loadFunc)}
            title="Load ROI"
          >
            <Icon
              name="xnat-load-roi"
              style={{ width: 18, height: 18, fill: color }}
            />
          </button>
        );
      } else if (importStatus === DATA_IMPORT_STATUS.IMPORTING) {
        indexComponent = (
          <ProgressColoredCircle
            color={color}
            uids={{ structUid: collectionUid, roiUid: uid }}
            percent={importPercent}
          />
        );
      }
      return (
        <tr key={uid}>
          <td className="centered-cell">{indexComponent}</td>
          <td className="left-aligned-cell">
            <div>{name}</div>
            {stats.volumeCm3 !== 0 && (
              <FormattedValue
                prefix={'Volume'}
                value={stats.volumeCm3}
                suffix={stats.units.volumeUnitCm}
                sameLine={true}
              />
            )}
          </td>
          <td className="centered-cell">
            <button
              className="small"
              onClick={() => (polygonCount && isLoaded ? onClick(uid) : null)}
              disabled={!isLoaded}
              title={!isLoaded ? 'ROI not loaded' : ''}
            >
              {polygonCountRep}
            </button>
          </td>
          <td>
            <button
              className="small"
              onClick={() => (isLoaded ? this.onShowHideClick(uid) : null)}
              disabled={!isLoaded}
              title={!isLoaded ? 'ROI not loaded' : ''}
            >
              <Icon name={contourRoiVisible[uid] ? 'eye' : 'eye-closed'} />
            </button>
          </td>
        </tr>
      );
    });

    return (
      <div className="collectionSection">
        <div className={`header${expanded ? ' expanded' : ''}`}>
          <h5>{collectionName}</h5>
          <div className="icons">
            {someRoisNotLoaded ? (
              <Icon
                name="xnat-load-roi"
                className="icon"
                width="20px"
                height="20px"
                onClick={this.onLoadAllRoiClick}
                title="Load All Contour ROIs"
              />
            ) : (
              <Icon
                name="lock"
                className="icon"
                width="20px"
                height="20px"
                onClick={() => {
                  onUnlockClick(collectionUid);
                }}
                title="Unlock ROI Collection"
              />
            )}
            <Icon
              name={collectionVisible ? 'eye' : 'eye-closed'}
              className="icon"
              width="20px"
              height="20px"
              onClick={this.onCollectionShowHideClick}
            />
            <Icon
              name={`angle-double-${expanded ? 'down' : 'up'}`}
              className="icon"
              style={expandStyle}
              width="20px"
              height="20px"
              onClick={this.onToggleExpandClick}
            />
          </div>
        </div>

        {expanded && (
          <>
            <div className="header subHeading">
              <Icon
                name="xnat-colormap"
                width="18px"
                height="18px"
                title="Active Color Template"
              />
              <select
                value={activeColorTemplate}
                onChange={this.onCollectionColorTemplateChanged}
              >
                {Object.keys(ROI_COLOR_TEMPLATES).map(key => {
                  return (
                    <option key={key} value={key}>
                      {key === ROI_COLOR_TEMPLATES.CUSTOM.id
                        ? 'Auto-Generated'
                        : ROI_COLOR_TEMPLATES[key].desc}
                    </option>
                  );
                })}
              </select>
            </div>
            <table className="collectionTable">
              <thead>
                <tr>
                  <th width="5%" className="centered-cell">
                    #
                  </th>
                  <th width="75%" className="left-aligned-cell">
                    ROI Name{' '}
                    <SortIcon
                      size={15}
                      order={roiSortingOrder.name}
                      columnId="name"
                      onClick={this.onSortClick}
                    />
                  </th>
                  <th width="10%" className="centered-cell">
                    N
                  </th>
                  <th width="10%" className="centered-cell" />
                </tr>
              </thead>
              <tbody>{listBody}</tbody>
            </table>
          </>
        )}
      </div>
    );
  }
}
