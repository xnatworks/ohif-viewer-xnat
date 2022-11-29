import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash.debounce';
// import * as DICOMMicroscopyViewer from 'dicom-microscopy-viewer';

import './ol.css';

class DicomMicroscopyViewport extends Component {
  state = {
    error: null,
  };

  viewer = null;

  constructor(props) {
    super(props);

    this.container = React.createRef();

    this.debouncedResize = debounce(() => {
      if (this.viewer) this.viewer.resize();
    }, 100);
  }

  // install the microscopy renderer into the web page.
  // you should only do this once.
  installOpenLayersRenderer(container, displaySet) {
    const client = displaySet.dicomWebClient;

    // Retrieve metadata of a series of DICOM VL Whole Slide Microscopy Image instances
    const retrieveOptions = {
      studyInstanceUID: displaySet.StudyInstanceUID,
      seriesInstanceUID: displaySet.SeriesInstanceUID,
    };

    client.retrieveSeriesMetadata(retrieveOptions).then(async metadata => {
      const { viewer, metadata: instance } = await import(
        /* webpackChunkName: "dicom-microscopy-viewer" */
        'dicom-microscopy-viewer'
      );
      // const { viewer, metadata: instance } = DICOMMicroscopyViewer;

      // Parse, format, and filter metadata
      const volumeImages = [];
      metadata.forEach(m => {
        const image = new instance.VLWholeSlideMicroscopyImage({
          metadata: m,
        });
        const imageFlavor = image.ImageType[2];
        if (imageFlavor === 'VOLUME' || imageFlavor === 'THUMBNAIL') { //
        // if (imageFlavor === 'OVERVIEW') {
          volumeImages.push(image);
        }
      });

      try {
        // Construct viewer instance
        this.viewer = new viewer.VolumeImageViewer({
          client,
          metadata: volumeImages,
          controls: ['fullscreen', 'overview', 'position', 'zoom'], //
        });
      } catch (error) {
        console.error('[Microscopy Viewer] Failed to load:', error);
        const {
          UINotificationService,
          LoggerService,
        } = this.props.servicesManager.services;
        if (UINotificationService) {
          const message =
            'Failed to load viewport. Please check that you have hardware acceleration enabled.';
          LoggerService.error({ error, message });
          UINotificationService.show({
            autoClose: false,
            title: 'Microscopy Viewport',
            message,
            type: 'error',
          });
        }
      }

      // Render viewer instance in the "viewport" HTML element
      this.viewer.render({ container });
    });
  }

  componentDidMount() {
    const { displaySet } = this.props.viewportData;

    this.installOpenLayersRenderer(this.container.current, displaySet);
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
          <div style={style} ref={this.container} />
        )}
      </div>
    );
  }

  onWindowResize = () => {
    this.debouncedResize();
  };
}

export default DicomMicroscopyViewport;
