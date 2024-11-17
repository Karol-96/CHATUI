export const tokens = {
  spacing: {
    header: '3.5rem',     // 56px - standard header height
    xs: '0.25rem',        // 4px
    sm: '0.5rem',         // 8px
    md: '1rem',           // 16px
    lg: '1.5rem',         // 24px
    xl: '2rem',           // 32px
  },
  sizes: {
    sidebar: '16rem',  // 256px - our sidebar width
  },
  colors: {
    border: {
      default: 'rgb(229, 231, 235)',    // gray-200
      active: 'rgb(209, 213, 219)',     // gray-300
    },
    background: {
      white: 'white',
      hover: 'rgb(243, 244, 246)',      // gray-100
      active: 'rgb(219, 234, 254)',     // blue-100
    },
    text: {
      primary: 'rgb(17, 24, 39)',       // gray-900
      secondary: 'rgb(75, 85, 99)',     // gray-600
      disabled: 'rgb(156, 163, 175)',   // gray-400
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  }
} as const; 