import { Mic, Square, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

const VoiceRecorder = ({ onSend, onCancel }: Props) => {
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    let stream: MediaStream;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;
      const mr = new MediaRecorder(s, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);

      timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000);
    }).catch(() => {
      onCancel();
    });

    return () => {
      clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCancel]);

  const handleSend = () => {
    clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      onSend(blob);
    };
    mr.stop();
  };

  const handleCancel = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    onCancel();
  };

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="px-3 pt-2 pb-3 bg-card/40 backdrop-blur-md border-t border-border/30 safe-bottom">
      <div className="flex items-center gap-3">
        <button onClick={handleCancel} className="p-2.5 rounded-full text-destructive active:bg-destructive/20 transition-colors">
          <Square size={20} />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-foreground font-mono">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <div className="flex-1 h-1 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-destructive/60 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>

        <button onClick={handleSend} className="p-2.5 rounded-full text-primary active:bg-primary/20 transition-colors">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
