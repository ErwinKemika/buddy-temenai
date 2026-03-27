import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import buddyAvatar from "@/assets/buddy-avatar.png";
import SplashScreen from "@/components/SplashScreen";

type View = "splash" | "login" | "register";

const BUDDY_ROLES = [
  "Teman Belajar",
  "Teman Kerja",
  "Teman Curhat",
  "Teman Hiburan",
] as const;

const WELCOME_MESSAGES: Record<string, (name: string) => string> = {
  "Teman Belajar": (n) =>
    `Hei ${n}! Senang kenal kamu 😊 Aku siap jadi teman belajar kamu — kalau ada materi susah atau mau bikin jadwal belajar, langsung cerita ya!`,
  "Teman Kerja": (n) =>
    `Hei ${n}! Siap bantu kamu lebih produktif 💼 Mau mulai dari mana — jadwal, prioritas tugas, atau ada yang mau didiskusikan?`,
  "Teman Curhat": (n) =>
    `Hei ${n}! Senang bisa kenal kamu 🤗 Aku di sini buat dengerin — cerita aja apapun yang ada di pikiran kamu.`,
  "Teman Hiburan": (n) =>
    `Hei ${n}! Hayuk, kita seru-seruan 🎉 Mau rekomendasi film, musik, atau ngobrol santai?`,
};

const AuthPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("splash");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [birthDate, setBirthDate] = useState<Date>();
  const [buddyRole, setBuddyRole] = useState<string>(BUDDY_ROLES[0]);

  const fullGreeting = "Hai.. aku Buddy, temen aktivitas kamu ✨";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Removed old typewriter — now handled by SplashScreen component

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      toast.success("Selamat datang kembali! 🚀");
    } catch (error: any) {
      toast.error(error.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error("Nama panggilan wajib diisi ya!");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        // Update the auto-created profile with additional fields
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            nickname: nickname.trim(),
            birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
            buddy_role: buddyRole,
            display_name: nickname.trim(),
          })
          .eq("user_id", userId);

        if (profileError) console.error("Profile update error:", profileError);

        // Save welcome message to localStorage so it appears in chat
        const welcomeMsg = WELCOME_MESSAGES[buddyRole]?.(nickname.trim()) || WELCOME_MESSAGES["Teman Belajar"](nickname.trim());
        localStorage.setItem(
          "buddy-chat-messages",
          JSON.stringify([{ role: "assistant", content: welcomeMsg }])
        );
      }

      toast.success(`Selamat datang, ${nickname.trim()}! 🎉`);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat mendaftar");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-orbitron text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background buddy-gradient-bg space-stars overflow-hidden">
      {/* SPLASH */}
      {view === "splash" && (
        <SplashScreen
          onMasuk={() => setView("login")}
          onKenalan={() => setView("register")}
        />
      )}

      {/* LOGIN */}
      {view === "login" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden mb-4 shadow-lg shadow-primary/20">
            <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold font-orbitron text-foreground mb-1">Masuk</h1>
          <p className="text-sm text-muted-foreground mb-6">Selamat datang kembali!</p>

          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="bg-card/60 border-border/40"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                minLength={6}
                className="bg-card/60 border-border/40 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm font-orbitron transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <button
            onClick={() => setView("register")}
            className="mt-4 text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Belum punya akun? <span className="text-accent">Kenalan dulu →</span>
          </button>
        </div>
      )}

      {/* REGISTER */}
      {view === "register" && (
        <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-6 overflow-y-auto animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden mb-3 shadow-lg shadow-primary/20">
            <img src={buddyAvatar} alt="Buddy" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold font-orbitron text-foreground mb-1">Kenalan, yuk!</h1>
          <p className="text-sm text-muted-foreground mb-5">Ceritain sedikit tentang kamu</p>

          <form onSubmit={handleRegister} className="w-full max-w-sm space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nama Lengkap</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap kamu"
                className="bg-card/60 border-border/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nama Panggilan *</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Buddy bakal panggil kamu ini"
                required
                className="bg-card/60 border-border/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <Input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="email@kamu.com"
                required
                className="bg-card/60 border-border/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password *</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="bg-card/60 border-border/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tanggal Lahir</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-full items-center rounded-md border border-border/40 bg-card/60 px-3 py-2 text-sm",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {birthDate ? format(birthDate, "d MMMM yyyy") : "Pilih tanggal"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    captionLayout="dropdown-buttons"
                    fromYear={1950}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Kamu mau jadiin Buddy sebagai apa?
              </label>
              <select
                value={buddyRole}
                onChange={(e) => setBuddyRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border/40 bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {BUDDY_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-card text-foreground">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm font-orbitron transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30 mt-2"
            >
              {loading ? "Memproses..." : "Mulai Kenalan! 🚀"}
            </button>
          </form>

          <button
            onClick={() => setView("login")}
            className="mt-4 text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            Sudah punya akun? <span className="text-accent">Masuk →</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
