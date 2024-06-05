import React, { useState, memo, createRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
// import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import { utils } from '@ohif/core';

const XNATSlideSnapshot = ({ label, imageId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [details, setDetails] = useState('');
  const [image, setImage] = useState({});
  const canvasRef = createRef();

  const expandStyle = isExpanded ? {} : { transform: 'rotate(90deg)' };

  let loadingOrError = null;
  let cancelablePromise;

  if (error) {
    loadingOrError = <ViewportErrorIndicator details={details} />;
  } else if (isLoading) {
    loadingOrError = <div className="image-thumbnail-loading-indicator" />;
  }

  const fetchImagePromise = useCallback(() => {
    if (!cancelablePromise) {
      return;
    }

    setLoading(true);
    setImage({});
    cancelablePromise
      .then(response => {
        setImage(response);
      })
      .catch(error => {
        if (error.isCanceled) return;
        setLoading(false);
        setError(true);
        if (error && error.error && error.error.message) {
          setDetails(error.error.message);
        }
        throw new Error(error);
      });
  }, [imageId]);

  const setImagePromise = useCallback(() => {
    if (imageId) {
      cancelablePromise = utils.makeCancelable(
        cornerstone.loadAndCacheImage(imageId)
      );
    }
  }, [imageId]);

  const purgeCancelablePromise = useCallback(() => {
    if (cancelablePromise) {
      cancelablePromise.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      purgeCancelablePromise();
    };
  }, []);

  useEffect(() => {
    if (image.imageId) {
      cornerstone.renderToCanvas(canvasRef.current, image);
      setLoading(false);
    }
  }, [image.imageId]);

  useEffect(() => {
    if (!image.imageId || image.imageId !== imageId) {
      purgeCancelablePromise();
      setImagePromise();
      fetchImagePromise();
    }
  }, [imageId]);

  const snapshotStyle = {
    visibility: isExpanded ? 'visible' : 'hidden',
    height: isExpanded ? 220 : 0,
    width: 'auto',
    borderRadius: 0,
  };

  return (
    <React.Fragment>
      <div className="collectionSection">
        <div className={`header${isExpanded ? ' expanded' : ''}`}>
          <h4>{label}</h4>
          <Icon
            name={`angle-double-${isExpanded ? 'down' : 'up'}`}
            className="icon"
            style={expandStyle}
            width="20px"
            height="20px"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          />
        </div>
      </div>
      <div className="ImageThumbnail" style={snapshotStyle}>
        <div className="image-thumbnail-canvas">
          <canvas ref={canvasRef} width={300} height={220} />
        </div>
        {loadingOrError}
      </div>
    </React.Fragment>
  );
};

const ViewportErrorIndicator = props => {
  const details = props.details || 'An error has occurred.';
  return (
    <div
      className="loadingIndicator"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        textAlign: 'center',
        pointerEvents: 'none',
        color: 'var(--active-color)',
      }}
    >
      <p className="title">Error</p>
      <p className="details">{details}</p>
    </div>
  );
};

export default memo(XNATSlideSnapshot);
