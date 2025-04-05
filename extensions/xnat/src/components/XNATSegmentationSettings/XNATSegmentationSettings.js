import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { Range } from '@ohif/ui';
import refreshViewports from '../../utils/refreshViewports';

import './XNATSegmentationSettings.css';

const segmentationModule = csTools.getModule('segmentation');

const XNATSegmentationSettings = ({ onBack }) => {
  const configRef = useRef(segmentationModule.configuration);
  const [state, setState] = useState({ ...configRef.current });

  useEffect(() => {
    const callback = () => {
      setState({ ...configRef.current });
    };
    document.addEventListener('brushtoolsizechange', callback);

    return () => {
      document.removeEventListener('brushtoolsizechange', callback);
    };
  }, []);

  useEffect(() => {
    refreshViewports();
  }, [state]);

  const check = field => {
    configRef.current[field] = !configRef.current[field];
    setState({ ...configRef.current });
  };

  const save = (field, value) => {
    if (field === 'radius') {
      segmentationModule.setters.radius(value);
    } else {
      configRef.current[field] = value;
    }
    setState({ ...configRef.current });
  };

  const toFloat = value => parseFloat(value) / 100;

  const SegmentFill = (
    <div
      className="settings-group"
      style={{ marginBottom: configRef.current.renderFill ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Fill"
        checked={configRef.current.renderFill}
        onChange={() => check('renderFill')}
      />
      {configRef.current.renderFill && (
        <CustomRange
          label="Opacity"
          step={1}
          min={0}
          max={100}
          value={Number((configRef.current.fillAlpha * 100).toFixed(0))}
          onChange={event => save('fillAlpha', toFloat(event.target.value))}
          showPercentage
        />
      )}
    </div>
  );

  const SegmentOutline = (
    <div
      className="settings-group"
      style={{ marginBottom: configRef.current.renderOutline ? 15 : 0 }}
    >
      <CustomCheck
        label="Segment Outline"
        checked={configRef.current.renderOutline}
        onChange={() => check('renderOutline')}
      />
      {configRef.current.renderOutline && (
        <>
          <CustomRange
            value={Number((configRef.current.outlineAlpha * 100).toFixed(0))}
            label="Opacity"
            showPercentage
            step={1}
            min={0}
            max={100}
            onChange={event =>
              save('outlineAlpha', toFloat(event.target.value))
            }
          />
          <CustomRange
            value={configRef.current.outlineWidth}
            label="Width"
            showValue
            step={1}
            min={0}
            max={5}
            onChange={event =>
              save('outlineWidth', parseInt(event.target.value))
            }
          />
        </>
      )}
    </div>
  );

  const BrushSize = (
    <div className="settings-group" style={{ marginBottom: 15 }}>
      <div className="custom-check">
        <label>Brush Size</label>
      </div>
      <CustomRange
        label="Radius"
        step={1}
        min={configRef.current.minRadius}
        max={configRef.current.maxRadius}
        value={configRef.current.radius}
        onChange={event => save('radius', parseInt(event.target.value))}
        showValue
      />
    </div>
  );

  return (
    <div className="dcmseg-segmentation-settings">
      <div className="settings-title">
        <h3>Mask ROI Settings</h3>
        <button className="return-button" onClick={onBack}>
          Back
        </button>
      </div>
      {BrushSize}
      {SegmentFill}
      {SegmentOutline}
    </div>
  );
};

const CustomCheck = ({ label, checked, onChange }) => {
  return (
    <div className="custom-check">
      <label>
        <span>{label}</span>
        <input type="checkbox"  className="mousetrap" checked={checked} onChange={onChange} />
      </label>
    </div>
  );
};

const CustomRange = props => {
  const { label, onChange } = props;
  return (
    <div className="range">
      <label htmlFor="range">{label}</label>
      <Range
        {...props}
        onChange={event => {
          event.persist();
          onChange(event);
        }}
      />
    </div>
  );
};

XNATSegmentationSettings.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default XNATSegmentationSettings;
