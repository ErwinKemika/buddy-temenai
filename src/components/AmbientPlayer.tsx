import { useState, useEffect, useRef, useCallback } from "react";

type SoundType = "off" | "rain" | "white" | "brown" | "cafe";

const SOUNDS: { id: SoundType; label: string; emoji: string }[] = [
  { id: "off", label: "OFF", emoji: "🔇" },
  { id: "rain", label: "Rain", emoji: "🌧" },
  { id: "white", label: "White", emoji: "⬜" },
  { id: "brown", label: "Brown", emoji: "🟤" },
  { id: "cafe", label: "Cafe", emoji: "☕" },
];

const STORAGE_KEY = "buddy-ambient-sound";

const AmbientPlayer = () => {
  const [active, setActive] = useState<SoundType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as SoundType) || "off";
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const stopAll = useCallback(() => {
    nodesRef.current.forEach((n) => {
      try {
        if (n instanceof AudioBufferSourceNode) n.stop();
        if (n instanceof OscillatorNode) n.stop();
        n.disconnect();
      } catch {}
    });
    nodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  const startSound = useCallback((type: SoundType) => {
    stopAll();
    if (type === "off") return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.3;
    mainGain.connect(ctx.destination);
    nodesRef.current.push(mainGain);

    const createWhiteBuffer = (duration: number) => {
      const len = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buf;
    };

    const createBrownBuffer = (duration: number) => {
      const len = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = Math.min(1, Math.max(-1, lastOut * 3.5));
      }
      return buf;
    };

    const loopBuffer = (buf: AudioBuffer, dest: AudioNode) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(dest);
      src.start();
      nodesRef.current.push(src);
      return src;
    };

    if (type === "white") {
      const buf = createWhiteBuffer(2);
      loopBuffer(buf, mainGain);
    } else if (type === "brown") {
      const buf = createBrownBuffer(2);
      loopBuffer(buf, mainGain);
    } else if (type === "rain") {
      const buf = createWhiteBuffer(2);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      nodesRef.current.push(filter);

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1;
      nodesRef.current.push(lfoGain);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.08;
      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain);
      lfo.start();
      nodesRef.current.push(lfo);

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(filter);
      filter.connect(mainGain);
      src.start();
      nodesRef.current.push(src);
    } else if (type === "cafe") {
      // Layer 1: bandpass white noise
      const whiteBuf = createWhiteBuffer(2);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      filter.Q.value = 1.5;
      const layer1Gain = ctx.createGain();
      layer1Gain.gain.value = 0.2;
      nodesRef.current.push(filter, layer1Gain);
      const src1 = ctx.createBufferSource();
      src1.buffer = whiteBuf;
      src1.loop = true;
      src1.connect(filter);
      filter.connect(layer1Gain);
      layer1Gain.connect(mainGain);
      src1.start();
      nodesRef.current.push(src1);

      // Layer 2: brown noise low rumble
      const brownBuf = createBrownBuffer(2);
      const layer2Gain = ctx.createGain();
      layer2Gain.gain.value = 0.08;
      nodesRef.current.push(layer2Gain);
      const src2 = ctx.createBufferSource();
      src2.buffer = brownBuf;
      src2.loop = true;
      src2.connect(layer2Gain);
      layer2Gain.connect(mainGain);
      src2.start();
      nodesRef.current.push(src2);
    }
  }, [stopAll]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active);
    startSound(active);
    return () => stopAll();
  }, [active, startSound, stopAll]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {SOUNDS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all flex items-center gap-1.5 ${
              isActive
                ? "border-primary bg-primary/20 text-primary"
                : "border-border/30 bg-card/40 text-muted-foreground"
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
            {isActive && s.id !== "off" && (
              <span className="flex items-end gap-[2px] h-3 ml-0.5">
                <span className="w-[2px] bg-primary rounded-full animate-eq-bar1" style={{ height: "60%" }} />
                <span className="w-[2px] bg-primary rounded-full animate-eq-bar2" style={{ height: "100%" }} />
                <span className="w-[2px] bg-primary rounded-full animate-eq-bar3" style={{ height: "40%" }} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AmbientPlayer;
