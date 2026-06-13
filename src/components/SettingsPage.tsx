import React from "react";
import { Language } from "../translations";
import { Globe, Paintbrush, Code, Check, Sparkles } from "lucide-react";

interface SettingsPageProps {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: "minimal" | "ocean" | "custom";
  setTheme: (theme: "minimal" | "ocean" | "custom") => void;
  customCss: string;
  setCustomCss: (css: string) => void;
  t: (key: any) => string;
}

export default function SettingsPage({
  lang,
  setLang,
  theme,
  setTheme,
  customCss,
  setCustomCss,
  t,
}: SettingsPageProps) {
  const isVi = lang === "vi";

  return (
    <div className="space-y-6" id="settings-page-container">
      {/* Title Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left" id="settings-header-panel">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-amber-500" />
          {isVi ? "Cài Đặt Hệ Thống" : "System Settings"}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {isVi
            ? "Tùy chỉnh ngôn ngữ hiển thị và chủ đề giao diện trực quan cho cuốn nhật ký của bạn."
            : "Personalize your display language, look and feel of your private archive."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Card selection */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left space-y-4" id="settings-language-card">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Globe className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("language")}
            </h3>
          </div>

          <p className="text-xs text-zinc-400">
            {isVi
              ? "Chọn ngôn ngữ hiển thị chung cho toàn hệ thống:"
              : "Choose the primary display language for the platform:"}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setLang("vi")}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative ${
                lang === "vi"
                  ? "bg-amber-500/10 border-amber-500 text-white font-bold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {lang === "vi" && (
                <span className="absolute top-2 right-2 p-0.5 bg-amber-500 rounded-full text-zinc-950">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <span className="text-lg">🇻🇳</span>
              <span className="text-sm">Tiếng Việt</span>
            </button>

            <button
              onClick={() => setLang("en")}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative ${
                lang === "en"
                  ? "bg-amber-500/10 border-amber-500 text-white font-bold"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {lang === "en" && (
                <span className="absolute top-2 right-2 p-0.5 bg-amber-500 rounded-full text-zinc-950">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <span className="text-lg">🇺🇸</span>
              <span className="text-sm">English</span>
            </button>
          </div>
        </div>

        {/* Theme Settings Selection Card */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left space-y-4" id="settings-theme-card">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Paintbrush className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("theme")}
            </h3>
          </div>

          <p className="text-xs text-zinc-400">
            {isVi
              ? "Tùy chọn tông màu chủ đạo thích hợp cho mắt:"
              : "Set your visual palette preference to adapt to your workspace context:"}
          </p>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => setTheme("minimal")}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs relative ${
                theme === "minimal"
                  ? "bg-zinc-950 border-amber-500 text-white font-bold"
                  : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              {theme === "minimal" && (
                <span className="absolute top-1.5 right-1.5 p-0.5 bg-amber-500 rounded-full text-zinc-950">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              <span className="text-lg">☀️</span>
              <span>Minimal</span>
            </button>

            <button
              onClick={() => setTheme("ocean")}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs relative ${
                theme === "ocean"
                  ? "bg-zinc-950 border-cyan-500 text-white font-bold"
                  : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              {theme === "ocean" && (
                <span className="absolute top-1.5 right-1.5 p-0.5 bg-cyan-500 rounded-full text-zinc-950">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              <span className="text-lg">🌊</span>
              <span>Ocean</span>
            </button>

            <button
              onClick={() => setTheme("custom")}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs relative ${
                theme === "custom"
                  ? "bg-zinc-950 border-purple-500 text-white font-bold"
                  : "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              }`}
            >
              {theme === "custom" && (
                <span className="absolute top-1.5 right-1.5 p-0.5 bg-purple-500 rounded-full text-zinc-950">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              <span className="text-lg">🎨</span>
              <span>Custom CSS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS overrides input block if custom theme is selected */}
      {theme === "custom" && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-left space-y-4" id="settings-css-card">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Code className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-350">
              {isVi ? "Trình Soạn Thảo CSS Tùy Biến" : "Custom CSS Playground"}
            </h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            {isVi
              ? "Hãy viết các lệnh CSS ghi đè giao diện. Trình diễn hoạt cảnh sẽ phản hồi ngay lập tức."
              : "Inject direct CSS styling adjustments below. Live workspace changes render natively."}
          </p>

          <textarea
            rows={8}
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder={t("customCssPlaceholder")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-zinc-300 leading-normal focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          ></textarea>

          <div className="bg-zinc-950/40 rounded-xl p-3 border border-zinc-850 text-[10px] text-zinc-550 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              {isVi
                ? "Mẹo: Bạn có thể viết ghi đè các biến CSS để tùy chọn màu nền hoặc tùy chỉnh định dạng font riêng của mình."
                : "Tip: Overrides will be saved to your local workspace disk instantly upon typing."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
