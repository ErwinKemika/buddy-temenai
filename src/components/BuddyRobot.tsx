import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="orbit-ring w-[280px] h-[280px] animate-orbit opacity-30" />
        <div className="orbit-ring w-[380px] h-[380px] animate-orbit-reverse opacity-20" />
      </div>

      <Canvas
        camera={{ position: [0, 0.3, 3.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-2, 3, 3]} intensity={0.5} color="#a0d8ef" />
        <pointLight position={[0, 0.5, 4]} intensity={0.6} color="#ffffff" />
        <directionalLight position={[0, 2, -2]} intensity={0.3} color="#6090c0" />

        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
          <RobotModel isTalking={isTalking} />
        </Float>

        <OrbitParticles />
      </Canvas>
    </div>
  );
};

const RobotModel = ({ isTalking }: { isTalking: boolean }) => {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const antennaLightRef = useRef<THREE.Mesh>(null);

  // White matte body
  const whiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e8ecf0",
    roughness: 0.35,
    metalness: 0.08,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  }), []);

  // Slightly lighter white for helmet top
  const helmetTopMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#edf1f5",
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }), []);

  // Dark visor
  const visorMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#0a1525",
    roughness: 0.05,
    metalness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  }), []);

  // Dark grey for joints/details
  const darkMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#2a3040",
    roughness: 0.3,
    metalness: 0.6,
    clearcoat: 0.4,
  }), []);

  // Headphone dark material
  const headphoneMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#1e2535",
    roughness: 0.25,
    metalness: 0.5,
    clearcoat: 0.6,
  }), []);

  // Cyan glow material
  const cyanGlow = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#40e0f0",
    emissive: "#22d3ee",
    emissiveIntensity: 2.5,
    roughness: 0.05,
    metalness: 0.2,
  }), []);

  // Seam / panel line
  const seamMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c8ccd2",
    roughness: 0.5,
    metalness: 0.1,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.4) * 0.04;
      headRef.current.rotation.x = Math.sin(t * 0.3) * 0.025;
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.04;
    }

    // Eye blink
    const blinkCycle = t % 5;
    const blinkScale = blinkCycle > 4.85 && blinkCycle < 4.95 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.3);

    // Talking
    if (isTalking) {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = 1 + Math.sin(t * 8) * 0.2;
      if (rightEyeRef.current) rightEyeRef.current.scale.x = 1 + Math.sin(t * 8 + 0.2) * 0.2;
      if (mouthRef.current) mouthRef.current.scale.x = 1 + Math.sin(t * 10) * 0.3;
    } else {
      if (leftEyeRef.current) leftEyeRef.current.scale.x = THREE.MathUtils.lerp(leftEyeRef.current.scale.x, 1, 0.1);
      if (rightEyeRef.current) rightEyeRef.current.scale.x = THREE.MathUtils.lerp(rightEyeRef.current.scale.x, 1, 0.1);
      if (mouthRef.current) mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1, 0.1);
    }

    // Antenna pulse
    if (antennaLightRef.current) {
      const p = (Math.sin(t * 3) + 1) * 0.5;
      (antennaLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + p * 2;
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* === HEAD === */}
      <group ref={headRef} position={[0, 1.0, 0]}>

        {/* --- Antenna --- */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.015, 0.025, 0.25, 8]} />
          <meshStandardMaterial color="#8090a0" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh ref={antennaLightRef} position={[0, 0.87, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial {...cyanGlow} />
        </mesh>
        <pointLight position={[0, 0.87, 0]} color="#22d3ee" intensity={0.8} distance={1.5} />

        {/* --- Helmet top dome --- */}
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.48, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshPhysicalMaterial {...helmetTopMat} />
        </mesh>

        {/* Helmet top seam line */}
        <mesh position={[0, 0.55, 0]}>
          <torusGeometry args={[0.3, 0.005, 8, 32]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Panel line center vertical on top */}
        <mesh position={[0, 0.58, 0.05]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.004, 0.15, 0.004]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* --- Helmet lower (wider) --- */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.56, 48, 48, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.55]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* --- Visor / Face screen --- */}
        <mesh position={[0, 0.18, 0.2]}>
          <sphereGeometry args={[0.46, 48, 32, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.2, Math.PI * 0.42]} />
          <meshPhysicalMaterial {...visorMat} />
        </mesh>

        {/* Visor border frame */}
        <mesh position={[0, 0.32, 0.38]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.32, 0.012, 8, 48, Math.PI]} />
          <meshStandardMaterial color="#d0d4da" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* --- Eyebrow dots --- */}
        <mesh position={[-0.12, 0.4, 0.44]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0.4, 0.44]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>

        {/* --- Left Eye (glowing cyan) --- */}
        <group ref={leftEyeRef} position={[-0.14, 0.22, 0.46]}>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial {...cyanGlow} />
          </mesh>
          {/* Inner bright core */}
          <mesh position={[0.02, 0.02, 0.05]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
          </mesh>
          <pointLight position={[0, 0, 0.15]} color="#22d3ee" intensity={1.2} distance={1.5} />
        </group>

        {/* --- Right Eye (glowing cyan) --- */}
        <group ref={rightEyeRef} position={[0.14, 0.22, 0.46]}>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial {...cyanGlow} />
          </mesh>
          <mesh position={[-0.02, 0.02, 0.05]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
          </mesh>
          <pointLight position={[0, 0, 0.15]} color="#22d3ee" intensity={1.2} distance={1.5} />
        </group>

        {/* --- Smile (cyan glow) --- */}
        <mesh ref={mouthRef} position={[0, 0.04, 0.48]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial
            color={isTalking ? "#40e0f0" : "#30c8d8"}
            emissive="#22d3ee"
            emissiveIntensity={isTalking ? 2 : 1}
            roughness={0.1}
          />
        </mesh>

        {/* --- Left ear (headphone) --- */}
        <group position={[-0.54, 0.2, 0]}>
          {/* Headphone cup */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
            <meshPhysicalMaterial {...headphoneMat} />
          </mesh>
          {/* Cup inner ring */}
          <mesh position={[-0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.1, 0.015, 8, 24]} />
            <meshStandardMaterial {...cyanGlow} emissiveIntensity={1} />
          </mesh>
          <pointLight position={[-0.1, 0, 0]} color="#22d3ee" intensity={0.4} distance={1} />
        </group>

        {/* --- Right ear (headphone) --- */}
        <group position={[0.54, 0.2, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
            <meshPhysicalMaterial {...headphoneMat} />
          </mesh>
          <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.1, 0.015, 8, 24]} />
            <meshStandardMaterial {...cyanGlow} emissiveIntensity={1} />
          </mesh>
          <pointLight position={[0.1, 0, 0]} color="#22d3ee" intensity={0.4} distance={1} />
        </group>

        {/* Headband connecting ears over helmet */}
        <mesh position={[0, 0.48, -0.05]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.52, 0.02, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#c0c8d0" roughness={0.3} metalness={0.3} />
        </mesh>
      </group>

      {/* === NECK === */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.12, 12]} />
        <meshPhysicalMaterial {...darkMat} />
      </mesh>

      {/* === BODY (upper portion visible) === */}
      <group position={[0, 0.1, 0]}>
        {/* Shoulder area */}
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.38, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Upper chest */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.38, 0.34, 0.3, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Chest seam line */}
        <mesh position={[0, 0.2, 0.34]}>
          <boxGeometry args={[0.004, 0.2, 0.004]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Collar ring dark */}
        <mesh position={[0, 0.38, 0]}>
          <torusGeometry args={[0.28, 0.02, 8, 32]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>

        {/* Cyan accent dots on chest */}
        <mesh position={[-0.2, 0.05, 0.32]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial {...cyanGlow} emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0.2, 0.05, 0.32]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial {...cyanGlow} emissiveIntensity={1.2} />
        </mesh>

        {/* Lower body */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.34, 0.36, 0.15, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>
      </group>
    </group>
  );
};

const OrbitParticles = () => {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 60;
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 3;
      const t = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * Math.PI;
      p[i * 3] = r * Math.cos(ph) * Math.cos(t);
      p[i * 3 + 1] = r * Math.cos(ph) * Math.sin(t) * 0.5;
      p[i * 3 + 2] = r * Math.sin(ph) * 0.5;
    }
    return p;
  }, []);

  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.02; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#67e8f9" transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

export default BuddyRobot;
