interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex justify-center py-3 shrink-0">
      <div className="animate-breathe">
        {/* Robot Head */}
        <div className="relative w-28 h-24 rounded-[2rem] bg-gradient-to-b from-card to-muted shadow-lg border border-border overflow-visible">
          {/* Cyan accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[2rem] bg-gradient-to-r from-buddy-cyan/60 via-buddy-cyan to-buddy-cyan/60" />
          
          {/* Antenna */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-buddy-cyan buddy-glow-sm" />
            <div className="w-0.5 h-2.5 bg-border" />
          </div>

          {/* Eyes */}
          <div className="flex justify-center gap-6 mt-7">
            <Eye isTalking={isTalking} delay={0} />
            <Eye isTalking={isTalking} delay={0.05} />
          </div>

          {/* Mouth */}
          <div className="flex justify-center mt-3">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                isTalking
                  ? "w-7 bg-buddy-cyan animate-pulse"
                  : "w-4 bg-muted-foreground/30"
              }`}
            />
          </div>

          {/* Ear accents */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-buddy-cyan/40" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-buddy-cyan/40" />
        </div>
      </div>
    </div>
  );
};

const Eye = ({ isTalking, delay }: { isTalking: boolean; delay: number }) => {
  return (
    <div
      className={`w-6 h-6 rounded-full bg-buddy-cyan buddy-glow-sm flex items-center justify-center transition-all duration-200 ${
        isTalking ? "animate-talk" : "animate-blink"
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default BuddyRobot;