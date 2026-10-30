import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../../../core/schema';

const Crystal: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  return (
    <mesh rotation={[frame * 0.009, frame * 0.014, frame * 0.004]}>
      <dodecahedronGeometry args={[1.45, 0]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.22} flatShading />
    </mesh>
  );
};

export type ThreeCrystalProps = {
  text: string;
  theme: Theme;
  durationInFrames: number;
};

export const ThreeCrystal: React.FC<ThreeCrystalProps> = ({text, theme}) => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: theme.background, color: theme.foreground, fontFamily: theme.fontFamily}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 5], fov: 42}}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 6]} intensity={3.2} />
        <pointLight position={[-4, -2, 3]} color={theme.accent} intensity={25} />
        <Crystal color={theme.accent} />
      </ThreeCanvas>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: height * 0.1, pointerEvents: 'none'}}>
        <div style={{fontSize: width / 30, fontWeight: 750, letterSpacing: 2}}>{text}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
