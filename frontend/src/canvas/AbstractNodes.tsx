import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Node({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speed = 0.5 + Math.random() * 0.5;
  const phase = Math.random() * Math.PI * 2;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed + phase) * 0.3;
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.008;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.8}
        wireframe
      />
    </mesh>
  );
}

export default function AbstractNodes() {
  const nodes: Array<{ position: [number, number, number]; color: string }> = [
    { position: [-2.5, 1, -2], color: '#2457FF' },
    { position: [2.5, -0.5, -3], color: '#2457FF' },
    { position: [0, 2, -4], color: '#ffffff' },
    { position: [-1.5, -1.5, -2], color: '#6366f1' },
    { position: [1.5, 1.5, -3], color: '#2457FF' },
    { position: [3, 0, -2], color: '#ffffff' },
    { position: [-3, 0, -3], color: '#2457FF' },
  ];

  return (
    <group>
      {nodes.map((node, i) => (
        <Node key={i} {...node} />
      ))}
    </group>
  );
}
