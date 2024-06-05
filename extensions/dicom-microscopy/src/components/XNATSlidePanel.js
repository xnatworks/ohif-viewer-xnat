import React from 'react';
import PropTypes from 'prop-types';

import XNATSlideSnapshot from './XNATSlideSnapshot';
import XNATOpticalPathList from './XNATOpticalPathList';

export default class XNATSlidePanel extends React.Component {
  static propTypes = {
    isOpen: PropTypes.any,
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    activeViewport: PropTypes.any,
    activeTool: PropTypes.string,
    apiUID: PropTypes.string,
  };

  static defaultProps = {
    isOpen: undefined,
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    activeViewport: undefined,
    activeTool: '',
    apiUID: null,
  };

  constructor(props = {}) {
    super(props);

    const { displaySetInstanceUID } = props.activeViewport;

    this.state = {
      displaySetInstanceUID,
      isMicroscopyViewport: false,
      slideLabelImageId: undefined,
    };
  }

  updateContent() {
    const viewportData = this.props.activeViewport;
    const { plugin, microscopyInstances, displaySetInstanceUID } = viewportData;

    if (plugin !== 'microscopy') {
      this.setState({ isMicroscopyViewport: false });
      return;
    }

    let slideLabelImageId;
    if (microscopyInstances.label.length) {
      slideLabelImageId = microscopyInstances.label[0].imageId;
    }

    this.setState({
      displaySetInstanceUID,
      isMicroscopyViewport: true,
      slideLabelImageId,
    });
  }

  componentDidMount() {
    this.updateContent();
  }

  componentDidUpdate(prevProps) {
    const { displaySetInstanceUID: prevDisplaySetInstanceUID } = this.state;
    const { displaySetInstanceUID } = this.props.activeViewport;

    if (displaySetInstanceUID !== prevDisplaySetInstanceUID) {
      this.updateContent();
    }
  }

  render() {
    const { apiUID } = this.props.activeViewport;
    const {
      isMicroscopyViewport,
      slideLabelImageId,
      displaySetInstanceUID,
    } = this.state;

    if (!isMicroscopyViewport) {
      return <div />;
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <div className="title-with-icon">
            <h3>Slide Info</h3>
          </div>
        </div>
        <div className="roiCollectionBody">
          {slideLabelImageId && (
            <XNATSlideSnapshot
              label="Slide Label"
              imageId={slideLabelImageId}
            />
          )}
          {apiUID && (
            <XNATOpticalPathList
              apiUID={apiUID}
            />
          )}
        </div>
      </div>
    );
  }
}
