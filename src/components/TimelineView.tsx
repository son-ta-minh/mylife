import React, { useState } from "react";
import { DiaryEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Search, Calendar, MapPin, Users, Tag, Lock, Unlock, Eye, EyeOff, LayoutGrid, List, Sparkles, Smile, Trash2, Plus, Camera, Mic } from "lucide-react";

interface TimelineViewProps {
  entries: DiaryEntry[];
  onDeleteEntry: (date: string) => void;
  masterUnlocked: boolean;
  masterPasscode: string;
  lang?: "vi" | "en";
  onNewMemoryTrigger: (mode: "normal" | "camera" | "mic") => void;
}

export default function TimelineView({ entries, onDeleteEntry, masterUnlocked, masterPasscode, lang = "vi", onNewMemoryTrigger }: TimelineViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);
  const [localPassAttempt, setLocalPassAttempt] = useState("");
  const [secretError, setSecretError] = useState(false);

  const isVi = lang === "vi";

  // Derive unique tags & feelings from data
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));
  const allFeelings = Array.from(new Set(entries.map((e) => e.feeling).filter(Boolean)));

  // Filtering entries logic
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag ? entry.tags?.includes(selectedTag) : true;
    const matchesFeeling = selectedFeeling ? entry.feeling === selectedFeeling : true;
    return matchesSearch && matchesTag && matchesFeeling;
  });

  const checkSecretLog = () => {
    if (localPassAttempt === masterPasscode || masterUnlocked) {
      setRevealSecret(true);
      setSecretError(false);
    } else {
      setSecretError(true);
    }
  };

  return (
    <div className="space-y-6" id="timeline-container">
      {/* Filters Hub banner */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4" id="timeline-filter-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {isVi ? "Timeline Hành Trình" : "Life Memory Timeline"}
            </h2>
            <p className="text-xs text-zinc-400">
              {isVi 
                ? "Tra cứu lại toàn bộ ký ức, cảm xúc và các sự kiện lưu trữ theo thời gian lý lịch."
                : "Browse through your digital footprints, feelings, and indexed memory files chronologically."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3" id="timeline-header-actions">
            {/* Split trigger action to write log, camera, or mic */}
            <div className="flex items-stretch rounded-xl overflow-hidden bg-amber-500 hover:bg-amber-450 border border-transparent select-none shadow-md shadow-amber-500/10 transition-all font-sans relative">
              {/* Main New Post Button */}
              <button
                onClick={() => onNewMemoryTrigger("normal")}
                className="py-2 px-3 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors border-r border-zinc-950/15"
                title={isVi ? "Viết lưu bút mới" : "Log a normal memory"}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isVi ? "Khắc lưu bút" : "Log Memory"}</span>
              </button>
              
              {/* Camera icon button */}
              <button
                onClick={() => onNewMemoryTrigger("camera")}
                className="px-2.5 text-zinc-950 hover:bg-amber-400 transition-all flex items-center justify-center border-r border-zinc-950/15"
                title={isVi ? "Chụp hình và viết" : "Take quick snap & edit"}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {/* Mic icon button */}
              <button
                onClick={() => onNewMemoryTrigger("mic")}
                className="px-2.5 text-zinc-950 hover:bg-amber-400 transition-all flex items-center justify-center"
                title={isVi ? "Ghi âm giọng nói và viết" : "Record audio & edit"}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800" id="grid-list-toggle">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${
                  viewMode === "card" ? "bg-zinc-850 text-amber-500 font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.55" />
                <span>{isVi ? "Lưới" : "Grid"}</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${
                  viewMode === "list" ? "bg-zinc-850 text-amber-500 font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{isVi ? "Danh sách" : "List"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative text-left">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder={isVi ? "Tìm kiếm ký ức, tóm tắt, địa danh..." : "Search keywords, summaries, tags..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-left">
            <span className="text-xs font-medium text-zinc-500 shrink-0">{isVi ? "Cảm xúc:" : "Feelings:"}</span>
            <button
              onClick={() => setSelectedFeeling(null)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors shrink-0 ${
                !selectedFeeling ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-zinc-950 border-zinc-850 text-zinc-450 hover:border-zinc-700"
              }`}
            >
              {isVi ? "Tất cả" : "All"}
            </button>
            {allFeelings.map((feeling) => (
              <button
                key={feeling}
                onClick={() => setSelectedFeeling(feeling === selectedFeeling ? null : feeling)}
                className={`px-3 py-1 text-xs rounded-full border transition-all text-sm shrink-0 ${
                  selectedFeeling === feeling ? "bg-amber-500/30 border-amber-500 text-white font-bold" : "bg-zinc-950 border-zinc-850 text-zinc-450"
                }`}
              >
                {feeling}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-left">
            <span className="text-xs font-medium text-zinc-500 shrink-0">{isVi ? "Hashtag:" : "Tags:"}</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors shrink-0 ${
                !selectedTag ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "bg-zinc-950 border-zinc-850 text-zinc-450 hover:border-zinc-700"
              }`}
            >
              {isVi ? "Tất cả" : "All"}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all shrink-0 ${
                  selectedTag === tag ? "bg-amber-500/30 border-amber-500 text-white font-bold" : "bg-zinc-950 border-zinc-850 text-zinc-450"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Clear active filter warning if any */}
        {(searchTerm || selectedTag || selectedFeeling) && (
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800 text-left">
            <span>
              {isVi 
                ? <>Tìm thấy <b>{filteredEntries.length}</b> ký ức phù hợp bộ lọc</>
                : <>Found <b>{filteredEntries.length}</b> corresponding records</>}
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedTag(null);
                setSelectedFeeling(null);
              }}
              className="text-amber-500 hover:underline font-bold"
            >
              {isVi ? "Xóa bộ lọc" : "Reset active qualifiers"}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 space-y-2">
          <Smile className="w-10 h-10 mx-auto text-zinc-650" />
          <p className="text-sm">{isVi ? "Không tìm thấy bất kỳ trang bút ký nào khớp bộ lọc lọc." : "No memory sheets matched your filter qualifications."}</p>
          <p className="text-xs text-zinc-600">{isVi ? "Hãy bắt đầu ghi lưu bút để lưu tàng ký ức lâu dài." : "Begin logging your stories to fill your memories bank."}</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-sans" id="timeline-grid">
          {filteredEntries.map((entry) => {
            const hasSecret = entry.secretText && entry.secretText.trim() !== "";
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                key={entry.date}
                id={`card-${entry.date}`}
                onClick={() => {
                  setSelectedEntry(entry);
                  setRevealSecret(false);
                  setLocalPassAttempt("");
                  setSecretError(false);
                }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer p-5 rounded-2xl space-y-4 group transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Ribbon decoration representing isOnlyMe */}
                {entry.isOnlyMe && (
                  <div className="absolute top-0 right-0 bg-red-950 text-red-400 text-[10px] uppercase font-mono px-3 py-1 rounded-bl-xl border-l border-b border-red-800/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {isVi ? "Độc quyền" : "Only me"}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" role="img" aria-label="emoticon">
                          {entry.feeling || "📝"}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {entry.date}
                          </div>
                          {entry.location.name && (
                            <div className="text-xs text-zinc-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {entry.location.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {entry.summary ? (
                      <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/40 text-[11px] text-amber-500/90 leading-relaxed italic">
                        💡 AI: &ldquo;{entry.summary}&rdquo;
                      </div>
                    ) : null}
                    <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                </div>

                {/* Tags and People */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-950 mt-4">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800/85 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    {entry.people && entry.people.length > 0 && (
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5" />
                        {entry.people.length} {isVi ? "người" : "people"}
                      </span>
                    )}
                    {hasSecret && (
                      <span className="flex items-center gap-1 text-red-400 font-mono">
                        <Lock className="w-3.5 h-3.5 animate-pulse" />
                        {isVi ? "Mục mật" : "Secret Section"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List Mode styling */
        <div className="bg-zinc-900 border border-zinc-805 rounded-2xl overflow-hidden divide-y divide-zinc-800 text-left" id="timeline-list">
          {filteredEntries.map((entry) => {
            const hasSecret = entry.secretText && entry.secretText.trim() !== "";
            return (
              <div
                key={entry.date}
                id={`row-${entry.date}`}
                onClick={() => {
                  setSelectedEntry(entry);
                  setRevealSecret(false);
                  setLocalPassAttempt("");
                  setSecretError(false);
                }}
                className="p-4 hover:bg-zinc-850/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{entry.feeling}</span>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white">{entry.date}</span>
                      {entry.isOnlyMe && (
                        <span className="text-[9px] bg-red-950/80 text-red-400 border border-red-900/60 px-1.5 py-0.2 rounded font-mono uppercase">ONLY ME</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {entry.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-zinc-400">
                  {entry.location.name && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <MapPin className="w-3 h-3 text-zinc-650" />
                      {entry.location.name.split(",")[0]}
                    </span>
                  )}
                  {hasSecret && (
                    <span className="px-1.5 py-0.5 rounded bg-red-955/10 text-red-400 flex items-center gap-1 text-[10px] font-mono">
                      <Lock className="w-3 h-3" /> {isVi ? "Mật" : "Secret"}
                    </span>
                  )}
                  <span className="text-zinc-500 font-bold group-hover:text-amber-500">&rarr; {isVi ? "Chi tiết" : "Details"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Detail Dialog Modal overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-left"
            >
              {/* Image banner preview if exists */}
              {selectedEntry.images && selectedEntry.images.length > 0 && (
                <div className="w-full h-48 bg-zinc-950 relative overflow-hidden flex gap-2 p-4 pt-4">
                  {selectedEntry.images.map((img, i) => (
                    <div key={i} className="flex-1 h-full rounded-xl overflow-hidden border border-zinc-800">
                      <img
                        src={img}
                        alt="Attached life sheet"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Upper info panel */}
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedEntry.feeling}</span>
                      <div>
                        <div className="text-lg font-bold text-white font-mono flex items-center gap-2 leading-none">
                          {selectedEntry.date}
                          {selectedEntry.isOnlyMe && (
                            <span className="text-[10px] bg-red-950 text-red-400 border border-red-900/60 px-2.5 py-0.5 rounded uppercase font-bold tracking-wider">
                              Only Me
                            </span>
                          )}
                        </div>
                        {selectedEntry.location.name && (
                          <div className="text-xs text-amber-500 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedEntry.location.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-1 px-3 text-xs bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700/50"
                  >
                    {isVi ? "Đóng" : "Close"}
                  </button>
                </div>

                {/* AI generated smart paragraph if available */}
                {selectedEntry.summary && (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      {isVi ? "Tóm tắt trải nghiệm bởi Gemini AI" : "Summary drafted by Gemini AI"}
                    </div>
                    <p className="text-xs text-amber-200/90 leading-relaxed italic font-medium">
                      &ldquo;{selectedEntry.summary}&rdquo;
                    </p>
                  </div>
                )}

                {/* Main Body narrative */}
                <div className="space-y-2">
                  <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{isVi ? "Câu chuyện của tôi" : "My Story Narrative"}</div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800/40 font-sans">
                    {selectedEntry.text}
                  </p>
                </div>

                {/* Companions and Tag blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedEntry.people && selectedEntry.people.length > 0 && (
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        {isVi ? "Người tương tác chung" : "Shared Connections"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.people.map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-805">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Tag className="w-3.5 h-3.5 text-zinc-400" />
                        {isVi ? "Từ khóa sự kiện" : "Event Hashtags"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400/90 px-2.5 py-1 rounded-lg font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Secured Segment lock container */}
                {selectedEntry.secretText && selectedEntry.secretText.trim() !== "" && (
                  <div className="border border-red-900/30 bg-red-950/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{isVi ? "Mục Nhật Ký Bí Mật" : "Private Vault Section"}</span>
                      </div>
                      {revealSecret ? (
                        <span className="text-[10px] bg-red-950 text-red-400 border border-red-905 px-2 py-0.5 rounded font-mono uppercase font-bold">{isVi ? "Mở khóa" : "UNLOCKED"}</span>
                      ) : (
                        <span className="text-[10px] bg-zinc-950 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded font-mono uppercase">{isVi ? "Đang khóa" : "LOCKED"}</span>
                      )}
                    </div>

                    {!revealSecret ? (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-400">
                          {isVi 
                            ? "Mục này chứa nội dung nhạy cảm / gia tài tối bảo mật. Nhập lại mã PIN để xem:"
                            : "This segment holds classified family diaries. Enter your 4-digit PIN to evaluate:"}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Mã PIN 4 số..."
                            value={localPassAttempt}
                            onChange={(e) => setLocalPassAttempt(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 flex-1 font-mono tracking-widest"
                          />
                          <button
                            onClick={checkSecretLog}
                            className="bg-red-955/10 hover:bg-red-900 border border-red-800 text-red-200 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            {isVi ? "Mở" : "Unlock"}
                          </button>
                        </div>
                        {secretError && (
                          <p className="text-[10px] text-red-500 font-bold">{isVi ? "Mật mã không chính xác!" : "Passcode specified is incorrect!"}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[10px] text-red-400/70 uppercase font-bold">{isVi ? "Nội dung mật ẩn" : "Classified text decrypt:"}</div>
                        <p className="text-sm text-red-200 bg-black/40 border border-red-900/20 p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-mono">
                          {selectedEntry.secretText}
                        </p>
                        <button
                          onClick={() => setRevealSecret(false)}
                          className="text-[11px] text-zinc-400 hover:text-white underline mt-1 block"
                        >
                          {isVi ? "Khóa lại" : "Lock back"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dangerous Action */}
                <div className="flex justify-between items-center pt-3 border-t border-zinc-800/60 mt-4">
                  <span className="text-[10px] text-zinc-600 font-mono">{isVi ? "Khởi tạo lúc" : "Logged on"}: {new Date(selectedEntry.createdAt).toLocaleString(isVi ? "vi-VN" : "en-US")}</span>
                  <button
                    onClick={() => {
                      if (confirm(isVi 
                        ? "Bạn có chắc chắn muốn xóa vĩnh viễn ngày ký ức này không? Thao tác này sẽ dọn sạch folder tương ứng."
                        : "Permanently erase this memory folder along with disk files on server? This action is irreversible.")) {
                        onDeleteEntry(selectedEntry.date);
                        setSelectedEntry(null);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 px-3 rounded-lg transition-colors bg-transparent border border-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isVi ? "Xóa Hoài Niệm" : "Erase memory folder"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
