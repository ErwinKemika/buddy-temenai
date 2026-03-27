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
            <div className="w-[180px] md:w-[220px] lg:w-[260px] origin-center" style={{ maxHeight: 400 }}>
              <BuddyRobot buddyState="idle" enableEyeTracking />
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
            <div className="text-center mb-8 relative">
              {/* Teal radial glow behind text */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[120px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse, rgba(0,255,229,0.15), transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <p
                className="glitch-text font-orbitron uppercase text-white relative"
                style={{
                  fontSize: "clamp(22px, 5vw, 36px)",
                  fontWeight: 900,
                  letterSpacing: "4px",
                  textShadow: "0 0 20px rgba(0, 255, 229, 0.6)",
                }}
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
              className="w-full max-w-[280px] md:max-w-[240px] lg:max-w-[200px] space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: SMOOTH_EASE }}
            >
              {/* Kenalan button — glossy gradient with glow border */}
              <button
                onClick={onKenalan}
                className="group w-full relative rounded-[18px] p-[1.5px] transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #c084fc, #7C3AED, #3b82f6, #00D4FF)",
                  boxShadow: "0 0 24px rgba(124,58,237,0.4), 0 0 48px rgba(0,212,255,0.2), inset 0 0 12px rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="w-full py-3 md:py-2.5 rounded-[16.5px] font-bold text-sm text-white text-center relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.7), rgba(99,102,241,0.6), rgba(56,189,248,0.5))",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Glass shine overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
                      borderRadius: "inherit",
                    }}
                  />
                  {/* Corner sparkle accents */}
                  <div className="absolute top-1 right-4 w-1 h-1 rounded-full bg-white/70" style={{ boxShadow: "0 0 6px 2px rgba(255,255,255,0.5)" }} />
                  <div className="absolute bottom-2 left-6 w-0.5 h-0.5 rounded-full bg-white/50" style={{ boxShadow: "0 0 4px 1px rgba(255,255,255,0.4)" }} />
                  <span className="relative z-10 drop-shadow-sm">Kenalan, yuk! 👋</span>
                </div>
              </button>

              {/* Masuk button — dark glass with cyan border glow */}
              <button
                onClick={onMasuk}
                className="group w-full relative rounded-[18px] p-[1.5px] transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.5), rgba(99,102,241,0.4), rgba(56,189,248,0.5))",
                  boxShadow: "0 0 20px rgba(0,212,255,0.15), 0 0 40px rgba(99,102,241,0.1)",
                }}
              >
                <div
                  className="w-full py-4 rounded-[16.5px] font-semibold text-base text-white/90 text-center relative overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {/* Subtle glass shine */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 35%)",
                      borderRadius: "inherit",
                    }}
                  />
                  {/* Corner sparkle accents */}
                  <div className="absolute top-2 left-5 w-0.5 h-0.5 rounded-full bg-white/40" style={{ boxShadow: "0 0 4px 1px rgba(0,212,255,0.5)" }} />
                  <div className="absolute bottom-2 right-8 w-0.5 h-0.5 rounded-full bg-white/30" style={{ boxShadow: "0 0 3px 1px rgba(0,212,255,0.4)" }} />
                  <span className="relative z-10">Masuk</span>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
