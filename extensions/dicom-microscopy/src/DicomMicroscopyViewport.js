import React, { Component } from 'react';
import ReactResizeDetector from 'react-resize-detector';
import debounce from 'lodash.debounce';

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
  async installOpenLayersRenderer(container, displaySet) {
    const dicomWebClient = displaySet.dicomWebClient;
    const srcMetadata = displaySet.instancesMetadata;

    /*
    const volumeMetadata = metadata.filter(
      instance => instance['00080008'].Value[2] === 'VOLUME'
    );
    const overviewMetadata = metadata.filter(
      instance => instance['00080008'].Value[2] === 'OVERVIEW'
    );
    const labelMetadata = metadata.filter(
      instance => instance['00080008'].Value[2] === 'LABEL'
    );
    */

    const api = await import(
      /* webpackChunkName: "dicom-microscopy-viewer" */
      'dicom-microscopy-viewer'
    );

    const volumeImages = [];
    const labelImages = [];
    const overviewImages = [];
    srcMetadata.forEach(metadata => {
      const image = new api.metadata.VLWholeSlideMicroscopyImage({ metadata });
      const imageSubtype = image.ImageType[2];
      switch (imageSubtype) {
        case 'VOLUME':
        case 'THUMBNAIL':
          volumeImages.push(image);
          break;
        case 'OVERVIEW':
          overviewImages.push(image);
          break;
        case 'LABEL':
          labelImages.push(image);
          break;
      }
    });

    try {
      this.viewer = new api.viewer.VolumeImageViewer({
        client: dicomWebClient,
        metadata: volumeImages,
        controls: ['fullscreen', 'overview', 'position', 'zoom'],
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

    this.viewer.render({ container });
  }

  async componentDidMount() {
    const { displaySet } = this.props.viewportData;

    await this.installOpenLayersRenderer(this.container.current, displaySet);
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
