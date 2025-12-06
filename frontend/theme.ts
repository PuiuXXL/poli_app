export const theme = {
  colors: {
    background: '#0D0D0D',
    card: '#1A1A1A',
    surface: '#111114',
    surfaceAlt: '#161622',
    primary: '#2979FF', // neon blue
    primaryGlow: '#4C8CFF',
    accent: '#9C27B0', // electric purple
    accentGlow: '#B84AD1',
    text: '#F5F5F5',
    textDim: '#B5B5C2',
    border: '#272734',
    input: '#14141C',
    error: '#FF1744',
    success: '#00E676',
    warning: '#FDD835',
    muted: '#7A7A85',
    overlay: 'rgba(0,0,0,0.6)',
    trust: {
      high: '#00E676',
      medium: '#FDD835',
      low: '#FF1744',
    },
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 20,
    pill: 999,
  },
  typography: {
    title: 24,
    subtitle: 16,
    body: 14,
    caption: 12,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    },
    glowPrimary: {
      shadowColor: '#4C8CFF',
      shadowOpacity: 0.4,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    glowAccent: {
      shadowColor: '#B84AD1',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
  },
};
