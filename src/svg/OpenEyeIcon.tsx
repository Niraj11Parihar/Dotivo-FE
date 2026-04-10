import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface OpenEyeIconProps {
  size?: number;
  color?: string;
}

export const OpenEyeIcon: React.FC<OpenEyeIconProps> = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </Svg>
  );
};
