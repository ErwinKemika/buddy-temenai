interface BuddyRobotProps {
  isTalking?: boolean;
}

const BuddyRobot = ({ isTalking = false }: BuddyRobotProps) => {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="orbit-ring w-[280px] h-[280px] animate-orbit opacity-40" />
        <div className="orbit-ring w-[380px] h-[380px] animate-orbit-reverse opacity-25" />
        <div className="orbit-ring w-[460px] h-[460px] animate-orbit opacity-15" />
      </div>

      {/* Orbit dots */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-orbit" style={{ width: 280, height: 280 }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent animate-twinkle" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/60 animate-twinkle" style={{ animationDelay: '1s' }} />
        </div>
        <div className="animate-orbit-reverse absolute" style={{ width: 380, height: 380 }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent/60 animate-twinkle" style={{ animationDelay: '0.5s' }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-twinkle" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Robot */}
      <div className="animate-float relative z-10">
        {/* Ambient glow behind robot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />

        {/* Antenna */}
        <div className="flex flex-col items-center mb-0 relative z-10">
          <div className="w-4 h-4 rounded-full bg-accent animate-antenna" />
          <div className="w-1 h-5 bg-gradient-to-b from-accent/60 to-muted-foreground/40" />
        </div>

        {/* Head */}
        <div className="relative animate-head-tilt">
          <div className="w-40 h-32 rounded-[2.5rem] bg-gradient-to-b from-secondary to-card border border-border/50 relative overflow-visible shadow-2xl">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2.5rem] bg-gradient-to-r from-primary/40 via-accent/60 to-primary/40" />

            {/* Face screen area */}
            <div className="absolute inset-3 top-5 bottom-4 rounded-[1.5rem] bg-background/60 border border-border/30 flex items-center justify-center">
              {/* Eyes */}
              <div className="flex gap-8">
                <Eye isTalking={isTalking} delay={0} />
                <Eye isTalking={isTalking} delay={0.05} />
              </div>
            </div>

            {/* Mouth - below eyes */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  isTalking
                    ? "w-10 bg-accent animate-pulse"
                    : "w-5 bg-muted-foreground/30"
                }`}
              />
            </div>

            {/* Ear accents - golden */}
            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full bg-gradient-to-r from-buddy-gold to-buddy-gold/70 shadow-md" />
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full bg-gradient-to-l from-buddy-gold to-buddy-gold/70 shadow-md" />
          </div>
        </div>

        {/* Neck */}
        <div className="flex justify-center">
          <div className="w-6 h-3 bg-gradient-to-b from-secondary to-muted-foreground/30 rounded-b-md" />
        </div>

        {/* Body */}
        <div className="relative flex justify-center">
          {/* Left arm */}
          <div className="absolute -left-10 top-2 animate-arm-left">
            <div className="w-3 h-12 bg-gradient-to-b from-secondary to-card rounded-full border border-border/30" />
            {/* Joint */}
            <div className="w-4 h-4 rounded-full bg-buddy-gold shadow-sm mx-auto -mt-1" />
            {/* Hand */}
            <div className="w-5 h-3 rounded-full bg-buddy-gold/80 mx-auto mt-0.5" />
          </div>

          {/* Right arm */}
          <div className="absolute -right-10 top-2 animate-arm-right">
            <div className="w-3 h-12 bg-gradient-to-b from-secondary to-card rounded-full border border-border/30" />
            {/* Joint */}
            <div className="w-4 h-4 rounded-full bg-buddy-gold shadow-sm mx-auto -mt-1" />
            {/* Hand */}
            <div className="w-5 h-3 rounded-full bg-buddy-gold/80 mx-auto mt-0.5" />
          </div>

          {/* Torso */}
          <div className="w-28 h-20 rounded-[1.5rem] rounded-t-xl bg-gradient-to-b from-card to-secondary border border-border/40 relative shadow-xl">
            {/* Chest light */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full bg-primary/60 ${isTalking ? 'animate-pulse' : 'animate-antenna'}`} />
            </div>
            {/* Body lines */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <div className="w-8 h-0.5 rounded-full bg-border/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Eye = ({ isTalking, delay }: { isTalking: boolean; delay: number }) => {
  return (
    <div
      className={`w-8 h-8 rounded-full bg-gradient-to-b from-accent to-buddy-cyan-glow flex items-center justify-center transition-all duration-200 ${
        isTalking ? "animate-talk" : "animate-blink"
      } animate-eye-glow`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-3 h-3 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default BuddyRobot;
