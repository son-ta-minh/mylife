import React, { useState } from "react";
import { DiaryEntry, Person } from "../types";
import { Sparkles, Calendar, MapPin, Users, Tag, Lock, HelpCircle, Save, X, RefreshCw, AudioLines, ImagePlus } from "lucide-react";
import { motion } from "motion/react";

interface AddLogModalProps {
  people: Person[];
  onSaveEntry: (entry: DiaryEntry) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
  lang?: "vi" | "en";
  initialMode?: "normal" | "camera" | "mic";
}

export default function AddLogModal({ people, onSaveEntry, isOpen, onClose, lang = "vi", initialMode = "normal" }: AddLogModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [feeling, setFeeling] = useState("😊");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [secretText, setSecretText] = useState("");
  const [isOnlyMe, setIsOnlyMe] = useState(false);
  const [summary, setSummary] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const isVi = lang === "vi";
  const emojiOptions = ["😊", "🔥", "😭", "🤯", "😴", "🌿", "🚶", "🥳", "❤️", "🤔"];

  // Fetch geolocation automatically if requested
  const handleAutoGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationName(locationName || (isVi ? `Tọa độ số (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})` : `Digital Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`));
        },
        (err) => {
          alert(isVi ? "Không thể truy cập tọa độ định vị tự động. Vui lòng nhập thủ công." : "Cannot fetch automatic Geolocation coords. Please write manually.");
        }
      );
    }
  };

  const handleTogglePerson = (name: string) => {
    if (selectedPeople.includes(name)) {
      setSelectedPeople(selectedPeople.filter((p) => p !== name));
    } else {
      setSelectedPeople([...selectedPeople, name]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customTagInput.trim()) {
      e.preventDefault();
      const formatTag = customTagInput.startsWith("#") ? customTagInput.toLowerCase() : `#${customTagInput.trim().toLowerCase()}`;
      if (!tags.includes(formatTag)) {
        setTags([...tags, formatTag]);
      }
      setCustomTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((val) => val !== t));
  };

  // Modern Audio Recorder representation
  const handleToggleVoiceRecord = () => {
    setVoiceRecording(!voiceRecording);
    if (!voiceRecording) {
      // Simulate real-time audio log setup
      setTimeout(() => {
        setVoiceRecording(false);
        alert(isVi 
          ? "Đã hoàn tất đoạn ghi âm tóm tắt giọng nói 10 giây! Tệp tin đính kèm âm thanh đã lưu tệp nháp audio_voice.bin."
          : "Completed simulating 10-second audio journal summary! Attached binary as chunk draft audio_voice.bin.");
      }, 3500);
    }
  };

  // Mock upload canvas image files
  const handleAttachedMockPhoto = () => {
    // Generate beautiful abstract visual artwork as dataURI representation
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 300, 180);
      gradient.addColorStop(0, "#f59e0b"); // amber-500
      gradient.addColorStop(1, "#3f3f46"); // zinc-700
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 180);
      ctx.font = "italic Bold 14px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText((isVi ? "Ký ức ngày " : "Footprint on ") + date, 30, 80);
      ctx.fillText(locationName || (isVi ? "Hành trình lý thú" : "Exciting Voyage"), 30, 110);
      setAttachedImage(canvas.toDataURL("image/png"));
      alert(isVi ? "Ảnh chụp ký ức mô phỏng đã được kiến tạo!" : "Mock visual memory snapshot generated live!");
    }
  };

  // Automatically trigger photo/mic actions depending on initialMode on modal start
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode === "camera") {
        setAttachedImage(null);
        // Delay slightly to let the component frame load properly
        setTimeout(() => {
          handleAttachedMockPhoto();
        }, 300);
      } else if (initialMode === "mic") {
        setVoiceRecording(false);
        setTimeout(() => {
          handleToggleVoiceRecord();
        }, 300);
      }
    }
  }, [isOpen, initialMode]);

  // Call the server-side Gemini proxy to auto summarize and tag
  const handleGeminiEnrich = async () => {
    if (!text.trim()) {
      alert(isVi ? "Vui lòng viết nội dung nhật ký trước khi yêu cầu Gemini AI xử lý!" : "Please write down some diary thoughts first!");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          focusTopic: locationName
        })
      });

      if (!response.ok) {
        throw new Error("Gemini AI API failure");
      }

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.tags && Array.from(data.tags).length > 0) {
        // Merge AI tags safely
        const uniqueTags = Array.from(new Set([...tags, ...data.tags]));
        setTags(uniqueTags);
      }
    } catch (err) {
      console.error(err);
      // Offline fallback already built inside Server
      const snippet = text.slice(0, 40) + "...";
      setSummary(isVi ? `[Offline] Lưu ghi chép hành trình: "${snippet}"` : `[Offline] Saved travel footprint clue: "${snippet}"`);
      if (!tags.includes("#diary")) setTags([...tags, "#diary"]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const latVal = typeof latitude === "number" ? latitude : 16.0;
    const lngVal = typeof longitude === "number" ? longitude : 108.0;

    const entry: DiaryEntry = {
      date,
      location: {
        name: locationName || (isVi ? "Địa điểm chưa gán nhãn" : "Unlabeled Coordinate"),
        coords: locationName ? { lat: latVal, lng: lngVal } : null
      },
      feeling,
      people: selectedPeople,
      tags: tags,
      text,
      summary,
      secretText: secretText || undefined,
      isOnlyMe,
      images: attachedImage ? [attachedImage] : [],
      createdAt: new Date().toISOString()
    };

    const success = await onSaveEntry(entry);
    if (success) {
      // Clear inputs
      setLocationName("");
      setLatitude("");
      setLongitude("");
      setFeeling("😊");
      setSelectedPeople([]);
      setTags([]);
      setText("");
      setSecretText("");
      setIsOnlyMe(false);
      setSummary("");
      setAttachedImage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        id="add-log-modal-container"
      >
        <div className="p-6 border-b border-zinc-805 flex justify-between items-center">
          <div className="space-y-0.5 text-left">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {isVi ? "Khắc Ghi Bút Ký Nhật Ký" : "Log New Lifetime Footprint"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {isVi 
                ? "Thiết lập ngày tháng, tọa độ số, bạn đồng hành và dán nhãn thông minh bằng AI."
                : "Set diary date, GPS coordinates, met companions, and run organic Gemini AI categorization."}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 px-3 text-xs bg-zinc-850 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800"
          >
            {isVi ? "Đóng" : "Close"}
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-left font-sans">
          
          {/* Date, Location, GPS Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {isVi ? "Ngày lưu bút (Gắn thư mục riêng)" : "Diary Date (Node folder index)"}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {isVi ? "Địa danh / Điểm gặp gỡ cụ thể" : "Landmark Name / Gathering point"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isVi ? "Ví dụ: Landmark 81, Hồ Tây..." : "E.g., Central Park, Starbucks coffee..."}
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500 flex-1"
                />
                <button
                  type="button"
                  onClick={handleAutoGPS}
                  title="Tìm GPS tự động qua Geolocation"
                  className="px-3 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-amber-500 rounded-xl text-xs transition-all shrink-0 font-mono"
                >
                  GPS
                </button>
              </div>
            </div>
          </div>

          {/* Latitude & Longitude sub coordinates input */}
          {locationName && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-950/40 rounded-xl border border-zinc-855" id="gps-fields">
              <div className="space-y-0.5">
                <label className="text-[8px] uppercase font-bold text-zinc-650">{isVi ? "Vĩ độ (Latitude)" : "Latitude"}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="21.0285"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full bg-zinc-950/85 border border-zinc-900 rounded-lg p-1.5 text-[11px] text-zinc-300 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] uppercase font-bold text-zinc-650">{isVi ? "Kinh độ (Longitude)" : "Longitude"}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="105.8542"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full bg-zinc-950/85 border border-zinc-900 rounded-lg p-1.5 text-[11px] text-zinc-300 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Emotional Feelings selector */}
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">{isVi ? "Cảm xúc hôm nay" : "Your Emotional Vibe Today"}</label>
            <div className="flex flex-wrap gap-1.5 py-1">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFeeling(emoji)}
                  className={`w-10 h-10 rounded-full text-base flex items-center justify-center border transition-all ${
                    feeling === emoji
                      ? "bg-amber-500/15 border-amber-500 text-white font-bold scale-110 shadow-lg shadow-amber-500/10"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Main thoughts journal area */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">{isVi ? "Lưu bút diễn biến câu chuyện" : "Diary story / Thoughts narrative"}</label>
              <button
                type="button"
                onClick={handleGeminiEnrich}
                disabled={aiLoading}
                className="px-3 py-1 bg-amber-500 text-black hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors duration-300 shrink-0 select-none"
              >
                {aiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiLoading ? (isVi ? "AI đang phân tích..." : "Enriching...") : (isVi ? "Nhờ Gemini AI Tóm Tắt" : "Ask Gemini AI to Summarously Tag")}
              </button>
            </div>
            <textarea
              required
              rows={4}
              placeholder={isVi ? "Hôm nay bạn đã gặp ai, đi những đâu, học được điều gì đặc thù..." : "What events occurred? Whom did you meet? Share your thoughts, regrets or goals of the day..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 placeholder-zinc-750 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
            ></textarea>
          </div>

          {/* Dynamic AI outputs */}
          {summary && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-1 text-left animate-fade-in">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {isVi ? "AI Bản Tóm Tắt Tự Động Định Hình" : "Gemini Generative Summary"}
              </span>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-transparent text-xs text-amber-300 leading-relaxed border-none outline-none focus:outline-none p-0 pr-1 italic select-text"
              />
            </div>
          )}

          {/* Companion selector block */}
          {people.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {isVi ? "Có gặp bạn đồng hành nào không?" : "Did you meet with companions?"}
              </label>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const isChecked = selectedPeople.includes(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleTogglePerson(p.name)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                        isChecked ? "bg-zinc-200 text-black border-transparent font-medium" : "bg-zinc-950 border-zinc-808 text-zinc-400"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom tag dumper */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {isVi ? "Băng từ khóa / Event Hashtags (Enter để thêm)" : "Event tagging & hashtags (Press Enter)"}
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
              {tags.map((t) => (
                <span
                  key={t}
                  onClick={() => handleRemoveTag(t)}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 cursor-pointer border border-zinc-850 text-zinc-350 px-2.5 py-0.8 rounded-lg flex items-center gap-1"
                >
                  {t} <span className="text-[10px] text-zinc-500 hover:text-white">&times;</span>
                </span>
              ))}
              <input
                type="text"
                placeholder="#kyniem #"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                className="bg-transparent text-xs outline-none border-none py-0.5 focus:outline-none placeholder-zinc-700 text-white min-w-[120px]"
              />
            </div>
          </div>

          {/* Secret Safe sub segment for this specific day */}
          <div className="border border-red-955/20 bg-red-955/5 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-red-400" />
              <label className="text-[10px] uppercase font-bold text-red-400 tracking-wider font-mono">{isVi ? "Thông Tin Bí Mật Độc Bản (Ẩn khóa PIN)" : "PIN Decrypted Segment (Sensitive)"}</label>
            </div>
            <textarea
              placeholder={isVi ? "Các dặn dò tuyệt mật chỉ có thể xem sau khi đã nhập đúng mã PIN giải khóa Safe..." : "Classified items including account codes, sensitive affairs or secure messages..."}
              rows={2}
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl p-2.5 text-xs text-red-300 placeholder-zinc-800 focus:outline-none focus:border-red-900/60 leading-relaxed font-mono"
            ></textarea>

            {/* IsOnlyMe target indicator switch */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-white flex items-center gap-1">{isVi ? "Chỉ Mình Tôi (Only Me Safe Mode)" : "Only Me (Emergency Purge Mode)"}</span>
                <p className="text-[10px] text-zinc-500">{isVi ? "Dữ liệu ngày này sẽ tự động xóa sạch hoàn toàn nếu Di chúc số bị kích hoạt." : "This entire document is permanently purged if user inactivity count overflows."}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOnlyMe(!isOnlyMe)}
                className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 ${isOnlyMe ? 'bg-red-500' : 'bg-zinc-800'}`}
              >
                <div className={`bg-white w-5.5 h-5.5 rounded-full shadow-md transform transition-transform duration-300 ${isOnlyMe ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>

          {/* Media Attachments simulated blocks */}
          <div className="grid grid-cols-2 gap-2.5 pt-1" id="attachments-dock">
            <button
              type="button"
              onClick={handleAttachedMockPhoto}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                attachedImage ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-zinc-950 border-zinc-805 text-zinc-400 hover:border-zinc-750"
              }`}
            >
              <ImagePlus className="w-4 h-4 text-amber-500" />
              {attachedImage ? (isVi ? "Đã Chụp 1 Ảnh Lưu Trực" : "Visual asset generated") : (isVi ? "Chụp mô phỏng 1 ảnh" : "Generate mock image")}
            </button>

            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              className="p-3 rounded-xl border border-zinc-805 bg-zinc-950 hover:border-zinc-750 text-xs text-zinc-400 font-bold transition-all flex items-center justify-center gap-2"
            >
              <AudioLines className="w-4 h-4 text-red-400" />
              {isVi ? "Ghi Âm Giọng Nói" : "Simulate Audio note"}
            </button>
          </div>

          {/* Submitting handles */}
          <button
            type="submit"
            className="w-full py-3 bg-white hover:bg-zinc-100 text-black text-xs font-bold rounded-xl transition-colors font-mono tracking-wider flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {isVi ? "Lưu" : "Save"}
          </button>

        </form>
      </motion.div>
    </div>
  );
}
