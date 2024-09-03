import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as dcmjs from 'dcmjs';
import { Icon } from '@ohif/ui';
import { state } from '@ohif/core';
import { SpecimenPreparationStepItems } from '../utils/specimens';

const XNATOpticalPathList = ({ apiUID }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [opticalPaths, setOpticalPaths] = useState([]);
  const [opticalPathMetadata, setOpticalPathMetadata] = useState({});
  const [opticalPathVisible, setOpticalPathVisible] = useState({});
  // const [opticalPathStyle, setOpticalPathStyle] = useState({});

  useEffect(() => {
    const api = state.getApi(apiUID);
    const opticalPaths = api.getAllOpticalPaths();
    opticalPaths.sort((a, b) => {
      return a.identifier.localeCompare(b.identifier, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });

    const opticalPathMetadata = {};
    const opticalPathVisible = {};
    // const opticalPathActive = {};
    // const opticalPathStyle = {};
    opticalPaths.forEach(opticalPath => {
      const identifier = opticalPath.identifier;
      const metadata = api.getOpticalPathMetadata(identifier);
      opticalPathMetadata[identifier] = metadata;
      opticalPathVisible[identifier] = api.isOpticalPathVisible(identifier);
      // opticalPathActive[identifier] = api.isOpticalPathActive(identifier);
      // opticalPathStyle[identifier] = { ...api.getOpticalPathDefaultStyle(identifier) };
    });

    setOpticalPaths(opticalPaths);
    setOpticalPathMetadata(opticalPathMetadata);
    setOpticalPathVisible(opticalPathVisible);
    // setOpticalPathStyle(opticalPathStyle);
  }, [apiUID]);

  const toggleVisibility = useCallback(
    identifier => {
      const isVisible = opticalPathVisible[identifier];
      const api = state.getApi(apiUID);
      if (isVisible) {
        api.hideOpticalPath(identifier);
        // api.deactivateOpticalPath(identifier);
      } else {
        // api.activateOpticalPath(identifier);
        api.showOpticalPath(identifier);
      }
      setOpticalPathVisible({
        ...opticalPathVisible,
        [identifier]: !isVisible,
      });
    },
    [apiUID, opticalPathVisible]
  );

  const expandStyle = isExpanded ? {} : { transform: 'rotate(90deg)' };

  return (
    <React.Fragment>
      <div className="collectionSection">
        <div className={`header${isExpanded ? ' expanded' : ''}`}>
          <h4>Channels</h4>
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
      {isExpanded && (
        <table className="collectionTable">
          {/*<thead>*/}
          {/*  <tr>*/}
          {/*    <th width="5%" className="centered-cell">*/}
          {/*      #*/}
          {/*    </th>*/}
          {/*    <th width="85%" className="left-aligned-cell">*/}
          {/*      Optical Path*/}
          {/*    </th>*/}
          {/*    <th width="10%" className="" />*/}
          {/*  </tr>*/}
          {/*</thead>*/}
          <tbody>
            {opticalPaths.map(opticalPath => {
              const identifier = opticalPath.identifier;
              const images = opticalPathMetadata[identifier];
              const seriesInstanceUID = images[0].SeriesInstanceUID;
              const opticalPathItems = [];
              images[0].OpticalPathSequence.forEach(opticalPathItem => {
                const id = opticalPathItem.OpticalPathIdentifier;
                if (identifier === id) {
                  opticalPathItems.push(
                    <OpticalPathItem
                      key={`${seriesInstanceUID}-${id}`}
                      apiUID={apiUID}
                      opticalPath={opticalPath}
                      metadata={images}
                      // opticalPathStyle={opticalPathStyle[identifier]}
                      isVisible={opticalPathVisible[id]}
                      toggleVisibility={toggleVisibility}
                    />
                  );
                }
              });
              return opticalPathItems;
            })}
          </tbody>
        </table>
      )}
    </React.Fragment>
  );
};

const OpticalPathItem = ({
  apiUID,
  opticalPath,
  metadata,
  opticalPathStyle,
  isVisible,
  toggleVisibility,
}) => {
  const [data, setData] = useState({});

  useEffect(() => {
    setData(populateOpticalPathData(opticalPath, metadata));
  }, [apiUID, metadata, opticalPath]);

  if (!data.identifier) {
    return null;
  }

  const showHideIcon = isVisible ? (
    <Icon name="eye" width="13px" height="13px" />
  ) : (
    <Icon name="eye-closed" width="13px" height="13px" />
  );

  return (
    <tr>
      <td className="centered-cell">{`${data.identifier}`}</td>
      <td className="left-aligned-cell">
        <span style={{ color: 'var(--text-primary-color)' }}>
          {`${data.description}`}
        </span>
        {data.wavelength && (
          <span
            style={{
              color: 'var(--text-secondary-color)',
              display: 'block',
            }}
          >
            {`${data.wavelength} nm`}
          </span>
        )}
        {data.tissueStains &&
          data.tissueStains.map((stain, index) => (
            <span
              key={index}
              style={{
                color: 'var(--text-secondary-color)',
                display: 'block',
              }}
            >
              {stain}
            </span>
          ))}
      </td>
      <td>
        <button
          className="small"
          onClick={() => toggleVisibility(opticalPath.identifier)}
        >
          {showHideIcon}
        </button>
      </td>
    </tr>
  );
};

const populateOpticalPathData = (opticalPath, metadata) => {
  const identifier = opticalPath.identifier || '?';
  const description = opticalPath.description || 'No description';
  // Illumination wavelength
  const wavelength = opticalPath.illuminationWaveLength;
  // Illumination color
  const color = opticalPath.illuminationColor
    ? opticalPath.illuminationColor.CodeMeaning
    : undefined;

  const tissueStains = [];
  // Specimen Preparation
  const specimenDescriptions = metadata[0].SpecimenDescriptionSequence || [];
  try {
    specimenDescriptions.forEach(description => {
      const specimenPreparationSteps =
        description.SpecimenPreparationSequence || [];
      specimenPreparationSteps.forEach((step, stepIdx) => {
        step.SpecimenPreparationStepContentItemSequence.forEach(
          (item, index) => {
            const name = new dcmjs.sr.coding.CodedConcept({
              value: item.ConceptNameCodeSequence[0].CodeValue,
              schemeDesignator:
                item.ConceptNameCodeSequence[0].CodingSchemeDesignator,
              meaning: item.ConceptNameCodeSequence[0].CodeMeaning,
            });
            if (item.ValueType === dcmjs.sr.valueTypes.ValueTypes.CODE) {
              const value = new dcmjs.sr.coding.CodedConcept({
                value: item.ConceptCodeSequence[0].CodeValue,
                schemeDesignator:
                  item.ConceptCodeSequence[0].CodingSchemeDesignator,
                meaning: item.ConceptCodeSequence[0].CodeMeaning,
              });
              if (!name.equals(SpecimenPreparationStepItems.PROCESSING_TYPE)) {
                if (name.equals(SpecimenPreparationStepItems.STAIN)) {
                  tissueStains.push(value.CodeMeaning);
                }
              }
            } else if (item.ValueType === dcmjs.sr.valueTypes.ValueTypes.TEXT) {
              if (!name.equals(SpecimenPreparationStepItems.PROCESSING_TYPE)) {
                if (name.equals(SpecimenPreparationStepItems.STAIN)) {
                  tissueStains.push(item.TextValue);
                }
              }
            }
          }
        );
      });
    });
  } catch (e) {
    // Ignore error
  }

  return {
    identifier,
    description,
    wavelength,
    color,
    tissueStains,
  };
};

export default XNATOpticalPathList;
