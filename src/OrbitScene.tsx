// src/OrbitScene.tsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import { Vector3, Mesh } from 'three';
import { EcfPos } from './orbit';

export interface OrbitSceneProps {
  beaconMain: EcfPos[];
  beaconOpp: EcfPos[];
  relayPaths: EcfPos[][];
}

function SatelliteMarker({
  path,
  color,
  size,
}: {
  path: EcfPos[];
  color: string;
  size: number;
}) {
  const mesh = useRef<Mesh>(null!);
  const pts = useMemo(() => path.map((p) => new Vector3(p.x, p.y, p.z)), [path]);
  useFrame(({ clock }) => {
    const idx = Math.floor((clock.getElapsedTime() * 60) % 1440);
    mesh.current.position.copy(pts[idx]);
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function OrbitScene({
  beaconMain,
  beaconOpp,
  relayPaths,
}: OrbitSceneProps) {
  return (
    <Canvas camera={{ position: [0, -20000, 10000], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <Stars radius={20000} depth={50} count={3000} factor={4} />

      {/* 地球 */}
      <mesh>
        <sphereGeometry args={[6371000, 64, 64]} />
        <meshBasicMaterial color="darkblue" wireframe />
      </mesh>

      {/* 轨迹 */}
      {[beaconMain, beaconOpp, ...relayPaths].map((p, i) => (
        <line key={i}>
          <bufferGeometry setFromPoints={p.map((pt) => new Vector3(pt.x, pt.y, pt.z))} />
          <lineBasicMaterial
            color={i === 0 ? 'red' : i === 1 ? 'cyan' : 'yellow'}
            linewidth={i < 2 ? 2 : 1}
          />
        </line>
      ))}

      {/* 动态小球 */}
      <SatelliteMarker path={beaconMain} color="red" size={400000} />
      <SatelliteMarker path={beaconOpp} color="cyan" size={400000} />
      {relayPaths.map((p, i) => (
        <SatelliteMarker key={i} path={p} color="yellow" size={200000} />
      ))}

      <OrbitControls />
    </Canvas>
  );
}