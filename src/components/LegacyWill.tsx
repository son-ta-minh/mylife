import React, { useState } from "react";
import { Goal, WillConfig, DiaryEntry } from "../types";
import { Mail, MailWarning, Clock, ShieldAlert, CheckCircle2, Circle, Trophy, Plus, Save, ChevronRight, RefreshCw, AlertTriangle, ShieldCheck, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LegacyWillProps {
  goals: Goal[];
  will: WillConfig;
  entries: DiaryEntry[];
  onAddGoal: (goal: Goal) => void;
  onToggleGoal: (id: string) => void;
  onUpdateWill: (will: WillConfig) => void;
  onWipeoutOnlyMe: () => void;
  onSimulationNotify: (title: string, message: string) => void;
  lang?: "vi" | "en";
}

export default function LegacyWill({
  goals,
  will,
  entries,
  onAddGoal,
  onToggleGoal,
  onUpdateWill,
  onWipeoutOnlyMe,
  onSimulationNotify,
  lang = "vi"
}: LegacyWillProps) {
  // Goal local inputs
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<Goal["category"]>("Legacy");
  const [newTarget, setNewTarget] = useState("");

  // Will setup local inputs
  const [beneficiaryName, setBeneficiaryName] = useState(will.beneficiaryName);
  const [beneficiaryEmail, setBeneficiaryEmail] = useState(will.beneficiaryEmail);
  const [safetyKey, setSafetyKey] = useState(will.safetyKey);
  const [lockedWillContent, setLockedWillContent] = useState(will.lockedWillContent);

  // Inactivity simulation state (measured in simulated days elapsed since last check-in)
  const [simulatedDaysInactive, setSimulatedDaysInactive] = useState(0);

  const isVi = lang === "vi";

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const added: Goal = {
      id: "goal_" + Date.now(),
      title: newTitle,
      category: newCategory,
      targetDate: newTarget || new Date().toISOString().split("T")[0],
      achieved: false,
      notes: ""
    };
    onAddGoal(added);
    setNewTitle("");
  };

  const handleSaveWill = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWill({
      beneficiaryName,
      beneficiaryEmail,
      safetyKey,
      lockedWillContent,
      inactivityDaysLimit: 30,
      lastCheckIn: new Date().toISOString()
    });
    alert(isVi 
      ? "Cập nhật Di Chúc Số thành công! Dữ liệu đã được niêm phong mật mã." 
      : "Sealed Digital Will updated successfully! Cryptographic decree applied.");
  };

  // Run the check logic simulated times
  const triggerSimulateInactivity = (days: number) => {
    setSimulatedDaysInactive(days);

    if (days >= 30 && days < 37) {
      onSimulationNotify(
        isVi ? "Cảnh Báo Không Đăng Nhập (30 Ngày)" : "System Inactivity Triggered (30 Days)",
        isVi 
          ? `Hệ thống ghi nhận tài khoản đã không hoạt động trong 30 ngày. Một email nhắc nhở đã được gửi tới ${beneficiaryEmail}. Bạn còn 7 ngày để điểm danh kiểm tra!`
          : `We noticed no interactions on your timeline for 30 consecutive days. A prompt draft has been simulated and scheduled to your primary receiver ${beneficiaryEmail}. You have exactly 7 days to check in!`
      );
    } else if (days >= 37) {
      onSimulationNotify(
        isVi ? "Kích Hoạt Di Chúc Trực Tuyến (37 Ngày)" : "Executing Emergency Will (37 Days)",
        isVi
          ? `QUÁ HẠN ĐĂNG NHẬP 37 NGÀY! Hệ thống đã gửi mã khóa bảo mật và bức thư di nguyện sang cho ${beneficiaryName} (${beneficiaryEmail}). TOÀN BỘ tư liệu gán nhãn "Only Me" trong nhật ký đã bị HOÀN TOÀN XÓA BỎ khỏi hệ thống để bảo vệ danh tính!`
          : `OVERDUE INACTIVITY 37 DAYS! Secret keys and locked legacy documents have been transmitted to ${beneficiaryName} (${beneficiaryEmail}). ALL private logs labeled 'Only Me' are completely erased from our server storage to guarantee confidential integrity!`
      );
      onWipeoutOnlyMe();
    } else {
      onSimulationNotify(
        isVi ? "Điểm danh thành công!" : "Check-in reset successful!", 
        isVi ? "Bộ đếm thời gian chết đã được đặt lại về 0." : "Inactivity countdown timer has been set back to active status."
      );
    }
  };

  const onlyMeEntries = entries.filter((e) => e.isOnlyMe);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left" id="legacy-layout">
      
      {/* Simulation Simulator console on top */}
      <div className="lg:col-span-12 bg-zinc-950 border border-red-900/30 p-6 rounded-3xl space-y-4" id="simulation-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h2 className="text-sm font-bold text-red-500 tracking-widest uppercase flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
              {isVi ? "Bảng Giả Lập Thời Gian Chết" : "User Inactivity Simulation Terminal"}
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              {isVi 
                ? "Vì chúng ta không thể đợi 30 ngày trong môi trường trực tiếp, hãy thử kéo/chọn mô phỏng thời gian bên dưới để kiểm tra thuật toán rà quét và tự động chuyển giao bức di nguyện số."
                : "Since simulating 30 physical days isn't feasible online, select options here to fast-forward simulated inactivity and verify our wipeout/delivery protocols."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {simulatedDaysInactive === 0 ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> {isVi ? "TRẠNG THÁI: ONLINE ACTIVE" : "STATUS: ACTIVE"}
              </span>
            ) : simulatedDaysInactive >= 30 && simulatedDaysInactive < 37 ? (
              <span className="px-3 py-1.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-850 text-[11px] font-mono flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4" /> {isVi ? "TRẠNG THÁI: CẢNH BÁO LEVEL 1" : "STATUS: INACTIVE LEVEL 1"}
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-red-955/20 text-red-400 border border-red-900/40 text-[11px] font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> {isVi ? "TRẠNG THÁI: ĐÃ KÍCH HOẠT DI CHÚC" : "STATUS: WILL ACTIVATED"}
              </span>
            )}
          </div>
        </div>

        {/* Time machine actions slider/grid buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => triggerSimulateInactivity(0)}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              simulatedDaysInactive === 0
                ? "bg-emerald-500 text-black border-transparent"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
            }`}
          >
            {isVi ? "Điểm Danh (Reset - 0 ngày)" : "Check In (0 Simulated Days)"}
          </button>
          <button
            onClick={() => triggerSimulateInactivity(15)}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              simulatedDaysInactive === 15
                ? "bg-zinc-700 text-white border-transparent"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
            }`}
          >
            {isVi ? "Vắng Mặt 15 Ngày (Bình Thường)" : "Go Offline 15 Days"}
          </button>
          <button
            onClick={() => triggerSimulateInactivity(30)}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              simulatedDaysInactive === 30
                ? "bg-amber-500 text-black border-transparent"
                : "bg-zinc-900 border-zinc-800 text-zinc-350 hover:bg-zinc-850"
            }`}
          >
            {isVi ? "Vắng Mặt 30 Ngày (Cảnh Báo)" : "Go Offline 30 Days (Warn)"}
          </button>
          <button
            onClick={() => triggerSimulateInactivity(37)}
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              simulatedDaysInactive === 37
                ? "bg-red-500 text-white border-transparent"
                : "bg-zinc-900 border-zinc-800 text-red-400 hover:bg-zinc-850"
            }`}
          >
            {isVi ? "Vắng Mặt 37 Ngày (Xóa & Gửi)" : "Go Offline 37 Days (Execute)"}
          </button>
        </div>

        {/* Live email draft layouts generated recursively based on time machine status */}
        <AnimatePresence mode="wait">
          {simulatedDaysInactive >= 30 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl text-left font-mono text-xs text-zinc-400 space-y-2.5 overflow-hidden"
              id="email-editor-console"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-855/60 text-white text-[11px] uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                {isVi ? "Hộp Thư Tự Động Gửi Đi (Bản Nháp Giả Lập)" : "Simulated Delivery Outbox (Express Log)"}
              </div>

              {simulatedDaysInactive < 37 ? (
                <div className="space-y-1">
                  <div><b>To:</b> tmson87@gmail.com ({isVi ? "Người Dùng" : "Owner"})</div>
                  <div><b>Subject:</b> [MY LIFE WARNING] {isVi ? "Hãy điểm danh đăng nhập để niêm phong lại dữ liệu" : "Please check in to secure your archive"}</div>
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-850 text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap mt-2">
                    {isVi ? (
`Chào bạn,

Hệ thống ghi nhận bạn đã không truy cập tài khoản My Life trong tròn 30 ngày.
Theo thiết lập Legacy cứu hộ, bạn hiện có thêm CHÍNH XÁC 7 NGÀY để đăng nhập lại hệ thống.

Nếu đến ngày thứ 37 bạn vẫn không trực tuyến điểm danh:
1. Thông tin thừa kế và di nguyện mật sẽ tự động mã hóa gửi tới người nhận chỉ định: ${beneficiaryName} (${beneficiaryEmail})
2. Toàn bộ ${onlyMeEntries.length} nhật ký có gắn thẻ "Chỉ mình tôi" (bài viết bảo mật cực cao) sẽ tự động xóa sạch hoàn toàn khỏi máy chủ, bảo tính an toàn danh tính đời tư của bạn.

Hãy đăng nhập ngay để hủy cảnh báo này.`
                    ) : (
`Hello,

It has been 30 consecutive days since your last login session on My Life.
As configured under digital life protections, you have EXACTLY 7 DAYS left to log in and dismiss this warning safely.

If no response is registered beyond Day 37:
1. Your confidential encrypted will records will be delivered automatically to: ${beneficiaryName} (${beneficiaryEmail})
2. All of your ${onlyMeEntries.length} private logs marked "Only Me" will be completely wiped from the Cloud Database.

Please connect as soon as possible to ensure continuity.`
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div><b>To:</b> {beneficiaryEmail} ({isVi ? "Người nhận di chúc" : "Primary Heir"})</div>
                  <div><b>Subject:</b> [MY LIFE - LEGACY DECREE] {isVi ? "Lời nhắn mật từ chủ nhân tài khoản" : "Message and Decryption Keys from Owner"}</div>
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-850 text-[11px] text-red-300/90 leading-relaxed whitespace-pre-wrap mt-2">
                    {isVi ? (
`Kính gửi ${beneficiaryName},

Hệ thống My Life ghi nhận trạng thái ngoại tuyến của chủ tài khoản đã quá 37 ngày. Chúng tôi thiết lập gửi tài liệu thừa di đính kèm này tới hòm thư của bạn.

NỘI DUNG DI CHÚC LƯU LẠI:
=========================================
"${lockedWillContent}"
=========================================

MÃ KHÓA GIẢI MÃ TẬP FILE: [${safetyKey}]

*** THÔNG BÁO TIÊU HỦY DỮ LIỆU ĐỜI TƯ: Để bảo hộ an toàn đời tư, toàn bộ ${onlyMeEntries.length} tệp tin nhật ký của chủ tài khoản gán nhãn "Only Me" đã chính thức thực thi lệnh xóa bỏ hoàn toàn vĩnh viễn khỏi server đĩa cứng.`
                    ) : (
`Dear ${beneficiaryName},

The automated safety protocols on My Life have detected owner inactivity exceeding 37 simulated days. We have automatically packages and sent this secured letter to your address.

LOCKED DIGITAL WILL RETRIEVED:
=========================================
"${lockedWillContent}"
=========================================

CRYPTO DISK KEY: [${safetyKey}]

*** PRIVACY DESTROY TRIGGERED: To defend personal privacy, all ${onlyMeEntries.length} of the user's highly sensitive 'Only Me' diary folders have been permanently deleted and scrubbed from our systems.`
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legacy Will sealing panel */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col space-y-4" id="will-config-panel">
        <div className="space-y-1 text-left">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-sans">
            <Heart className="w-5 h-5 text-red-400" />
            {isVi ? "Thiết Lập Di Chúc Số" : "Digital Will Configuration"}
          </h2>
          <p className="text-xs text-zinc-400">
            {isVi 
              ? "Cử người thừa hưởng tin cậy nhất cùng mật khẩu khôi phục tài chính và thông điệp di ngôn."
              : "Appoint your guardian, formulate account recovery keys, and leave final instructions."}
          </p>
        </div>

        <form onSubmit={handleSaveWill} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-550">{isVi ? "Họ tên người nhận" : "Beneficiary Full Name"}</label>
              <input
                type="text"
                required
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-555">{isVi ? "Hòm thư nhận thư" : "Beneficiary Email address"}</label>
              <input
                type="email"
                required
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
              {isVi ? "Mã Khóa Bảo Mật Trao Đi (Safety Key)" : "Account Recovery Safety Key"}
            </label>
            <input
              type="text"
              required
              placeholder="E.g., SAFE-DECREE-LOCK-99..."
              value={safetyKey}
              onChange={(e) => setSafetyKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-amber-500 font-mono focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 block">{isVi ? "Mã dùng để kích nén, khôi phục tài liệu tài sản số sau này." : "Private key used by heirs to recover external disk archives of values."}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-550">{isVi ? "Nội dung di nguyện" : "Secret Will & Messages"}</label>
            <textarea
              required
              rows={4}
              value={lockedWillContent}
              onChange={(e) => setLockedWillContent(e.target.value)}
              placeholder="..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono leading-relaxed focus:outline-none resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-red-955/20 hover:bg-red-950 border border-red-900/40 text-red-400 text-xs font-bold rounded-lg transition-colors font-mono"
          >
            {isVi ? "Niêm Phong Di Chúc Số" : "Seal & Encrypt Digital Decree"}
          </button>
        </form>
      </div>

      {/* Personal Goals Vision panel */}
      <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col space-y-4" id="personal-goals-panel">
        <div className="space-y-1 text-left">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-sans">
            <Trophy className="w-5 h-5 text-amber-550" />
            {isVi ? "Mục Tiêu & Ước Nguyện" : "Wishes & Lifepath Goals"}
          </h2>
          <p className="text-xs text-zinc-400">
            {isVi ? "Xác hoạch các hoài bão lớn lao và cột mốc đời người." : "Set milestones, spiritual bucket lists and carrier targets to track life performance."}
          </p>
        </div>

        {/* Target Bucket Goal Creator Form */}
        <form onSubmit={handleCreateGoal} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3" id="add-goal-form">
          <div className="space-y-1 text-left">
            <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Tên ước nguyện / cột mốc" : "Milestone / Wish title"}</label>
            <input
              type="text"
              required
              placeholder={isVi ? "Ví dụ: Hoàn tất cuốn hồi ký..." : "E.g., Launch digital startup archive..."}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-805 rounded-lg p-2 text-xs text-white placeholder-zinc-650 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 text-left">
              <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Phân nhóm" : "Category"}</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Goal["category"])}
                className="w-full bg-zinc-900 border border-zinc-805 rounded-lg p-1.8 text-xs text-white focus:outline-none"
              >
                <option value="Health">{isVi ? "Sức khỏe (Health)" : "Health"}</option>
                <option value="Career">{isVi ? "Sự nghiệp (Career)" : "Career"}</option>
                <option value="Mind">{isVi ? "Tâm trí (Mind)" : "Mind"}</option>
                <option value="Relationships">{isVi ? "Tương tác (Relationships)" : "Relationships"}</option>
                <option value="Legacy">{isVi ? "Di huấn (Legacy)" : "Legacy"}</option>
              </select>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Hạn đạt được" : "Deadline"}</label>
              <input
                type="date"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-805 rounded-lg p-1.8 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.8 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 text-xs font-bold rounded-lg transition-colors border border-amber-500/20"
          >
            {isVi ? "Nạp Nguyện Vọng Mới" : "Graft Milestone Wish"}
          </button>
        </form>

        {/* Goals List showing achievements */}
        <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 no-scrollbar text-left font-sans">
          {goals.map((g) => (
            <div
              key={g.id}
              onClick={() => onToggleGoal(g.id)}
              className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 hover:bg-zinc-950/80 cursor-pointer flex items-center justify-between gap-3 group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button type="button" className="text-zinc-650 group-hover:text-amber-500 shrink-0">
                  {g.achieved ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-450" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className={`text-xs font-medium text-white truncate ${g.achieved ? "line-through opacity-40 text-zinc-500" : ""}`}>
                    {g.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-zinc-900 px-1.5 py-0.2 rounded text-zinc-500 font-mono tracking-wide">
                      {g.category}
                    </span>
                    <span className="text-[9px] text-zinc-550 font-mono">{g.targetDate}</span>
                  </div>
                </div>
              </div>

              {g.achieved && (
                <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                  {isVi ? "Hoàn thành" : "Achieved"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
