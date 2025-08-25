// utils/useOrientation.ts
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface OrientationDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export const useOrientation = (): OrientationDimensions => {
  const [orientation, setOrientation] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
      isPortrait: width <= height,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      setOrientation({
        width,
        height,
        isLandscape: width > height,
        isPortrait: width <= height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
};