import { DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    text: '#000000',
    primary: '#560CCE',
    secondary: '#414757',
    error: '#f13a59',
    admin: '#FF6B35',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    accent: '#FFC107',
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