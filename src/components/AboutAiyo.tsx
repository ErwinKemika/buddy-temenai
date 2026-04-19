import { X, MessageCircle, Mic, ListChecks, Target, Zap } from "lucide-react";
import buddyAvatar from "@/assets/buddy-avatar.png";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  onClose: () => void;
}

const AboutAiyo = ({ onClose }: Props) => {
  const { t } = useI18n();

  const features = [
    { icon: MessageCircle, labelKey: "about.chat", descKey: "about.chatDesc", color: "text-primary" },
    { icon: Mic, labelKey: "about.voice", descKey: "about.voiceDesc", color: "text-blue-400" },
    { icon: ListChecks, labelKey: "about.todo", descKey: "about.todoDesc", color: "text-accent" },
    { icon: Target, labelKey: "about.focus", descKey: "about.focusDesc", color: "text-green-400" },
    { icon: Zap, labelKey: "about.smart", descKey: "about.smartDesc", color: "text-yellow-400" },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background/98 backdrop-blur-xl safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="w-9" />
        <h2 className="text-base font-semibold font-orbitron text-foreground">{t("about.title")}</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:bg-muted transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 overflow-hidden">
            <img src={buddyAvatar} alt="Aiyo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-orbitron text-foreground">Aiyo</h1>
            <p className="text-sm text-accent mt-1">{t("about.tagline")}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card/60 rounded-2xl p-4 border border-border/20">
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about.desc")}</p>
        </div>

        {/* Features */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">{t("about.features")}</p>
          <div className="bg-card/60 rounded-2xl overflow-hidden border border-border/20">
            {features.map(({ icon: Icon, labelKey, descKey, color }, i, arr) => (
              <div
                key={labelKey}
                className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border/15" : ""}`}
              >
                <Icon size={20} className={color} />
                <div>
                  <p className="text-sm font-medium text-foreground">{t(labelKey)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version */}
        <div className="text-center pb-2">
          <p className="text-xs text-muted-foreground/50">{t("about.version")}</p>
          <p className="text-[10px] text-muted-foreground/30 mt-0.5">{t("about.madeWith")}</p>
        </div>
      </div>
    </div>
  );
};

export default AboutAiyo;
