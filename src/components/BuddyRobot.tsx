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
        camera={{ position: [0, 0.6, 3.8], fov: 40 }}
        className="z-10"
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.0} color="#fff5ee" />
        <directionalLight position={[-2, 3, 3]} intensity={0.5} color="#e0f0ff" />
        <pointLight position={[0, 1, 4]} intensity={0.6} color="#ffffff" />
        <spotLight position={[0, 5, 2]} angle={0.4} penumbra={1} intensity={0.4} color="#fff" />
        <directionalLight position={[0, 0, -3]} intensity={0.3} color="#b0c4de" />

        <Float speed={1.8} rotationIntensity={0.1} floatIntensity={0.4} floatingRange={[-0.1, 0.1]}>
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
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  // Matte white body
  const whiteMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#f0ece4",
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  }), []);

  // Slightly warmer white for head
  const headMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#f2ede5",
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  }), []);

  // Panel line / seam material
  const seamMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#d5cfc5",
    roughness: 0.5,
    metalness: 0.1,
  }), []);

  // Dark joint / neck
  const darkMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#2a2d35",
    roughness: 0.4,
    metalness: 0.6,
    clearcoat: 0.3,
  }), []);

  // Eye socket dark ring
  const eyeSocketMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    roughness: 0.5,
    metalness: 0.3,
  }), []);

  // Eye lens - warm reddish amber like reference
  const eyeLensMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#cc4444",
    emissive: "#991111",
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.4,
  }), []);

  // Eye inner ring
  const eyeRingMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#333333",
    roughness: 0.3,
    metalness: 0.5,
  }), []);

  // Metallic silver for hand details
  const silverMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#c0c0c0",
    roughness: 0.2,
    metalness: 0.8,
    clearcoat: 0.5,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.4) * 0.035;
      headRef.current.rotation.x = Math.sin(t * 0.3) * 0.025;
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.04;
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = Math.sin(t * 0.6) * 0.08 + 0.15;
      leftArmRef.current.rotation.x = Math.sin(t * 0.4) * 0.05;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(t * 0.6 + 1) * -0.08 - 0.15;
      rightArmRef.current.rotation.x = Math.sin(t * 0.4 + 0.5) * 0.05;
    }

    // Eye blink
    const blinkCycle = t % 5;
    const blinkScale = blinkCycle > 4.85 && blinkCycle < 4.95 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.3);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.3);

    // Talking - eyes pulse, mouth widens
    if (isTalking && mouthRef.current) {
      mouthRef.current.scale.x = 1 + Math.sin(t * 10) * 0.3;
    } else if (mouthRef.current) {
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1, 0.1);
    }
  });

  return (
    <group position={[0, -0.15, 0]}>
      {/* === HEAD === */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {/* Main head - smooth egg/sphere shape */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.52, 48, 48]} />
          <meshPhysicalMaterial {...headMat} />
        </mesh>

        {/* Head top cap - slight seam */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.38, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
          <meshPhysicalMaterial color="#ede8df" roughness={0.35} metalness={0.05} clearcoat={0.3} clearcoatRoughness={0.4} />
        </mesh>

        {/* Head seam line */}
        <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.37, 0.006, 8, 48]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Side panel seam lines */}
        <mesh position={[-0.35, 0.15, 0.25]} rotation={[0, 0.6, Math.PI / 2]}>
          <boxGeometry args={[0.3, 0.005, 0.005]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>
        <mesh position={[0.35, 0.15, 0.25]} rotation={[0, -0.6, Math.PI / 2]}>
          <boxGeometry args={[0.3, 0.005, 0.005]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Forehead sensor dot */}
        <mesh position={[0, 0.42, 0.32]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* LEFT EYE */}
        <group ref={leftEyeRef} position={[-0.17, 0.18, 0.42]}>
          {/* Eye socket */}
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
            <meshStandardMaterial {...eyeSocketMat} />
          </mesh>
          {/* Eye outer ring */}
          <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.085, 0.012, 8, 32]} />
            <meshStandardMaterial {...eyeRingMat} />
          </mesh>
          {/* Lens */}
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 32]} />
            <meshStandardMaterial {...eyeLensMat} />
          </mesh>
          {/* Inner ring */}
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.006, 8, 24]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.025, 24]} />
            <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.4} />
          </mesh>
          {/* Specular highlight */}
          <mesh position={[0.02, 0.02, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.01, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          {/* Eye glow */}
          <pointLight position={[0, 0, 0.1]} color="#cc4444" intensity={0.3} distance={1} />
        </group>

        {/* RIGHT EYE */}
        <group ref={rightEyeRef} position={[0.17, 0.18, 0.42]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 32]} />
            <meshStandardMaterial {...eyeSocketMat} />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.085, 0.012, 8, 32]} />
            <meshStandardMaterial {...eyeRingMat} />
          </mesh>
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 32]} />
            <meshStandardMaterial {...eyeLensMat} />
          </mesh>
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.006, 8, 24]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.025, 24]} />
            <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.4} />
          </mesh>
          <mesh position={[-0.02, 0.02, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.01, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
          <pointLight position={[0, 0, 0.1]} color="#cc4444" intensity={0.3} distance={1} />
        </group>

        {/* MOUTH - subtle smile curve */}
        <mesh ref={mouthRef} position={[0, -0.02, 0.48]}>
          <torusGeometry args={[0.06, 0.008, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Cheek panel lines */}
        <mesh position={[-0.38, 0.05, 0.22]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.15, 0.005, 0.005]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>
        <mesh position={[0.38, 0.05, 0.22]} rotation={[0, -0.5, 0]}>
          <boxGeometry args={[0.15, 0.005, 0.005]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>
      </group>

      {/* === NECK === */}
      <group position={[0, 0.7, 0]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.16, 0.18, 16]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>
        {/* Neck rings */}
        <mesh position={[0, 0.05, 0]}>
          <torusGeometry args={[0.13, 0.01, 8, 24]} />
          <meshStandardMaterial color="#444" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <torusGeometry args={[0.15, 0.01, 8, 24]} />
          <meshStandardMaterial color="#444" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* === UPPER BODY === */}
      <group position={[0, 0.05, 0]}>
        {/* Chest - smooth rounded */}
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.44, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Mid torso */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.43, 0.38, 0.35, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Chest center seam */}
        <mesh position={[0, 0.35, 0.38]}>
          <boxGeometry args={[0.005, 0.25, 0.005]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Chest panel arc lines */}
        <mesh position={[0, 0.2, 0.01]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.4, 0.005, 8, 32, Math.PI * 0.6]} />
          <meshStandardMaterial {...seamMat} />
        </mesh>

        {/* Lower torso */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.38, 0.35, 0.15, 32]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Waist dark section */}
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.35, 0.32, 0.08, 32]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>
      </group>

      {/* === LEFT ARM === */}
      <group ref={leftArmRef} position={[-0.52, 0.42, 0]}>
        {/* Shoulder cap */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Upper arm */}
        <mesh position={[-0.02, -0.18, 0]}>
          <capsuleGeometry args={[0.065, 0.18, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Elbow */}
        <mesh position={[-0.02, -0.35, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>

        {/* Forearm */}
        <mesh position={[-0.02, -0.5, 0]}>
          <capsuleGeometry args={[0.055, 0.16, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        {/* Wrist */}
        <mesh position={[-0.02, -0.62, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.04, 12]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>

        {/* Hand palm */}
        <mesh position={[-0.02, -0.7, 0.01]}>
          <boxGeometry args={[0.09, 0.08, 0.04]} />
          <meshPhysicalMaterial {...silverMat} />
        </mesh>

        {/* Fingers */}
        {[[-0.03, 0], [0, 0], [0.03, 0]].map(([xOff, zOff], i) => (
          <group key={i}>
            <mesh position={[-0.02 + (xOff ?? 0), -0.78, 0.01 + (zOff ?? 0)]} rotation={[0.2, 0, (i - 1) * 0.15]}>
              <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
              <meshPhysicalMaterial {...silverMat} />
            </mesh>
            <mesh position={[-0.02 + (xOff ?? 0), -0.85, 0.02 + (zOff ?? 0)]} rotation={[0.3, 0, (i - 1) * 0.12]}>
              <capsuleGeometry args={[0.01, 0.035, 4, 8]} />
              <meshPhysicalMaterial {...darkMat} />
            </mesh>
          </group>
        ))}
        {/* Thumb */}
        <mesh position={[-0.06, -0.72, 0.02]} rotation={[0.1, 0, 0.5]}>
          <capsuleGeometry args={[0.013, 0.04, 4, 8]} />
          <meshPhysicalMaterial {...silverMat} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightArmRef} position={[0.52, 0.42, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        <mesh position={[0.02, -0.18, 0]}>
          <capsuleGeometry args={[0.065, 0.18, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        <mesh position={[0.02, -0.35, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>

        <mesh position={[0.02, -0.5, 0]}>
          <capsuleGeometry args={[0.055, 0.16, 8, 16]} />
          <meshPhysicalMaterial {...whiteMat} />
        </mesh>

        <mesh position={[0.02, -0.62, 0]}>
          <cylinderGeometry args={[0.045, 0.05, 0.04, 12]} />
          <meshPhysicalMaterial {...darkMat} />
        </mesh>

        <mesh position={[0.02, -0.7, 0.01]}>
          <boxGeometry args={[0.09, 0.08, 0.04]} />
          <meshPhysicalMaterial {...silverMat} />
        </mesh>

        {[[-0.03, 0], [0, 0], [0.03, 0]].map(([xOff, zOff], i) => (
          <group key={i}>
            <mesh position={[0.02 + (xOff ?? 0), -0.78, 0.01 + (zOff ?? 0)]} rotation={[0.2, 0, (i - 1) * -0.15]}>
              <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
              <meshPhysicalMaterial {...silverMat} />
            </mesh>
            <mesh position={[0.02 + (xOff ?? 0), -0.85, 0.02 + (zOff ?? 0)]} rotation={[0.3, 0, (i - 1) * -0.12]}>
              <capsuleGeometry args={[0.01, 0.035, 4, 8]} />
              <meshPhysicalMaterial {...darkMat} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.06, -0.72, 0.02]} rotation={[0.1, 0, -0.5]}>
          <capsuleGeometry args={[0.013, 0.04, 4, 8]} />
          <meshPhysicalMaterial {...silverMat} />
        </mesh>
      </group>
    </group>
  );
};

const OrbitParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      pos[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.sin(phi) * 0.5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#67e8f9" transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

export default BuddyRobot;
