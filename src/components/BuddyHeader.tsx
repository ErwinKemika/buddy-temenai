import buddyAvatar from "@/assets/buddy-avatar.png";

const BuddyHeader = () => {
  return (
    <header className="flex items-center px-4 pt-4 pb-2.5 bg-card/40 backdrop-blur-md border-b border-border/30">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
          <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight font-orbitron tracking-wide">Buddy</h1>
          <span className="text-[10px] text-accent leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Online • Siap ngobrol
          </span>
        </div>
      </div>
    </header>
  );
};

export default BuddyHeader;
