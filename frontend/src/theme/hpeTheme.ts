import { deepMerge } from 'grommet/utils';
import { hpe } from 'grommet-theme-hpe';

export const appTheme = deepMerge(hpe, {
  global: {
    font: {
      family: '"DM Sans", "Inter", "Segoe UI", sans-serif',
      size: '14px',
      height: '20px',
    },
    colors: {
      brand: '#01A982',
      background: '#F4F5F7',
      text: '#111827',
      sidebar: '#13192A',
      sidebarAlt: '#151B2D',
    },
  },
  button: {
    border: {
      radius: '6px',
    },
    padding: {
      vertical: '7px',
      horizontal: '14px',
    },
    primary: {
      color: '#FFFFFF',
    },
  },
  layer: {
    border: {
      radius: '18px',
    },
  },
});

export default appTheme;
