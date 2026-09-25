import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AlertPin {
  lat: number;
  lng: number;
  severity: string;
  riskScore: number;
}

function latLngToXYZ(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

function Pin({ lat, lng, severity, riskScore }: AlertPin) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = severity === 'critical' ? '#ef4444' : '#f97316';
  const height = (riskScore / 100) * 0.4 + 0.05;
  const [x, y, z] = latLngToXYZ(lat, lng, 1.02);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + 0.15 * Math.sin(clock.elapsedTime * 2 + lat);
    }
  });

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      <boxGeometry args={[0.015, height, 0.015]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

export default function Globe({ alerts = [] }: { alerts?: any[] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const pins = useMemo(() =>
    alerts
      .filter((a) => a.latitude != null && a.longitude != null)
      .map((a) => ({
        lat: a.latitude,
        lng: a.longitude,
        severity: a.severity,
        riskScore: a.risk_score || 50,
      })),
    [alerts]
  );

  return (
    <group ref={groupRef}>
      {/* Outer glow sphere */}
      <Sphere args={[1.08, 64, 64]}>
        <meshStandardMaterial
          color="#2457FF"
          transparent
          opacity={0.04}
          wireframe={false}
        />
      </Sphere>

      {/* Main globe */}
      <Sphere args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#0a0a1a"
          wireframe={false}
          distort={0.02}
          speed={0.5}
          roughness={0.8}
          metalness={0.2}
        />
      </Sphere>

      {/* Wireframe overlay */}
      <Sphere args={[1.001, 24, 24]}>
        <meshStandardMaterial
          color="#2457FF"
          transparent
          opacity={0.06}
          wireframe
        />
      </Sphere>

      {/* Alert pins */}
      {pins.map((pin, i) => (
        <Pin key={i} {...pin} />
      ))}
    </group>
  );
}
