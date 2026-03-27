import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BuddyRobot from "@/components/BuddyRobot";

interface SplashScreenProps {
  onMasuk: () => void;
  onKenalan: () => void;
}

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1.5,
    delay: Math.random() * 0.8,
    color: Math.random() > 0.5 ? "#00D4FF" : "#7C3AED",
  }));
}

const SplashScreen = ({ onMasuk, onKenalan }: SplashScreenProps) => {
  const [phase, setPhase] = useState(0);
  const [typewriterLine1, setTypewriterLine1] = useState("");
  const [typewriterLine2, setTypewriterLine2] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  const particles = useMemo(() => generateParticles(30), []);

  const line1 = "Hai.. aku Buddy";
  const line2 = "temen aktivitas kamu ✨";

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= line1.length) {
        setTypewriterLine1(line1.slice(0, i));
      } else {
        const j = i - line1.length;
        if (j <= line2.length) {
          setTypewriterLine2(line2.slice(0, j));
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 500);
        }
      }
    }, 55);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#050814" }}
    >
      {/* Grid lines */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 0.08 : 0 }}
        transition={{ duration: 1.2, ease: SMOOTH_EASE }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Particles */}
      {particles.map((p) => {
        const isConverging = phase >= 1;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: phase >= 2 ? 0 : [0, 1, 0.6, 1],
              scale: phase >= 2 ? 0 : 1,
              x: isConverging ? `${50 - p.x}vw` : 0,
              y: isConverging ? `${50 - p.y}vh` : 0,
            }}
            transition={{
              opacity: { duration: 0.6, delay: p.delay * 0.5, ease: SMOOTH_EASE },
              scale: { duration: 0.5, ease: SMOOTH_EASE },
              x: { duration: 1.2, delay: p.delay * 0.3, ease: "easeOut" },
              y: { duration: 1.2, delay: p.delay * 0.3, ease: "easeOut" },
            }}
          />
        );
      })}

      {/* Shockwave rings */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && [0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border pointer-events-none"
            style={{
              borderColor: i === 0 ? "rgba(0,212,255,0.5)" : "rgba(124,58,237,0.3)",
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 600, height: 600, opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: delay + 0.4,
              ease: SMOOTH_EASE,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Center flash */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              translateX: "-50%",
              translateY: "-50%",
              background: "radial-gradient(circle, rgba(0,212,255,0.8), rgba(124,58,237,0.4), transparent 70%)",
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ width: 200, height: 200, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.6, ease: SMOOTH_EASE }}
          />
        )}
      </AnimatePresence>

      {/* Buddy reveal — phase 2+ */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Cyan ambient glow behind Buddy */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
              width: 300,
                height: 300,
                background: "radial-gradient(circle, rgba(0,212,255,0.25), rgba(124,58,237,0.1), transparent 70%)",
                filter: "blur(30px)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Scanning line */}
            <motion.div
              className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)",
              }}
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: "100%", opacity: [0, 0.8, 0.8, 0] }}
              transition={{ duration: 0.8, delay: 0.3, ease: SMOOTH_EASE }}
            />

            {/* Buddy Robot (the CSS-drawn purple robot) */}
            <div className="scale-[0.9] origin-center" style={{ maxHeight: 300 }}>
              <BuddyRobot buddyState="idle" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text + CTA — phase 3 */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            className="relative z-10 mt-6 flex flex-col items-center px-6 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: SMOOTH_EASE }}
          >
            <div className="text-center mb-8">
              <p
                className="glitch-text text-[28px] font-bold text-white font-orbitron"
                data-text={typewriterLine1}
              >
                {typewriterLine1}
                {typewriterLine2 === "" && showCursor && (
                  <span className="animate-pulse text-[#00D4FF]">|</span>
                )}
              </p>
              {typewriterLine2 && (
                <p className="text-lg text-gray-300 mt-1 font-sans">
                  {typewriterLine2}
                  {showCursor && <span className="animate-pulse text-[#00D4FF]">|</span>}
                </p>
              )}
            </div>

            <motion.div
              className="w-full max-w-xs space-y-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: SMOOTH_EASE }}
            >
              <button
                onClick={onKenalan}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #00D4FF)",
                  boxShadow: "0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(124,58,237,0.2)",
                }}
              >
                Kenalan, yuk! 👋
              </button>

              <button
                onClick={onMasuk}
                className="w-full py-3.5 rounded-2xl font-medium text-sm text-gray-300 transition-all active:scale-95"
                style={{
                  border: "1px solid rgba(0,212,255,0.3)",
                  background: "rgba(0,212,255,0.05)",
                }}
              >
                Masuk
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
