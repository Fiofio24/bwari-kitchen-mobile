import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// THE MASTER DIAL
// Change this to shrink or grow the entire app! 
// 1.0 = Default size, 0.8 = 20% smaller
export const APP_SCALE = 0.85; 

// The magic function that wraps around all our sizes
export const scale = (size: number) => Math.round(size * APP_SCALE);

export const Sizes = {
  width,
  height,
  scale,
};