import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import buddyAvatar from "@/assets/buddy-avatar.png";
import { useI18n } from "@/hooks/useI18n";

const SLIDE_KEYS = [
  { titleKey: "onboarding.s0.title", descKey: "onboarding.s0.desc", useAvatar: true },
  { titleKey: "onboarding.s1.title", descKey: "onboarding.s1.desc", emoji: "💬" },
  { titleKey: "onboarding.s2.title", descKey: "onboarding.s2.desc", emoji: "🎙️" },
  { titleKey: "onboarding.s3.title", descKey: "onboarding.s3.desc", emoji: "📋" },
  { titleKey: "onboarding.s4.title", descKey: "onboarding.s4.desc", emoji: "🎯" },
  { titleKey: "onboarding.s5.title", descKey: "onboarding.s5.desc", emoji: "📲", isPwa: true },
];

interface Props {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: Props) => {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const slide = SLIDE_KEYS[current];
  const isLast = current === SLIDE_KEYS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-background/98 backdrop-blur-xl safe-area-inset px-6 py-8">
      {/* Skip button */}
      <div className="w-full flex justify-end">
        <button
          onClick={onComplete}
          className="flex items-center gap-1 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-muted/40 active:bg-muted transition-colors"
        >
          <X size={12} /> {t("onboarding.skip")}
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 max-w-xs w-full">
        {slide.useAvatar ? (
          <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden">
            <img src={buddyAvatar} alt="Aiyo" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="text-7xl select-none">{slide.emoji}</div>
        )}
        <div>
          <h2 className="text-2xl font-bold font-orbitron text-foreground mb-3">{t(slide.titleKey)}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t(slide.descKey)}</p>
        </div>

        {/* PWA install instructions */}
        {slide.isPwa && (
          <div className="w-full space-y-2 text-left mt-2">
            <div className="bg-card/60 rounded-xl p-3.5 border border-border/30">
              <p className="text-xs font-semibold text-foreground mb-1.5">🍎 iOS (Safari)</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("onboarding.iosInstall")}
              </p>
            </div>
            <div className="bg-card/60 rounded-xl p-3.5 border border-border/30">
              <p className="text-xs font-semibold text-foreground mb-1.5">🤖 Android (Chrome)</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("onboarding.androidInstall")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: dots + button */}
      <div className="w-full flex flex-col items-center gap-5">
        {/* Progress dots */}
        <div className="flex gap-2 items-center">
          {SLIDE_KEYS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-primary"
                  : i < current
                  ? "w-2 h-2 bg-primary/40"
                  : "w-2 h-2 bg-muted-foreground/25"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((c) => c + 1))}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:bg-primary/80 transition-colors"
        >
          {isLast ? (
            t("onboarding.start")
          ) : (
            <>
              {t("onboarding.next")} <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingTour;
