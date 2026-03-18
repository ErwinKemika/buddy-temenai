import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="orbit-ring w-[280px] h-[280px] animate-orbit opacity-30" />
        <div className="orbit-ring w-[380px] h-[380px] animate-orbit-reverse opacity-20" />
      </div>

      <Canvas
        camera={{ position: [0, 0.3, 4.2], fov: 42 }}
        className="z-10"
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: "transparent" }}
      >
        {/* Lighting setup for white glossy robot */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, 3, 2]} intensity={0.6} color="#67e8f9" />
        <pointLight position={[0, 0, 4]} intensity={0.8} color="#a5f3fc" />
        <spotLight position={[0, 6, 3]} angle={0.3} penumbra={1} intensity={0.6} color="#e0f2fe" />
        {/* Rim light from behind */}
        <directionalLight position={[0, 1, -3]} intensity={0.5} color="#22d3ee" />

        <Float
          speed={2}
          rotationIntensity={0.12}
          floatIntensity={0.5}
          floatingRange={[-0.12, 0.12]}
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
  const antennaRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.Mesh>(null);

  // White glossy body material
  const whiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e8edf5",
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  }), []);

  // Slightly darker white for depth
  const lightGreyMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#d1d5e0",
    roughness: 0.2,
    metalness: 0.15,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }), []);

  // Dark visor / screen
  const visorMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#0a1628",
    roughness: 0.05,
    metalness: 0.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1.0,
  }), []);

  // Cyan accent
  const cyanMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#22d3ee",
    emissive: "#22d3ee",
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.3,
  }), []);

  // Cyan glow for eyes
  const eyeGlowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#67e8f9",
    emissive: "#22d3ee",
    emissiveIntensity: 2.5,
    roughness: 0.05,
    metalness: 0.2,
  }), []);

  // Dark hand/joint material
  const darkJointMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#1a1f2e",
    roughness: 0.3,
    metalness: 0.7,
    clearcoat: 0.5,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Head subtle movement
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.5) * 0.04;
      headRef.current.rotation.x = Math.sin(t * 0.3) * 0.03;
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.03;
    }

    // Arm sway
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(t * 0.7) * 0.1 + 0.25;
      leftArmRef.current.rotation.x = Math.sin(t * 0.5) * 0.06;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(t * 0.7 + 1) * -0.1 - 0.25;
      rightArmRef.current.rotation.x = Math.sin(t * 0.5 + 0.5) * 0.06;
    }

    // Eye blink
    const blinkCycle = t % 5;
    const blinkScale = blinkCycle > 4.85 && blinkCycle < 4.95 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.3);

    // Talking
    if (isTalking) {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = 1 + Math.sin(t * 8) * 0.25;
      if (rightEyeRef.current) rightEyeRef.current.scale.x = 1 + Math.sin(t * 8) * 0.25;
    } else {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1, 0.1);
      if (rightEyeRef.current) rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1, 0.1);
    }

    // Antenna pulse
    if (antennaRef.current) {
      const pulse = (Math.sin(t * 3) + 1) * 0.5;
      (antennaRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + pulse * 2;
    }

    // Chest light
    if (chestLightRef.current) {
      const pulse = (Math.sin(t * 2) + 1) * 0.5;
      (chestLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + pulse * 1.5;
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* === HEAD === */}
      <group ref={headRef} position={[0, 1.15, 0]}>
        {/* Helmet - rounded dome shape */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.55, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Head lower part */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.55, 0.5, 0.35, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Visor / face screen - curved */}
        <mesh position={[0, 0.28, 0.15]}>
          <sphereGeometry args={[0.48, 32, 32, -Math.PI * 0.4, Math.PI * 0.8, Math.PI * 0.2, Math.PI * 0.45]} />
          <meshPhysicalMaterial {...visorMat} />
        </mesh>

        {/* Cyan accent line around visor top */}
        <mesh position={[0, 0.5, 0.1]}>
          <torusGeometry args={[0.42, 0.012, 8, 32, Math.PI]} />
          <meshStandardMaterial {...cyanMat} />
        </mesh>

        {/* Cyan accent lines on helmet sides */}
        <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.56, 0.008, 8, 48]} />
          <meshStandardMaterial {...cyanMat} emissiveIntensity={0.8} />
        </mesh>

        {/* Left eye */}
        <mesh ref={leftEyeRef} position={[-0.18, 0.3, 0.42]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial {...eyeGlowMat} />
        </mesh>
        <pointLight position={[-0.18, 0.3, 0.55]} color="#22d3ee" intensity={1} distance={2} />

        {/* Right eye */}
        <mesh ref={rightEyeRef} position={[0.18, 0.3, 0.42]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial {...eyeGlowMat} />
        </mesh>
        <pointLight position={[0.18, 0.3, 0.55]} color="#22d3ee" intensity={1} distance={2} />

        {/* Eye inner bright spots */}
        <mesh position={[-0.18, 0.3, 0.52]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.18, 0.3, 0.52]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>

        {/* Ear accents - cyan glowing rings */}
        <mesh position={[-0.55, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial {...cyanMat} />
        </mesh>
        <mesh position={[0.55, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial {...cyanMat} />
        </mesh>
      </group>

      {/* === NECK === */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.12, 16]} />
        <meshPhysicalMaterial {...darkJointMat} />
      </mesh>
      {/* Neck ring accent */}
      <mesh position={[0, 0.58, 0]}>
        <torusGeometry args={[0.14, 0.015, 8, 24]} />
        <meshStandardMaterial {...cyanMat} emissiveIntensity={0.6} />
      </mesh>

      {/* === BODY === */}
      <group position={[0, 0, 0]}>
        {/* Upper torso - rounded */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.42, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Main torso */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.42, 0.38, 0.45, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Lower torso */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.2, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Belt / waist accent */}
        <mesh position={[0, -0.05, 0]}>
          <torusGeometry args={[0.4, 0.02, 8, 32]} />
          <meshStandardMaterial {...cyanMat} emissiveIntensity={0.8} />
        </mesh>

        {/* Chest center accent - glowing cyan strip */}
        <mesh ref={chestLightRef} position={[0, 0.18, 0.38]}>
          <boxGeometry args={[0.2, 0.04, 0.02]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} roughness={0.1} />
        </mesh>
        <pointLight position={[0, 0.18, 0.5]} color="#22d3ee" intensity={0.5} distance={1.5} />

        {/* Bottom glow ring */}
        <mesh position={[0, -0.28, 0]}>
          <torusGeometry args={[0.38, 0.025, 8, 32]} />
          <meshStandardMaterial {...cyanMat} emissiveIntensity={1.2} />
        </mesh>
        <pointLight position={[0, -0.35, 0]} color="#22d3ee" intensity={0.8} distance={2} />
      </group>

      {/* === LEFT ARM === */}
      <group ref={leftArmRef} position={[-0.5, 0.32, 0]}>
        {/* Shoulder */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...lightGreyMat} />
        </mesh>

        {/* Upper arm */}
        <mesh position={[-0.03, -0.2, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Elbow joint */}
        <mesh position={[-0.03, -0.38, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>

        {/* Lower arm */}
        <mesh position={[-0.03, -0.55, 0]}>
          <capsuleGeometry args={[0.05, 0.18, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Hand */}
        <mesh position={[-0.03, -0.72, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>

        {/* Fingers */}
        <mesh position={[-0.06, -0.8, 0.02]} rotation={[0.3, 0, 0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
        <mesh position={[-0.02, -0.81, 0.03]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
        <mesh position={[0.02, -0.8, 0.02]} rotation={[0.3, 0, -0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightArmRef} position={[0.5, 0.32, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial {...lightGreyMat} />
        </mesh>

        <mesh position={[0.03, -0.2, 0]}>
          <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        <mesh position={[0.03, -0.38, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>

        <mesh position={[0.03, -0.55, 0]}>
          <capsuleGeometry args={[0.05, 0.18, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        <mesh position={[0.03, -0.72, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>

        {/* Fingers */}
        <mesh position={[0.06, -0.8, 0.02]} rotation={[0.3, 0, -0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
        <mesh position={[0.02, -0.81, 0.03]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
        <mesh position={[-0.02, -0.8, 0.02]} rotation={[0.3, 0, 0.2]}>
          <capsuleGeometry args={[0.015, 0.06, 4, 8]} />
          <meshPhysicalMaterial {...darkJointMat} />
        </mesh>
      </group>
    </group>
  );
};

const OrbitParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      pos[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = radius * Math.sin(phi) * 0.5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#67e8f9"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default BuddyRobot;
