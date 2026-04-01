// constants/Colors.ts

// The red primary color stays the same in both modes
const PRIMARY_RED = '#d30000'; 

export const lightTheme = {
  primary: PRIMARY_RED,
  background: '#F9F9FB', // Light gray background
  surface: '#FFFFFF',    // Pure white cards
  text: '#1A1A1A',       // Almost black text
  textMuted: '#8E8E93',  // Gray text
  star: '#FFC107',       // Yellow stars
  border: '#EAEAEC',     // Light borders
};

export const darkTheme = {
  primary: PRIMARY_RED,
  background: '#121212', // Deep dark background
  surface: '#1E1E1E',    // Slightly lighter dark cards
  text: '#FFFFFF',       // Pure white text
  textMuted: '#A0A0A0',  // Light gray text
  star: '#FFC107',       
  border: '#333333',     // Dark borders
};

// We will keep this here temporarily so your app doesn't break 
// while we transition your components to the new system!
export const Colors = lightTheme;