import { DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    text: '#000000',
    primary: '#560CCE',
    secondary: '#414757',
    error: '#f13a59',
    admin: '#FF6B35',        // Orange for admin/shop owner
    success: '#4CAF50',      // Green for success states
    warning: '#FF9800',      // Amber for warnings
    info: '#2196F3',         // Blue for info
    accent: '#FFC107',       // Yellow accent
    placeholder: '#888888',
    surface: '#FFFFFF',
    background: '#FFFFFF',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
  roundness: 10,
  animation: {
    scale: 1.0,
  },
};