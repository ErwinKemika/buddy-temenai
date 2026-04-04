import { useState, useEffect, useRef } from "react";

const SOUNDS = [
  { id: "off", label: "OFF", icon: "🔇", url: null },
  { id: "forest", label: "Forest", icon: "🌲", url: "https://hbkmnzhwrgfhjnppkuzt.supabase.co/storage/v1/object/public/Sounds/Forest%20Ambience.mp3" },
  { id: "study", label: "Study", icon: "📚", url: "https://hbkmnzhwrgfhjnppkuzt.supabase.co/storage/v1/object/public/Sounds/Study%20Focus.mp3" },
  { id: "deep", label: "Deep Focus", icon: "🧠", url: "https://hbkmnzhwrgfhjnppkuzt.supabase.co/storage/v1/object/public/Sounds/Brain%20Deep%20Focus.mp3" },
  { id: "cafe", label: "Cafe", icon: "☕", url: "https://hbkmnzhwrgfhjnppkuzt.supabase.co/storage/v1/object/public/Sounds/Cafe%20Cozy.mp3" },
];

const STORAGE_KEY = "buddy-ambient-sound";

const AmbientPlayer = () => {
  const [active, setActive] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "off";
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    const sound = SOUNDS.find((s) => s.id === active);
    if (sound?.url) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = 0.3;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    localStorage.setItem(STORAGE_KEY, active);

    return () => {
      audioRef.current?.pause();
    };
  }, [active]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {SOUNDS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isActive
                ? "border-primary bg-primary/20 text-primary"
                : "border-border/30 bg-card/40 text-muted-foreground"
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
            {isActive && s.id !== "off" && (
              <span className="flex items-end gap-[2px] h-3 ml-0.5">
                <span className="w-[3px] bg-primary rounded-full animate-eq-bar1" />
                <span className="w-[3px] bg-primary rounded-full animate-eq-bar2" />
                <span className="w-[3px] bg-primary rounded-full animate-eq-bar3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AmbientPlayer;
