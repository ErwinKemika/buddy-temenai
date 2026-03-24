import { useEffect, useState } from "react";

const BuddyHeader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className="relative px-3 pt-[env(safe-area-inset-top,8px)] pb-1.5 bg-card/40 backdrop-blur-md border-b border-border/30 overflow-hidden">
      <div className="flex items-center gap-2.5 pt-1.5">
        {/* Mini Buddy Robot Head */}
        <div className="relative shrink-0 animate-buddy-header-float">
          {/* Glow */}
          <div className="absolute inset-0 w-[44px] h-[44px] rounded-full bg-primary/15 blur-md" />
          <div className="relative w-[44px] h-[44px]">
            {/* Antenna */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <div className="w-0.5 h-1.5 bg-accent/40" />
            </div>
            {/* Head */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-9 h-7 rounded-[0.6rem] bg-gradient-to-b from-buddy-body-light to-buddy-body border border-primary/20 flex items-center justify-center">
              {/* Eyes */}
              <div className="flex gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-accent animate-blink" />
                <div className="w-2 h-2 rounded-full bg-accent animate-blink" style={{ animationDelay: '0.05s' }} />
              </div>
              {/* Ears */}
              <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-l-full bg-primary/30" />
              <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-r-full bg-primary/30" />
            </div>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="relative flex-1">
          <div className={`relative bg-card/60 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-bl-md px-3 py-2 shadow-lg shadow-primary/5 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
            {/* Bubble arrow */}
            <div className="absolute left-[-6px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-primary/20" />
            <p className="text-xs text-foreground/90 leading-snug font-medium">
              Halo! Ada yang bisa aku bantu? 🚀
            </p>
            <span className="text-[9px] text-accent/70 leading-none flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Online • Siap ngobrol
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BuddyHeader;
