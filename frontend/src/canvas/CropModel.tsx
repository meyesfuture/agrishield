import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface CropModelProps {
  commodity: string;
  riskScore: number;
}

export default function CropModel({ commodity: _commodity, riskScore }: CropModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  const isHighRisk = riskScore > 70;
  const isCritical = riskScore > 85;

  // Color scheme based on risk
  const primaryColor = isCritical ? '#ef4444' : isHighRisk ? '#f97316' : '#2457FF';
  const emissiveIntensity = isCritical ? 0.6 : isHighRisk ? 0.4 : 0.2;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.4;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.1;
    }
    if (innerRef.current) {
      const scale = 1 + 0.05 * Math.sin(clock.elapsedTime * 2);
      innerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core sphere */}
      <Sphere ref={innerRef} args={[0.8, 32, 32]}>
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Ring 1 */}
      <Torus args={[1.2, 0.02, 8, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
        />
      </Torus>

      {/* Ring 2 - tilted */}
      <Torus args={[1.4, 0.015, 8, 64]} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.1}
          transparent
          opacity={0.2}
        />
      </Torus>

      {/* Outer glow */}
      <Sphere args={[1.1, 32, 32]}>
        <meshStandardMaterial
          color={primaryColor}
          transparent
          opacity={0.05}
          wireframe={false}
        />
      </Sphere>
    </group>
  );
}
