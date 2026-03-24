import { BuddyState } from "@/hooks/useChat";

interface BuddyRobotProps {
  buddyState: BuddyState;
  opacity?: number;
}

const BuddyRobot = ({ buddyState }: BuddyRobotProps) => {
  const isTalking = buddyState === "speaking" || buddyState === "thinking";
  const isListening = false;
  const isSpeaking = buddyState === "speaking";

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
    >
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
      <div className={`relative z-10 ${isSpeaking ? 'animate-float-fast' : 'animate-float'}`}>
        {/* Ambient glow behind robot */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
          isSpeaking ? 'bg-accent/15' : isListening ? 'bg-green-500/10' : 'bg-primary/8'
        }`} />

        {/* Antenna */}
        <div className="flex flex-col items-center mb-0 relative z-10">
          <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${
            isSpeaking ? 'bg-accent animate-pulse' : isListening ? 'bg-green-400 animate-pulse' : 'bg-accent/70 animate-antenna'
          }`} />
          <div className="w-1 h-5 bg-gradient-to-b from-accent/40 to-buddy-body-light" />
        </div>

        {/* Head */}
        <div className="relative animate-head-tilt">
          <div className="w-40 h-32 rounded-[2.5rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative overflow-visible shadow-2xl shadow-primary/5">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2.5rem] bg-gradient-to-r from-primary/25 via-accent/35 to-primary/25" />

            {/* Face screen area */}
            <div className="absolute inset-3 top-5 bottom-4 rounded-[1.5rem] bg-background/40 border border-primary/10 flex items-center justify-center">
              <div className="flex gap-8">
                <Eye buddyState={buddyState} delay={0} />
                <Eye buddyState={buddyState} delay={0.05} />
              </div>
            </div>

            {/* Mouth */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              {isSpeaking ? (
                <div className="flex items-end gap-[2px] h-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-accent rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              ) : (
                <div className={`h-1 rounded-full transition-all duration-300 ${
                  isTalking ? "w-10 bg-accent animate-pulse" : "w-5 bg-muted-foreground/20"
                }`} />
              )}
            </div>

            {/* Ear accents */}
            <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full bg-gradient-to-r from-primary/40 to-primary/25 shadow-md" />
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full bg-gradient-to-l from-primary/40 to-primary/25 shadow-md" />
          </div>
        </div>

        {/* Neck */}
        <div className="flex justify-center">
          <div className="w-6 h-3 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-b-md" />
        </div>

        {/* Body */}
        <div className="relative flex justify-center">
          <div className="absolute -left-10 top-2 animate-arm-left">
            <div className="w-3 h-12 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-full border border-primary/10" />
            <div className="w-4 h-4 rounded-full bg-primary/35 shadow-sm mx-auto -mt-1" />
            <div className="w-5 h-3 rounded-full bg-primary/25 mx-auto mt-0.5" />
          </div>

          <div className="absolute -right-10 top-2 animate-arm-right">
            <div className="w-3 h-12 bg-gradient-to-b from-buddy-body-light to-buddy-body rounded-full border border-primary/10" />
            <div className="w-4 h-4 rounded-full bg-primary/35 shadow-sm mx-auto -mt-1" />
            <div className="w-5 h-3 rounded-full bg-primary/25 mx-auto mt-0.5" />
          </div>

          <div className="w-28 h-20 rounded-[1.5rem] rounded-t-xl bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/15 relative shadow-xl shadow-primary/5">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/12 border border-primary/15 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                isSpeaking ? 'bg-accent animate-pulse' : isListening ? 'bg-green-400 animate-pulse' : 'bg-primary/50 animate-antenna'
              }`} />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <div className="w-8 h-0.5 rounded-full bg-primary/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className="relative z-10 mt-4 h-6">
        {buddyState === "thinking" && (
          <p className="text-sm text-accent animate-pulse font-medium font-orbitron tracking-wider">
            💭 Sedang berpikir...
          </p>
        )}
        {buddyState === "speaking" && (
          <p className="text-sm text-accent animate-pulse font-medium font-orbitron tracking-wider">
            🔊 Buddy sedang bicara...
          </p>
        )}
      </div>
    </div>
  );
};

const Eye = ({ buddyState, delay }: { buddyState: BuddyState; delay: number }) => {
  const cls =
    buddyState === "speaking"
        ? "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-talk"
        : buddyState === "thinking"
          ? "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-think-eye"
          : "bg-gradient-to-b from-accent to-buddy-cyan-glow animate-blink";

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 animate-eye-glow ${cls}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-3 h-3 rounded-full bg-primary-foreground/90" />
    </div>
  );
};

export default BuddyRobot;
