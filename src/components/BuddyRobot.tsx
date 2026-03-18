import { useState, useEffect } from "react";

interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex justify-center py-4">
      <div className="animate-breathe">
        {/* Robot Head */}
        <div className="relative w-36 h-32 rounded-[2.5rem] bg-gradient-to-b from-card to-muted shadow-lg border border-border overflow-hidden">
          {/* Cyan accent stripe on top */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-buddy-cyan/60 via-buddy-cyan to-buddy-cyan/60" />
          
          {/* Antenna */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-buddy-cyan buddy-glow-sm" />
            <div className="w-0.5 h-3 bg-border" />
          </div>

          {/* Eyes */}
          <div className="flex justify-center gap-8 mt-10">
            <Eye isTalking={isTalking} delay={0} />
            <Eye isTalking={isTalking} delay={0.05} />
          </div>

          {/* Mouth */}
          <div className="flex justify-center mt-4">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isTalking
                  ? "w-8 bg-buddy-cyan animate-pulse"
                  : "w-5 bg-muted-foreground/30"
              }`}
            />
          </div>

          {/* Ear accents */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-buddy-cyan/40" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-l-full bg-buddy-cyan/40" />
        </div>
      </div>
    </div>
  );
};

const Eye = ({ isTalking, delay }: { isTalking: boolean; delay: number }) => {
  return (
    <div
      className={`w-7 h-7 rounded-full bg-buddy-cyan buddy-glow-sm flex items-center justify-center transition-all duration-200 ${
        isTalking ? "animate-talk" : "animate-blink"
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-3 h-3 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default BuddyRobot;
