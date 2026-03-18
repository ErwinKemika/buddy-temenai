import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Orbit rings (HTML overlay) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="orbit-ring w-[280px] h-[280px] animate-orbit opacity-30" />
        <div className="orbit-ring w-[380px] h-[380px] animate-orbit-reverse opacity-20" />
        <div className="orbit-ring w-[460px] h-[460px] animate-orbit opacity-10" />
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.5, 4.5], fov: 45 }}
        className="z-10"
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 5]} intensity={0.8} color="#a78bfa" />
        <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#38bdf8" />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#818cf8" />
        <spotLight position={[0, 5, 0]} angle={0.4} penumbra={1} intensity={0.3} color="#c084fc" />

        <Float
          speed={2}
          rotationIntensity={0.15}
          floatIntensity={0.6}
          floatingRange={[-0.15, 0.15]}
        >
          <RobotModel isTalking={isTalking} />
        </Float>

        <OrbitParticles />
      </Canvas>
    </div>
  );
};

const RobotModel = ({ isTalking }: { isTalking: boolean }) => {
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.Mesh>(null);

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1e2030",
    roughness: 0.3,
    metalness: 0.8,
  }), []);

  const darkBodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#151825",
    roughness: 0.4,
    metalness: 0.7,
  }), []);

  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c8a24e",
    roughness: 0.2,
    metalness: 0.9,
    emissive: "#8b6914",
    emissiveIntensity: 0.15,
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#67e8f9",
    emissive: "#22d3ee",
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.3,
  }), []);

  const screenMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0c1020",
    roughness: 0.6,
    metalness: 0.5,
    transparent: true,
    opacity: 0.85,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Head subtle tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.5) * 0.04;
      headRef.current.rotation.x = Math.sin(t * 0.3) * 0.03;
    }

    // Arm sway
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(t * 0.8) * 0.12 + 0.3;
      leftArmRef.current.rotation.x = Math.sin(t * 0.6) * 0.05;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(t * 0.8 + 1) * -0.12 - 0.3;
      rightArmRef.current.rotation.x = Math.sin(t * 0.6 + 0.5) * 0.05;
    }

    // Eye blink (every ~5 seconds)
    const blinkCycle = t % 5;
    const blinkScale = blinkCycle > 4.85 && blinkCycle < 4.95 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.3);

    // Talking animation
    if (isTalking) {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = 1 + Math.sin(t * 8) * 0.3;
      if (rightEyeRef.current) rightEyeRef.current.scale.x = 1 + Math.sin(t * 8) * 0.3;
      if (mouthRef.current) mouthRef.current.scale.x = 1 + Math.sin(t * 12) * 0.4;
    } else {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1, 0.1);
      if (rightEyeRef.current) rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1, 0.1);
      if (mouthRef.current) mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1, 0.1);
    }

    // Antenna pulse
    if (antennaRef.current) {
      const pulse = (Math.sin(t * 3) + 1) * 0.5;
      (antennaRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + pulse * 2;
    }

    // Chest light pulse
    if (chestLightRef.current) {
      const pulse = (Math.sin(t * 2) + 1) * 0.5;
      (chestLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + pulse * 1.5;
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* === HEAD GROUP === */}
      <group ref={headRef} position={[0, 1.1, 0]}>
        {/* Antenna stem */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.35, 8]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.9} />
        </mesh>

        {/* Antenna ball */}
        <mesh ref={antennaRef} position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} roughness={0.1} />
        </mesh>

        {/* Antenna light */}
        <pointLight position={[0, 0.95, 0]} color="#22d3ee" intensity={0.5} distance={1.5} />

        {/* Head main body */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[1.1, 0.85, 0.8]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        {/* Head rounded top */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.0, 0.2, 0.7]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        {/* Face screen */}
        <mesh position={[0, 0.25, 0.41]}>
          <planeGeometry args={[0.85, 0.6]} />
          <meshStandardMaterial {...screenMaterial} />
        </mesh>

        {/* Face screen border */}
        <mesh position={[0, 0.25, 0.405]}>
          <boxGeometry args={[0.92, 0.67, 0.02]} />
          <meshStandardMaterial color="#2a2d40" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Left eye */}
        <mesh ref={leftEyeRef} position={[-0.2, 0.3, 0.42]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial {...eyeMaterial} />
        </mesh>
        <pointLight position={[-0.2, 0.3, 0.6]} color="#22d3ee" intensity={0.6} distance={1.5} />

        {/* Right eye */}
        <mesh ref={rightEyeRef} position={[0.2, 0.3, 0.42]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial {...eyeMaterial} />
        </mesh>
        <pointLight position={[0.2, 0.3, 0.6]} color="#22d3ee" intensity={0.6} distance={1.5} />

        {/* Eye pupils */}
        <mesh position={[-0.2, 0.3, 0.53]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0.2, 0.3, 0.53]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, 0.08, 0.42]}>
          <boxGeometry args={[0.25, 0.03, 0.02]} />
          <meshStandardMaterial color={isTalking ? "#22d3ee" : "#4b5563"} emissive={isTalking ? "#22d3ee" : "#000000"} emissiveIntensity={isTalking ? 1 : 0} />
        </mesh>

        {/* Ear pieces */}
        <mesh position={[-0.6, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.35, 0.25]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
        <mesh position={[0.6, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.35, 0.25]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* Top accent line */}
        <mesh position={[0, 0.63, 0.35]}>
          <boxGeometry args={[0.7, 0.02, 0.02]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* === NECK === */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.15, 8]} />
        <meshStandardMaterial {...goldMaterial} />
      </mesh>

      {/* === BODY === */}
      <group position={[0, 0, 0]}>
        {/* Main torso */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.9, 0.7, 0.65]} />
          <meshStandardMaterial {...darkBodyMaterial} />
        </mesh>

        {/* Torso top taper */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.7, 0.15, 0.55]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        {/* Chest light housing */}
        <mesh position={[0, 0.25, 0.34]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
          <meshStandardMaterial color="#1a1d30" roughness={0.5} metalness={0.7} />
        </mesh>

        {/* Chest light */}
        <mesh ref={chestLightRef} position={[0, 0.25, 0.36]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1} roughness={0.1} />
        </mesh>
        <pointLight position={[0, 0.25, 0.5]} color="#818cf8" intensity={0.4} distance={1.5} />

        {/* Belt line */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.95, 0.06, 0.7]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* Bottom torso */}
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.7, 0.25, 0.5]} />
          <meshStandardMaterial {...darkBodyMaterial} />
        </mesh>
      </group>

      {/* === LEFT ARM === */}
      <group ref={leftArmRef} position={[-0.55, 0.35, 0]}>
        {/* Shoulder joint */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* Upper arm */}
        <mesh position={[-0.05, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.35, 8]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        {/* Elbow joint */}
        <mesh position={[-0.05, -0.45, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        {/* Lower arm */}
        <mesh position={[-0.05, -0.65, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 8]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        {/* Hand */}
        <mesh position={[-0.05, -0.82, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightArmRef} position={[0.55, 0.35, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        <mesh position={[0.05, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.35, 8]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        <mesh position={[0.05, -0.45, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>

        <mesh position={[0.05, -0.65, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.3, 8]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>

        <mesh position={[0.05, -0.82, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial {...goldMaterial} />
        </mesh>
      </group>
    </group>
  );
};

const OrbitParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * Math.sin(theta) * 0.5;
      positions[i * 3 + 2] = radius * Math.sin(phi) * 0.5;

      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    return { positions, sizes };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#67e8f9"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default BuddyRobot;
