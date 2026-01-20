import { type ThreeElements } from "@react-three/fiber";

import { SpinnyCube, type SpinnyCubeProps } from "./spinny-cube";
import { SpinnyStar, type SpinnyStarColors } from "./spinny-star";

export interface SpinnyCubeWithStarsProps extends SpinnyCubeProps {
  initialColors?: SpinnyStarColors;
}

export function SpinnyCubeWithStars({
  size,
  speed,
  initialColors,
  ...props
}: ThreeElements["mesh"] & SpinnyCubeWithStarsProps) {
  return (
    <SpinnyCube size={size} speed={speed} {...props}>
      <SpinnyStar speed={speed} initialColors={initialColors} />
    </SpinnyCube>
  );
}
