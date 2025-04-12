import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { colors } from '../../../styles/colors';

interface HeartActiveIconProps {
  size?: number;
  color?: string;
}

const HeartActiveIcon: React.FC<HeartActiveIconProps> = ({ size = 24, color = colors.primary }) => {
  // Calculate the viewBox
  const originalWidth = 25;
  const originalHeight = 24;
  const viewBox = `0 0 ${originalWidth} ${originalHeight}`;

  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <G id="Interface / Heart_02">
        <Path
          id="Vector"
          d="M19.7373 6.23731C21.2839 7.78395 21.3432 10.2727 19.8718 11.8911L12.4995 20.0001L5.12812 11.8911C3.65679 10.2727 3.71605 7.7839 5.26269 6.23726C6.98961 4.51034 9.83372 4.66814 11.3594 6.5752L12.5 8.00045L13.6396 6.57504C15.1653 4.66798 18.0104 4.51039 19.7373 6.23731Z"
          fill={color}
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};

export default HeartActiveIcon;
