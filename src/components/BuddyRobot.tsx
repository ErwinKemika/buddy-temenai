import { useState, useEffect } from "react";
import buddyImage from "@/assets/buddy-robot.png";

interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="orbit-ring w-[280px] h-[280px] animate-orbit opacity-30" />
        <div className="orbit-ring w-[380px] h-[380px] animate-orbit-reverse opacity-20" />
        <div className="orbit-ring w-[460px] h-[460px] animate-orbit opacity-10" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/10 blur-[80px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-40 h-40 rounded-full bg-primary/8 blur-[60px]" />

      {/* Robot image with animations */}
      <div className={`relative z-10 animate-float ${isTalking ? 'animate-talk-bounce' : ''}`}>
        {/* Glow behind robot */}
        <div className="absolute inset-0 scale-90 rounded-full bg-accent/15 blur-2xl" />
        
        <img
          src={buddyImage}
          alt="Buddy Robot"
          className="w-64 h-64 object-contain relative z-10 drop-shadow-[0_0_30px_hsl(var(--buddy-cyan)/0.3)]"
          style={{
            filter: isTalking
              ? 'drop-shadow(0 0 40px hsl(200 90% 55% / 0.5))'
              : 'drop-shadow(0 0 25px hsl(200 90% 55% / 0.25))',
            transition: 'filter 0.3s ease',
          }}
        />

        {/* Eye glow overlays - positioned on the robot's eyes */}
        <div className="absolute top-[36%] left-[32%] w-6 h-6 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--buddy-cyan) / 0.4) 0%, transparent 70%)',
            animation: isTalking ? 'eye-pulse 0.5s ease-in-out infinite' : 'eye-breathe 3s ease-in-out infinite',
            transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
            transition: 'transform 0.1s ease',
          }}
        />
        <div className="absolute top-[36%] right-[32%] w-6 h-6 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--buddy-cyan) / 0.4) 0%, transparent 70%)',
            animation: isTalking ? 'eye-pulse 0.5s ease-in-out infinite 0.05s' : 'eye-breathe 3s ease-in-out infinite 0.5s',
            transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
            transition: 'transform 0.1s ease',
          }}
        />

        {/* Antenna glow */}
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--buddy-cyan) / 0.6) 0%, transparent 70%)',
            animation: 'antenna-pulse 3s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

export default BuddyRobot;
