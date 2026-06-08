import { deepMerge } from 'grommet/utils';
import { hpe } from 'grommet-theme-hpe';

export const appTheme = deepMerge(hpe, {
  global: {
    font: {
      family: '"Inter", "Segoe UI", sans-serif',
      size: '14px',
      height: '20px',
    },
    colors: {
      brand: '#01A982',
      background: '#F3F5F9',
      text: '#111827',
      sidebar: '#13192A',
      sidebarAlt: '#151B2D',
    },
  },
  button: {
    border: {
      radius: '10px',
    },
    padding: {
      vertical: '10px',
      horizontal: '16px',
    },
  },
  layer: {
    border: {
      radius: '18px',
    },
  },
});

export default appTheme;
