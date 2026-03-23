import { useState } from "react";
import { X, Bell } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, dateTime: string, earlyMinutes: number) => void;
}

const EARLY_OPTIONS = [
  { label: "Tidak ada", value: 0 },
  { label: "5 menit sebelum", value: 5 },
  { label: "10 menit sebelum", value: 10 },
  { label: "15 menit sebelum", value: 15 },
  { label: "30 menit sebelum", value: 30 },
];

const AddReminderDialog = ({ open, onClose, onAdd }: Props) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [earlyMinutes, setEarlyMinutes] = useState(0);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes, 0);
    const dateTime = localDate.toISOString();
    
    console.log(`[Reminder Save] raw: date="${date}" time="${time}"`);
    console.log(`[Reminder Save] local: ${localDate.toLocaleString()}`);
    console.log(`[Reminder Save] ISO: ${dateTime}`);
    
    onAdd(title.trim(), dateTime, earlyMinutes);
    setTitle("");
    setDate("");
    setTime("");
    setEarlyMinutes(0);
    onClose();
  };

  // Default date to today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border/50 rounded-t-2xl p-5 pb-8 safe-bottom animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground font-orbitron">Tambah Pengingat</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full active:bg-muted">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Judul</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Meeting tim"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm text-foreground outline-none focus:border-primary/50"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Waktu</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm text-foreground outline-none focus:border-primary/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Pengingat awal</label>
            <select
              value={earlyMinutes}
              onChange={e => setEarlyMinutes(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm text-foreground outline-none focus:border-primary/50"
            >
              {EARLY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:opacity-80 transition-opacity mt-2"
          >
            Simpan Pengingat
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddReminderDialog;
