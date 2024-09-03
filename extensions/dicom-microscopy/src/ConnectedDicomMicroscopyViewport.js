import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import DicomMicroscopyViewport from './DicomMicroscopyViewport';

const {
  setViewportActive,
  setViewportSpecificData,
  setActiveViewportSpecificData,
} = OHIF.redux.actions;
const {
  setEnabledElement,
  getEnabledElement,
  setActiveViewportIndex,
  getActiveViewportIndex,
} = OHIF.state;

const mapStateToProps = (state, ownProps) => {
  const { viewportIndex } = ownProps;

  const isActive = viewportIndex === state.viewports.activeViewportIndex;
  if (isActive) {
    setActiveViewportIndex(viewportIndex);
  }

  const viewportSpecificData =
    state.viewports.viewportSpecificData[viewportIndex] || {};

  const getViewportSpecificData = () => {
    return viewportSpecificData;
  };

  return {
    isActive,
    getViewportSpecificData,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { viewportIndex } = ownProps;

  return {
    setViewportActive: () => {
      if (viewportIndex !== getActiveViewportIndex()) {
        dispatch(setViewportActive(viewportIndex));
      }
    },

    setViewportSpecificData: data => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },

    setActiveViewportSpecificData: data => {
      dispatch(setActiveViewportSpecificData(data));
    },

    onElementEnabled: element => {
      setEnabledElement(viewportIndex, element);
      dispatch(
        setViewportSpecificData(viewportIndex, {
          plugin: 'microscopy',
        })
      );
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
  };
};

const ConnectedDicomMicroscopyViewport = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(DicomMicroscopyViewport);

export default ConnectedDicomMicroscopyViewport;
