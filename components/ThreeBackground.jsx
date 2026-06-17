// components/ThreeBackground.jsx
import { useRef, useContext } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import { AppContext } from '../pages/_app';

function AnimatedBlob() {
  const meshRef = useRef();
  const { theme } = useContext(AppContext);

  useFrame(({ mouse }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += (mouse.y * 0.5 - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (mouse.x * 0.5 - meshRef.current.rotation.y) * 0.1;
    }
  });

  const getColor = () => {
    switch (theme) {
      case 'dark': return '#4f46e5';
      case 'cyberpunk': return '#ff007f';
      case 'nature': return '#047857';
      default: return '#2563eb';
    }
  };

  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={2}>
      <MeshDistortMaterial
        color={getColor()}
        distort={0.4}
        speed={2}
        roughness={0.5}
        metalness={0.1}
        transparent
        opacity={0.8}
      />
    </Sphere>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" style={{ opacity: 0.35 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} intensity={1} />
        <AnimatedBlob />
      </Canvas>
    </div>
  );
}