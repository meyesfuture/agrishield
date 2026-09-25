import { Canvas } from '@react-three/fiber';
import { Suspense, ReactNode } from 'react';
import { Stars } from '@react-three/drei';

export default function Scene({ children }: { children?: ReactNode }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#2457FF" />
        <Stars radius={100} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />
        {children}
      </Suspense>
    </Canvas>
  );
}
