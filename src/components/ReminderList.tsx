import { Bell, Trash2, Clock } from "lucide-react";
import { Reminder } from "@/hooks/useReminders";

interface Props {
  open: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onDelete: (id: string) => void;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    + " • " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const ReminderList = ({ open, onClose, reminders, onDelete }: Props) => {
  if (!open) return null;

  const active = reminders.filter(r => !r.fired);
  const past = reminders.filter(r => r.fired);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border/50 rounded-t-2xl p-5 pb-8 safe-bottom animate-in slide-in-from-bottom duration-300 max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground font-orbitron">Pengingat</h2>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground active:text-foreground">Tutup</button>
        </div>

        {active.length === 0 && past.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada pengingat.</p>
        )}

        {active.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Aktif</p>
            {active.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                <Clock size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.dateTime)}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">{r.dateTime}</p>
                  {r.earlyMinutes > 0 && (
                    <p className="text-[10px] text-accent">{r.earlyMinutes} menit sebelum</p>
                  )}
                </div>
                <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-full active:bg-destructive/20 shrink-0">
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Selesai</p>
            {past.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/10 border border-border/10 opacity-60">
                <Bell size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.dateTime)}</p>
                </div>
                <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-full active:bg-destructive/20 shrink-0">
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderList;
