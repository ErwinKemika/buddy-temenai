import { ImagePlus, FileText, Camera, Mic } from "lucide-react";
import { useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  onDocumentSelect: (file: File) => void;
  onCameraCapture: (file: File) => void;
  onVoiceNote: () => void;
}

const AttachmentMenu = ({
  open, onClose,
  onImageSelect, onDocumentSelect, onCameraCapture, onVoiceNote,
}: Props) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const items = [
    {
      icon: <ImagePlus size={22} />,
      label: "Galeri",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      action: () => imageRef.current?.click(),
    },
    {
      icon: <Camera size={22} />,
      label: "Kamera",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      action: () => cameraRef.current?.click(),
    },
    {
      icon: <FileText size={22} />,
      label: "Dokumen",
      color: "text-green-400",
      bg: "bg-green-500/20",
      action: () => docRef.current?.click(),
    },
    {
      icon: <Mic size={22} />,
      label: "Voice Note",
      color: "text-rose-400",
      bg: "bg-rose-500/20",
      action: onVoiceNote,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 mb-2 z-50 bg-card/90 backdrop-blur-md border border-border/40 rounded-2xl p-3 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-muted/50 transition-colors"
            >
              <div className={`w-11 h-11 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-[11px] text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageSelect(f); e.target.value = ""; }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onCameraCapture(f); e.target.value = ""; }}
      />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onDocumentSelect(f); e.target.value = ""; }}
      />
    </>
  );
};

export default AttachmentMenu;
