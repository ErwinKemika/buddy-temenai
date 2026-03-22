import { ImagePlus, FileText, Camera } from "lucide-react";
import { useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  onDocumentSelect: (file: File) => void;
  onCameraCapture: (file: File) => void;
}

const AttachmentMenu = ({
  open, onClose,
  onImageSelect, onDocumentSelect, onCameraCapture,
}: Props) => {
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const items = [
    { icon: <ImagePlus size={20} />, label: "Galeri", color: "text-purple-400", bg: "bg-purple-500/20", action: () => imageRef.current?.click() },
    { icon: <Camera size={20} />, label: "Kamera", color: "text-blue-400", bg: "bg-blue-500/20", action: () => cameraRef.current?.click() },
    { icon: <FileText size={20} />, label: "Dokumen", color: "text-green-400", bg: "bg-green-500/20", action: () => docRef.current?.click() },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 mb-2 z-50 bg-card/90 backdrop-blur-md border border-border/40 rounded-2xl p-3 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex gap-4">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-muted/50 transition-colors min-w-[56px]"
            >
              <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageSelect(f); e.target.value = ""; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onCameraCapture(f); e.target.value = ""; }} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onDocumentSelect(f); e.target.value = ""; }} />
    </>
  );
};

export default AttachmentMenu;
