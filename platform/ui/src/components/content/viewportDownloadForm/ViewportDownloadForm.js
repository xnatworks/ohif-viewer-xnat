import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  createRef,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { sessionMap, fetchCSRFToken } from '@xnat-ohif/extension-xnat';

import './ViewportDownloadForm.styl';
import { TextInput, Select, Icon } from '@ohif/ui';
import classnames from 'classnames';

const FILE_TYPE_OPTIONS = [
  {
    key: 'jpg',
    value: 'jpg',
  },
  {
    key: 'png',
    value: 'png',
  },
];

const REFRESH_VIEWPORT_TIMEOUT = 500;
const XNAT_RESOURCES_FOLDER = 'ViewerSnapshots';

const ViewportDownloadForm = ({
  activeViewport,
  onClose,
  updateViewportPreview,
  enableViewport,
  disableViewport,
  toggleAnnotations,
  loadImage,
  downloadBlob,
  UINotificationService,
  defaultSize,
  minimumSize,
  maximumSize,
  canvasClass,
}) => {
  const [t] = useTranslation('ViewportDownloadForm');

  const { DEFAULT_FILENAME, xnatScan } = useMemo(() => {
    let label;
    let xnatScan;
    try {
      const enabledElement = cornerstone.getEnabledElement(activeViewport);
      const imageId = enabledElement.image.imageId;
      const metadata = cornerstone.metaData.get('instance', imageId);
      const {
        SeriesNumber,
        SeriesInstanceUID,
        InstanceNumber,
        SOPInstanceUID,
      } = metadata;

      const seriesLabel =
        SeriesNumber !== undefined ? `ser-${SeriesNumber}` : 'ser-UNK';
      let instanceLabel;
      if (InstanceNumber !== undefined) {
        instanceLabel = `inst-${InstanceNumber}`;
      } else if (SOPInstanceUID !== undefined) {
        instanceLabel = `inst-${SOPInstanceUID}`;
      } else {
        instanceLabel = 'inst-UNK';
      }

      label = `${seriesLabel}_${instanceLabel}`;

      if (sessionMap.hasCreatePermission()) {
        xnatScan = sessionMap.getScan(SeriesInstanceUID);
      }
    } catch (e) {
      label = 'image';
    }

    return { DEFAULT_FILENAME: label, xnatScan };
  }, [activeViewport]);

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [fileType, setFileType] = useState('jpg');

  const [dimensions, setDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });

  const [showAnnotations, setShowAnnotations] = useState(true);

  const [keepAspect, setKeepAspect] = useState(true);
  const [aspectMultiplier, setAspectMultiplier] = useState({
    width: 1,
    height: 1,
  });

  const [viewportElement, setViewportElement] = useState();
  const [viewportElementDimensions, setViewportElementDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });

  const [downloadCanvas, setDownloadCanvas] = useState({
    ref: createRef(),
    width: defaultSize,
    height: defaultSize,
  });

  const [viewportPreview, setViewportPreview] = useState({
    src: null,
    width: defaultSize,
    height: defaultSize,
  });

  const [error, setError] = useState({
    width: false,
    height: false,
    filename: false,
  });

  const [isUploadingToXnat, setUploadingToXnat] = useState(false);

  const hasError = Object.values(error).includes(true);

  const refreshViewport = useRef(null);

  const downloadImage = () => {
    downloadBlob(
      filename || DEFAULT_FILENAME,
      fileType,
      viewportElement,
      downloadCanvas.ref.current
    );
  };

  const uploadToXnat = async () => {
    setUploadingToXnat(true);

    const csrfToken = await fetchCSRFToken();
    const csrfTokenParameter = `XNAT_CSRF=${csrfToken}`;
    const rootUrl = sessionMap.xnatRootUrl;

    createXnatResourcesFolder(rootUrl, xnatScan, csrfTokenParameter)
      .then(() => {
        return new Promise(resolve =>
          viewportElement.querySelector('canvas').toBlob(resolve)
        );
      })
      .then(blob => {
        return uploadSnapshotResourcesFile(
          rootUrl,
          xnatScan,
          csrfTokenParameter,
          blob,
          filename
        );
      })
      .then(() => {
        UINotificationService.show({
          title: 'Snapshot upload',
          message: 'Snapshot was successfully uploaded to XNAT.',
          type: 'info',
        });
      })
      .catch(err => {
        const message = err.message || 'Unknown error.';
        UINotificationService.show({
          title: 'Error uploading snapshot',
          message: message,
          type: 'error',
        });
      })
      .finally(() => {
        setUploadingToXnat(false);
      });
  };

  /**
   * @param {object} event - Input change event
   * @param {string} dimension - "height" | "width"
   */
  const onDimensionsChange = (event, dimension) => {
    const oppositeDimension = dimension === 'height' ? 'width' : 'height';
    const sanitizedTargetValue = event.target.value.replace(/\D/, '');
    const isEmpty = sanitizedTargetValue === '';
    const newDimensions = { ...dimensions };
    const updatedDimension = isEmpty
      ? ''
      : Math.min(sanitizedTargetValue, maximumSize);

    if (updatedDimension === dimensions[dimension]) {
      return;
    }

    newDimensions[dimension] = updatedDimension;

    if (keepAspect && newDimensions[oppositeDimension] !== '') {
      newDimensions[oppositeDimension] = Math.round(
        newDimensions[dimension] * aspectMultiplier[oppositeDimension]
      );
    }

    // In current code, keepAspect is always `true`
    // And we always start w/ a square width/height
    setDimensions(newDimensions);

    // Only update if value is non-empty
    if (!isEmpty) {
      setViewportElementDimensions(newDimensions);
      setDownloadCanvas(state => ({
        ...state,
        ...newDimensions,
      }));
    }
  };

  const error_messages = {
    width: t('minWidthError'),
    height: t('minHeightError'),
    filename: t('emptyFilenameError'),
  };

  const renderErrorHandler = errorType => {
    if (!error[errorType]) {
      return null;
    }

    return <div className="input-error">{error_messages[errorType]}</div>;
  };

  const onKeepAspectToggle = () => {
    const { width, height } = dimensions;
    const aspectMultiplier = { ...aspectMultiplier };
    if (!keepAspect) {
      const base = Math.min(width, height);
      aspectMultiplier.width = width / base;
      aspectMultiplier.height = height / base;
      setAspectMultiplier(aspectMultiplier);
    }

    setKeepAspect(!keepAspect);
  };

  const validSize = value => (value >= minimumSize ? value : minimumSize);
  const loadAndUpdateViewports = useCallback(async () => {
    const { width: scaledWidth, height: scaledHeight } = await loadImage(
      activeViewport,
      viewportElement,
      dimensions.width,
      dimensions.height
    );

    toggleAnnotations(showAnnotations, viewportElement);

    const scaledDimensions = {
      height: validSize(scaledHeight),
      width: validSize(scaledWidth),
    };

    setViewportElementDimensions(scaledDimensions);
    setDownloadCanvas(state => ({
      ...state,
      ...scaledDimensions,
    }));

    const {
      dataUrl,
      width: viewportElementWidth,
      height: viewportElementHeight,
    } = await updateViewportPreview(
      viewportElement,
      downloadCanvas.ref.current,
      fileType
    );

    setViewportPreview(state => ({
      ...state,
      src: dataUrl,
      width: validSize(viewportElementWidth),
      height: validSize(viewportElementHeight),
    }));
  }, [
    // loadImage,
    activeViewport,
    viewportElement,
    dimensions.width,
    dimensions.height,
    // toggleAnnotations,
    showAnnotations,
    validSize,
    // updateViewportPreview,
    downloadCanvas.ref,
    fileType,
  ]);

  useEffect(() => {
    enableViewport(viewportElement);

    return () => {
      disableViewport(viewportElement);
    };
  }, [viewportElement]);

  useEffect(() => {
    if (refreshViewport.current !== null) {
      clearTimeout(refreshViewport.current);
    }

    refreshViewport.current = setTimeout(() => {
      refreshViewport.current = null;
      loadAndUpdateViewports();
    }, REFRESH_VIEWPORT_TIMEOUT);
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    dimensions,
    // loadImage,
    // toggleAnnotations,
    // updateViewportPreview,
    fileType,
    downloadCanvas.ref,
    minimumSize,
    maximumSize,
    // loadAndUpdateViewports,
  ]);

  useEffect(() => {
    const { width, height } = dimensions;
    const hasError = {
      width: width < minimumSize,
      height: height < minimumSize,
      filename: !filename,
    };

    setError({ ...hasError });
  }, [dimensions, filename, minimumSize]);

  return (
    <div className="ViewportDownloadForm">
      {/*<div className="title">{t('formTitle')}</div>*/}

      <div className="file-info-container" data-cy="file-info-container">
        <div className="dimension-wrapper">
          <div className="dimensions">
            <div className="width">
              <TextInput
                type="number"
                min={minimumSize}
                max={maximumSize}
                value={dimensions.width}
                label={t('imageWidth')}
                onChange={evt => onDimensionsChange(evt, 'width')}
                data-cy="image-width"
              />
              {renderErrorHandler('width')}
            </div>
            <div className="height">
              <TextInput
                type="number"
                min={minimumSize}
                max={maximumSize}
                value={dimensions.height}
                label={t('imageHeight')}
                onChange={evt => onDimensionsChange(evt, 'height')}
                data-cy="image-height"
              />
              {renderErrorHandler('height')}
            </div>
          </div>
          <div className="keep-aspect-wrapper">
            <button
              id="keep-aspect"
              className={classnames(
                'form-button btn',
                keepAspect ? 'active' : ''
              )}
              data-cy="keep-aspect"
              alt={t('keepAspectRatio')}
              onClick={onKeepAspectToggle}
            >
              <Icon
                name={keepAspect ? 'link' : 'unlink'}
                alt={keepAspect ? 'Dismiss Aspect' : 'Keep Aspect'}
              />
            </button>
          </div>
        </div>

        <div className="col">
          <div className="file-name">
            <TextInput
              type="text"
              data-cy="file-name"
              value={filename}
              onChange={event => setFilename(event.target.value)}
              label={t('filename')}
              id="file-name"
            />
            {renderErrorHandler('filename')}
          </div>
          <div className="file-type">
            <Select
              value={fileType}
              data-cy="file-type"
              onChange={event => setFileType(event.target.value)}
              options={FILE_TYPE_OPTIONS}
              label={t('fileType')}
            />
          </div>
        </div>

        <div className="col">
          <div className="show-annotations">
            <label htmlFor="show-annotations" className="form-check-label">
              <input
                id="show-annotations"
                data-cy="show-annotations"
                type="checkbox"
                className="form-check-input"
                checked={showAnnotations}
                onChange={event => setShowAnnotations(event.target.checked)}
              />
              {t('showAnnotations')}
            </label>
          </div>
        </div>
      </div>

      <div
        style={{
          height: viewportElementDimensions.height,
          width: viewportElementDimensions.width,
          position: 'absolute',
          left: '9999px',
        }}
        ref={ref => setViewportElement(ref)}
      >
        <canvas
          className={canvasClass}
          style={{
            height: downloadCanvas.height,
            width: downloadCanvas.width,
            display: 'block',
          }}
          width={downloadCanvas.width}
          height={downloadCanvas.height}
          ref={downloadCanvas.ref}
        ></canvas>
      </div>

      {viewportPreview.src ? (
        <div className="preview" data-cy="image-preview">
          <div className="preview-header"> {t('imagePreview')}</div>
          <img
            className="viewport-preview"
            src={viewportPreview.src}
            alt={t('imagePreview')}
            data-cy="image-preview"
            data-cy="viewport-preview-img"
          />
        </div>
      ) : (
        <div className="loading-image">
          <Icon name="circle-notch" className="icon-spin" />
          {t('loadingPreview')}
        </div>
      )}

      <div className="actions">
        <div className="action-cancel">
          <button
            type="button"
            data-cy="cancel-btn"
            className="btn btn-danger"
            onClick={onClose}
          >
            {t('Buttons:Cancel')}
          </button>
        </div>
        <div className="action-save">
          <button
            disabled={hasError}
            onClick={downloadImage}
            className="btn btn-primary"
            data-cy="download-btn"
          >
            {t('Buttons:Download')}
          </button>
        </div>
        <div className="action-save">
          <button
            disabled={hasError || isUploadingToXnat || xnatScan === undefined}
            onClick={uploadToXnat}
            className="btn btn-primary"
            data-cy="download-btn"
            title="Upload to the Session's 'ViewerSnapshots' Resource"
          >
            {isUploadingToXnat ? (
              <span>
                <Icon name="circle-notch" className="icon-spin" />
                <span style={{ marginLeft: 5 }}>Uploading</span>
              </span>
            ) : (
              <span>Upload to XNAT</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

ViewportDownloadForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  activeViewport: PropTypes.object,
  updateViewportPreview: PropTypes.func.isRequired,
  enableViewport: PropTypes.func.isRequired,
  disableViewport: PropTypes.func.isRequired,
  toggleAnnotations: PropTypes.func.isRequired,
  loadImage: PropTypes.func.isRequired,
  downloadBlob: PropTypes.func.isRequired,
  UINotificationService: PropTypes.object.isRequired,
  /** A default width & height, between the minimum and maximum size */
  defaultSize: PropTypes.number.isRequired,
  minimumSize: PropTypes.number.isRequired,
  maximumSize: PropTypes.number.isRequired,
  canvasClass: PropTypes.string.isRequired,
};

const createXnatResourcesFolder = async (
  rootUrl,
  xnatScan,
  csrfTokenParameter
) => {
  return new Promise((resolve, reject) => {
    const { experimentId } = xnatScan;
    if (!experimentId) {
      return reject(new Error('Unable to identify Experiment ID'));
    }

    let url = `${rootUrl}data/experiments/${experimentId}/`;
    url += `resources/${XNAT_RESOURCES_FOLDER}?${csrfTokenParameter}`;
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      // 409 means that the resources folder exists
      if (xhr.status === 200 || xhr.status === 201 || xhr.status === 409) {
        resolve();
      } else {
        reject(xhr.responseText || xhr.statusText);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText || xhr.statusText);
    };

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({}));
  });
};

const uploadSnapshotResourcesFile = (rootUrl, xnatScan, csrfTokenParameter, blob, filename) => {
  return new Promise((resolve, reject) => {
    const { experimentId } = xnatScan;
    if (!experimentId) {
      return reject(new Error('Unable to identify Experiment ID'));
    }

    let url = `${rootUrl}data/experiments/${experimentId}/`;
    url += `resources/${XNAT_RESOURCES_FOLDER}/files/${filename}.png`;
    url += `?${csrfTokenParameter}&overwrite=true`;
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      // 409 means that the resources folder exists
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(xhr.responseText || xhr.statusText);
      }
    };

    xhr.onerror = () => {
      console.log(`Request returned, status: ${xhr.status}`);
      reject(xhr.responseText || xhr.statusText);
    };

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'image/png');
    xhr.send(blob);
  });
};

export default ViewportDownloadForm;
