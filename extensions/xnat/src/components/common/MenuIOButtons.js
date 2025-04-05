import React from 'react';

/**
 * @class MenuIOButtons - Renders Import and/or Export buttons if
 * this.props.ImportCallbackOrComponent and/or
 * this.props.ExportCallbackOrComponent are defined.
 */
export default class MenuIOButtons extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      ImportCallbackOrComponent,
      ExportCallbackOrComponent,
      onImportButtonClick,
      onExportButtonClick,
      importDisabledMessage,
      exportDisabledMessage,
    } = this.props;

    if (!ImportCallbackOrComponent && !ExportCallbackOrComponent) {
      return null;
    }

    const importButton = importDisabledMessage ? (
      <button title={importDisabledMessage} disabled>
        Import
      </button>
    ) : (
      <button onClick={onImportButtonClick}>Import</button>
    );

    const exportButton = exportDisabledMessage ? (
      <button title={exportDisabledMessage} disabled>
        Export
      </button>
    ) : (
      <button onClick={onExportButtonClick}>Export</button>
    );

    return (
      <div>
        {ImportCallbackOrComponent && importButton}
        {ExportCallbackOrComponent && exportButton}
      </div>
    );
  }
}
