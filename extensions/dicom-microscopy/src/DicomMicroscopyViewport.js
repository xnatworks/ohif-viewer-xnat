import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash.debounce';
import OHIF from '@ohif/core';

import './ol.css';

const { dynamicLoaders, utils, state } = OHIF;
const { guid } = utils;
const { setApi, removeApi } = state;

class DicomMicroscopyViewport extends Component {
  state = {
    error: null,
  };

  volumeViewer = null;
  api = null;
  apiUID = null;

  constructor(props) {
    super(props);

    this.volumeViewportContainer = React.createRef();

    this.debouncedResize = debounce(() => {
      if (this.volumeViewer) this.volumeViewer.resize();
    }, 100);

    this.preInteractionEventHandler = this.preInteractionEventHandler.bind(
      this
    );
  }

  addEventListeners() {
    this.removeEventListeners();

    if (this.volumeViewportContainer && this.volumeViewportContainer.current) {
      this.volumeViewportContainer.current.addEventListener(
        'mousedown',
        this.preInteractionEventHandler
      );
      this.volumeViewportContainer.current.addEventListener(
        'click',
        this.preInteractionEventHandler
      );
      this.volumeViewportContainer.current.addEventListener(
        'wheel',
        this.preInteractionEventHandler
      );
    }
  }

  removeEventListeners() {
    if (this.volumeViewportContainer && this.volumeViewportContainer.current) {
      this.volumeViewportContainer.current.removeEventListener(
        'mousedown',
        this.preInteractionEventHandler
      );
      this.volumeViewportContainer.current.removeEventListener(
        'click',
        this.preInteractionEventHandler
      );
      this.volumeViewportContainer.current.removeEventListener(
        'wheel',
        this.preInteractionEventHandler
      );
    }
  }

  preInteractionEventHandler(event) {
    this.props.setViewportActive();
  }

  displayErrorOrWarningMessage(error, warning) {
    if (error) {
      console.error('[Microscopy Viewer] Failed to load:', error);
    }
    const {
      UINotificationService,
      LoggerService,
    } = this.props.servicesManager.services;
    if (UINotificationService) {
      if (error) {
        const errorMessage = error.message || 'Unknown error!';
        const message = `Microscopy Viewer failed to load: ${errorMessage}`;
        LoggerService.error({ error, message });
        UINotificationService.show({
          autoClose: false,
          title: 'Microscopy Viewport',
          message,
          type: 'error',
        });
      } else if (warning) {
        UINotificationService.show({
          autoClose: false,
          title: 'Microscopy Viewport',
          message: warning,
          type: 'warning',
        });
      }
    }
  }

  async loadDicomMicroscopyViewerModule() {
    this.api = await dynamicLoaders.getDicomMicroscopyApi();
  }

  updateMicroscopyViewport(displaySet) {
    const { dicomWebClient, microscopyInstances } = displaySet;

    const api = this.api;

    try {
      const metadata = [
        ...microscopyInstances.volume,
        ...microscopyInstances.thumbnail,
      ].map(instance => {
        return instance.srcMetadata;
      });

      // Initiate Viewer
      this.volumeViewer = new api.viewer.VolumeImageViewer({
        client: dicomWebClient,
        metadata,
        controls: ['fullscreen', 'overview', 'position'], //'zoom'
      });

      if (this.volumeViewer.totalFocalPlanes > 1) {
        if (this.volumeViewer.hasExtendedDepthOfField) {
          this.displayErrorOrWarningMessage(
            null,
            'Multiple focal planes is not fully supported. ' +
              'Only the extended-depth-of-field image is available!'
          );
        } else {
          this.displayErrorOrWarningMessage(
            null,
            'Multiple focal planes is not fully supported. ' +
              'Trying to display the first focal plane.'
          );
        }
      }

      this.volumeViewer.render({
        container: this.volumeViewportContainer.current,
      });

      this.apiUID = guid();
      setApi(this.apiUID, this.volumeViewer);
      this.props.setViewportSpecificData({ apiUID: this.apiUID });
    } catch (error) {
      this.displayErrorOrWarningMessage(error, null);
    }
  }

  cleanup() {
    if (this.volumeViewer) {
      this.volumeViewer.cleanup();
    }
    if (this.apiUID) {
      removeApi(this.apiUID);
      this.apiUID = null;
    }
  }

  async componentDidMount() {
    const displaySet = this.props.getViewportSpecificData();

    try {
      await this.loadDicomMicroscopyViewerModule();
    } catch (error) {
      this.displayErrorOrWarningMessage(error, null);
    }
    this.updateMicroscopyViewport(displaySet);

    this.props.onElementEnabled(this.volumeViewportContainer.current);
    this.addEventListeners();
  }

  componentWillUnmount() {
    this.cleanup();

    this.removeEventListeners();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const displaySet = this.props.getViewportSpecificData();
    const prevDisplaySet = prevProps.getViewportSpecificData();

    if (
      displaySet.displaySetInstanceUID !== prevDisplaySet.displaySetInstanceUID
    ) {
      if (!this.api) {
        this.displayErrorOrWarningMessage(
          new Error('Error loading the dicomMicroscopyViewer module.'),
          null
        );
        return;
      }
      if (this.volumeViewportContainer.current) {
        this.volumeViewportContainer.current.innerHTML = '';
      }
      this.cleanup();
      this.updateMicroscopyViewport(displaySet);
    }
  }

  render() {
    const style = { width: '100%', height: '100%' };
    return (
      <div className={'DicomMicroscopyViewer'} style={style}>
        {ReactResizeDetector && (
          <ReactResizeDetector
            handleWidth
            handleHeight
            onResize={this.onWindowResize}
          />
        )}
        {this.state.error ? (
          <h2>{JSON.stringify(this.state.error)}</h2>
        ) : (
          <div style={style} ref={this.volumeViewportContainer} />
        )}
      </div>
    );
  }

  onWindowResize = () => {
    this.debouncedResize();
  };
}

export default DicomMicroscopyViewport;
