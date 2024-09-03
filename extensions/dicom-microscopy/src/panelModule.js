import React from 'react';
import XNATSlidePanel from './components/XNATSlidePanel';

const PanelModule = (commandsManager, api, servicesManager) => {
  return {
    menuOptions: [
      {
        icon: 'info',
        label: 'Slide',
        from: 'right',
        target: 'xnat-slide-panel',
      },
    ],
    components: [
      {
        id: 'xnat-slide-panel',
        component: XNATSlidePanel,
      },
    ],
    defaultContext: ['ACTIVE_VIEWPORT::MICROSCOPY'],
    selectedLeftSidePanel: 'studies',
    selectedRightSidePanel: '',
  };
};

export default PanelModule;
