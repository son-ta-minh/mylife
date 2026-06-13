import React, { useState } from "react";
import { DiaryEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, KeyRound, Save, AlertCircle, FileText, Calendar, Trash2 } from "lucide-react";

interface SecureSafeProps {
  entries: DiaryEntry[];
  masterUnlocked: boolean;
  setMasterUnlocked: (val: boolean) => void;
  masterPasscode: string;
  setMasterPasscode: (val: string) => void;
  onDeleteEntry: (date: string) => void;
  lang?: "vi" | "en";
}

export default function SecureSafe({
  entries,
  masterUnlocked,
  setMasterUnlocked,
  masterPasscode,
  setMasterPasscode,
  onDeleteEntry,
  lang = "vi"
}: SecureSafeProps) {
  const [pinInput, setPinInput] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [showError, setShowError] = useState(false);

  // States inside safe
  const [newPass, setNewPass] = useState("");
  const [secretNotes, setSecretNotes] = useState(() => {
    return localStorage.getItem("my_life_secure_notes") || "Chào tôi của tương lai,\nĐây là bản nháp ghi nhớ tài khoản tiết kiệm ẩn, bảo hiểm nhân thọ và những suy tư mà tôi chưa muốn chia sẻ cho bất kỳ ai tại thời điểm hiện tại.";
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isVi = lang === "vi";

  // Filter only me diaries (can only be viewed if safe is unlocked)
  const onlyMeEntries = entries.filter((e) => e.isOnlyMe);

  const handleKeyPress = (num: string) => {
    setShowError(false);
    if (pinInput.length < 4) {
      const updated = pinInput + num;
      setPinInput(updated);
      if (updated.length === 4) {
         if (updated === masterPasscode) {
          setMasterUnlocked(true);
          setPinInput("");
          setErrorCount(0);
        } else {
          setShowError(true);
          setPinInput("");
          setErrorCount((prev) => prev + 1);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const handleSaveNotes = () => {
    localStorage.setItem("my_life_secure_notes", secretNotes);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length !== 4 || isNaN(Number(newPass))) {
      alert(isVi ? "Mật mã mới phải có đúng 4 chữ số!" : "New passcode must contain exactly 4 numeric characters!");
      return;
    }
    setMasterPasscode(newPass);
    localStorage.setItem("my_life_master_passcode", newPass);
    setNewPass("");
    alert(isVi ? "Thành công: Đã đổi mã PIN bảo mật 4 chữ số!" : "Success: Changed 4-digit secure code!");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6" id="secure-safe-container">
      <AnimatePresence mode="wait">
        {!masterUnlocked ? (
          /* Gated keypad view */
          <motion.div
            key="safe-locked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-6"
            id="safe-locked-deck"
          >
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-red-950/30 border border-red-900/40 rounded-full flex items-center justify-center mx-auto text-red-400">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">{isVi ? "Phòng Trữ Riêng Tư" : "Cryptographic Vault Door"}</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {isVi 
                  ? "Nhập mã pin bảo vệ 4 chữ số riêng tư của bạn để mở khóa các nhật ký được gán nhãn 'Chỉ mình tôi' và các khóa sao lưu Legacy quan trọng."
                  : "Enter your 4-digit PIN lock to evaluate 'Only Me' classified narratives and secure legacy emergency keys."}
              </p>
              <div className="text-[11px] bg-zinc-950/80 px-2.5 py-0.5 rounded text-zinc-550 font-mono inline-block border border-zinc-850">
                {isVi ? "Mặc định" : "Default"}: 1234
              </div>
            </div>

            {/* Simulated Pin Dots display */}
            <div className="flex justify-center gap-4 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    pinInput.length > i
                      ? "bg-red-500 border-red-400 scale-125 shadow-lg shadow-red-500/50"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                ></div>
              ))}
            </div>

            {showError && (
              <p className="text-xs text-red-500 font-bold" id="pin-error-msg">
                {isVi 
                  ? `Mật PIN không chính xác. Đã sai ${errorCount} lần!`
                  : `PIN code mismatch. Attempt failures: ${errorCount} times!`}
              </p>
            )}

            {/* Digital Dial dial pad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto pt-2" id="keypad-panel text-center">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-14 font-mono font-bold text-lg rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 active:scale-95 transition-all flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput("")}
                className="h-14 text-xs font-bold font-mono rounded-2xl bg-zinc-950/40 text-zinc-550 hover:text-zinc-300 flex items-center justify-center border border-zinc-900"
              >
                {isVi ? "Xóa hết" : "Clear"}
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-14 font-mono font-bold text-lg rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 active:scale-95 transition-all flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 text-xs font-bold font-mono rounded-2xl bg-zinc-950/40 text-zinc-550 hover:text-zinc-300 flex items-center justify-center border border-zinc-900"
              >
                {isVi ? "Xóa bớt" : "Back"}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Unlocked Safe dashboard segment */
          <motion.div
            key="safe-unlocked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
            id="safe-unlocked-deck"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-bold text-white">{isVi ? "Phòng Ký Thác Cơ Mật" : "Decrypted Private Vault"}</h2>
                    <p className="text-[11px] text-zinc-400">{isVi ? "Suối ký ức bí mật được mở khóa an toàn." : "All secure fragments decrypted flawlessly."}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMasterUnlocked(false)}
                  className="px-3.5 py-1.5 bg-red-955/20 hover:bg-red-900/40 border border-red-900/60 text-red-400 text-xs font-bold rounded-lg transition-colors"
                >
                  {isVi ? "Tạm Khóa Lại" : "Lock Safe Cabin"}
                </button>
              </div>

              {/* Private quick scratchpad notes */}
              <div className="space-y-2 text-left" id="private-scratchpad">
                <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {isVi ? "Bản ghi chú siêu bảo mật (Chút hoài niệm ẩn)" : "Secured Scratchpad Draft (Only visible here in safe)"}
                </label>
                <textarea
                  rows={4}
                  value={secretNotes}
                  onChange={(e) => setSecretNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 placeholder-zinc-800 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                ></textarea>
                <div className="flex justify-end gap-2">
                  {saveSuccess && (
                    <span className="text-[10px] text-emerald-500 font-bold self-center animate-pulse">{isVi ? "Đã lưu!" : "Saved securely!"}</span>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    className="p-1 px-3 text-[11px] bg-emerald-955/15 hover:bg-emerald-900/35 border border-emerald-800/40 text-emerald-400 rounded-lg flex items-center gap-1.5 transition-colors font-mono"
                  >
                    <Save className="w-3.5 h-3.5" /> {isVi ? "Lưu bản ghi mật" : "Save safe note"}
                  </button>
                </div>
              </div>
            </div>

            {/* Gated Only-me specific records list */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-left space-y-4" id="onlyme-entries-deck">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{isVi ? "Hồ Sơ Ký Ức 'Chỉ Mình Tôi' (Only Me)" : "Confidential 'Only Me' Diary Logs"} ({onlyMeEntries.length})</span>
                <span className="text-[10px] text-red-400 bg-red-950/40 px-2.5 py-0.5 border border-red-900/40 rounded font-mono uppercase">Erase Candidate</span>
              </div>

              {onlyMeEntries.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-805 rounded-2xl text-zinc-600 text-xs font-sans">
                  {isVi ? "Không có nhật ký nào gán nhãn Độc Quyền (Only Me)." : "No diary logs have been sealed with confidential tags yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-red-950/10 border border-red-950/40 text-[11px] text-red-400 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {isVi ? (
                        <><b>Cảnh báo khẩn cấp:</b> Toàn bộ {onlyMeEntries.length} nhật ký gán nhãn <b>Only Me</b> bên dưới sẽ bị tự động xóa bỏ vĩnh viễn khỏi server đĩa chứa nếu thời gian chết đếm ngược trong Di chúc số của bạn trôi qua ngày thứ 37.</>
                      ) : (
                        <><b>Wipeout Protection Active:</b> All {onlyMeEntries.length} journals marked <b>Only Me</b> are automatically wiped off the server storage if inactivity is triggered beyond 37 simulated days in Digital Will.</>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                    {onlyMeEntries.map((e) => (
                      <div key={e.date} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex justify-between items-start gap-2 hover:border-red-900/30 transition-all font-sans">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{e.feeling || "📝"}</span>
                            <span className="text-xs font-mono font-bold text-white">{e.date}</span>
                            {e.location.name && (
                              <span className="text-[10px] text-amber-500 truncate max-w-[120px]">&bull; {e.location.name}</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{e.text}</p>
                          {e.secretText && (
                            <p className="text-xs text-red-400 font-mono line-clamp-1 italic">PIN Locked Text: {e.secretText}</p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(isVi ? "Xoá vĩnh viễn lưu bút mật này?" : "Erase this private memory log permanently?")) {
                              onDeleteEntry(e.date);
                            }
                          }}
                          className="text-zinc-650 hover:text-red-450 p-1 rounded hover:bg-zinc-900 shrink-0 self-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Passcode customization panel */}
            <form onSubmit={handleChangePasscode} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-left space-y-3" id="config-passcode-form">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 font-sans">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                {isVi ? "Cập Nhật Mã PIN Buồng Bảo Mật" : "Change Vault Authentication PIN"}
              </h3>
              <p className="text-xs text-zinc-400">
                {isVi 
                  ? "Hãy lựa chọn 4 số của riêng bạn để ngăn chặn người khác dò dẫm mã mở tài liệu mật."
                  : "Modify your 4-digit security key at any time. Keep it memorized."}
              </p>

              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder={isVi ? "Nhập 4 số PIN mới..." : "Enter 4 numeric digits..."}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1 font-mono tracking-widest text-center"
                />
                <button
                  type="submit"
                  className="bg-emerald-955/20 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 font-bold px-4 py-2 rounded-xl text-xs transition-colors font-mono"
                >
                  {isVi ? "Đổi Mã PIN" : "Update PIN"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
