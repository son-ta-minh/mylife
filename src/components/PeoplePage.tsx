import React, { useState } from "react";
import { DiaryEntry, Person } from "../types";
import { Users, Plus, ShieldAlert, Sparkles, MessageSquare, Trash2, Tag, Calendar } from "lucide-react";
import { motion } from "motion/react";

interface PeoplePageProps {
  people: Person[];
  entries: DiaryEntry[];
  onAddPerson: (person: Person) => void;
  onRemovePerson: (name: string) => void;
  lang?: "vi" | "en";
}

export default function PeoplePage({ people, entries, onAddPerson, onRemovePerson, lang = "vi" }: PeoplePageProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(people[0] || null);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("Bạn Thân");
  const [newNotes, setNewNotes] = useState("");

  const isVi = lang === "vi";

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  // Dynamically count shared memories by scanning the diary entries!
  const getDynamicInteractions = (personName: string) => {
    const matchedEntries = entries.filter((e) => e.people && e.people.includes(personName));
    return matchedEntries.length;
  };

  // Find entries for selected person to display "shared memories list"
  const sharedMemories = selectedPerson
    ? entries.filter((e) => e.people && e.people.includes(selectedPerson.name))
    : [];

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Check if duplicate name
    if (people.some((p) => p.name.toLowerCase() === newName.toLowerCase())) {
      alert(isVi ? "Tên người này đã tồn tại trong mạng lưới của bạn!" : "This companion's name already exists in your network!");
      return;
    }

    const rolesColorMap = ["B", "G", "P", "BR", "CY"];
    const randomAvatar = rolesColorMap[Math.floor(Math.random() * rolesColorMap.length)];

    const added: Person = {
      name: newName,
      relation: newRelation,
      notes: newNotes || (isVi ? "Chưa nhập ghi chú thông tin." : "No identity bio specified."),
      avatar: randomAvatar,
      interactions: 0 // Will compile dynamically
    };

    onAddPerson(added);
    setSelectedPerson(added);
    setNewName("");
    setNewNotes("");
  };

  const getRoleBadgeStyle = (relation: string) => {
    switch (relation) {
      case "Gia Đình":
      case "Family":
        return "bg-purple-950 text-purple-400 border-purple-800/40";
      case "Bạn Thân":
      case "Friend":
      case "Best Friend":
        return "bg-emerald-950 text-emerald-400 border-emerald-800/40";
      case "Người Yêu/Vợ":
      case "Partner":
      case "Wife":
        return "bg-rose-950 text-rose-400 border-rose-800/40";
      case "Đồng Nghiệp":
      case "Colleague":
        return "bg-cyan-950 text-cyan-400 border-cyan-800/40";
      default:
        return "bg-zinc-950 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left" id="people-layout">
      {/* People directory dashboard list */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col space-y-4" id="people-list-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              {isVi ? "Bạn Đồng Hành (Companions)" : "Your Life Companions"}
            </h2>
            <p className="text-xs text-zinc-400">
              {isVi 
                ? "Danh sách những người tương tác thường xuyên, sẻ chia thời khắc kỷ niệm với bạn."
                : "Manage connections, friends, family and companions that shape your life timeline."}
            </p>
          </div>
        </div>

        {/* Companion Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar pt-2">
          {people.map((person) => {
            const calculatedTotal = getDynamicInteractions(person.name);
            const isSelected = selectedPerson?.name === person.name;
            return (
              <div
                key={person.name}
                onClick={() => setSelectedPerson(person)}
                id={`person-card-${person.name}`}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 relative group flex items-start gap-3.5 ${
                  isSelected ? "bg-zinc-950 border-amber-500/40 shadow-xl scale-[1.01]" : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950"
                }`}
              >
                {/* Visual Initials placeholder */}
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-mono tracking-wider ${
                  person.avatar === "B" ? "bg-blue-900/50 text-blue-300 border border-blue-800" :
                  person.avatar === "G" ? "bg-purple-900/50 text-purple-300 border border-purple-800" :
                  person.avatar === "P" ? "bg-rose-900/50 text-rose-300 border border-rose-800" :
                  "bg-zinc-800 text-zinc-300 border border-zinc-800"
                }`}>
                  {getInitials(person.name)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white truncate">{person.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(isVi 
                          ? `Hủy bỏ ${person.name} khỏi kết nối? (Các trang nhật ký đã viết vẫn an toàn)`
                          : `Remove ${person.name} from companionship network? (Existing diaries are unaffected)`
                        )) {
                          onRemovePerson(person.name);
                          if (selectedPerson?.name === person.name) setSelectedPerson(null);
                        }
                      }}
                      className="text-zinc-650 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 shrink-0 transition-opacity"
                      title={isVi ? "Hủy liên kết" : "Remove Connection"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.2 rounded border uppercase font-mono ${getRoleBadgeStyle(person.relation)}`}>
                      {person.relation}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{person.notes}</p>
                </div>

                {calculatedTotal > 0 && (
                  <div className="absolute right-3.5 bottom-3 text-[10px] font-mono text-amber-500/95 font-bold bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded">
                    {calculatedTotal} {isVi ? "ký ức" : "shared"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Connection form */}
        <form onSubmit={handleCreatePerson} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/60 grid grid-cols-1 sm:grid-cols-12 gap-3 animate-fade-in" id="add-relationship-form">
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Họ và tên gọi" : "Full Name / Alias"}</label>
            <input
              type="text"
              required
              placeholder={isVi ? "Tên gọi..." : "Companion Name..."}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Mối quan hệ" : "Relationship"}</label>
            <select
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.8 text-xs text-white focus:outline-none"
            >
              <option value={isVi ? "Bạn Thân" : "Best Friend"}>{isVi ? "Bạn Thân" : "Best Friend"}</option>
              <option value={isVi ? "Gia Đình" : "Family"}>{isVi ? "Gia Đình" : "Family"}</option>
              <option value={isVi ? "Người Yêu/Vợ" : "Partner"}>{isVi ? "Người Yêu/Vợ" : "Partner / Spouse"}</option>
              <option value={isVi ? "Đồng Nghiệp" : "Colleague"}>{isVi ? "Đồng Nghiệp" : "Colleague"}</option>
              <option value={isVi ? "Khác" : "Other"}>{isVi ? "Khác" : "Other / Guardian"}</option>
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1 flex flex-col justify-between">
            <label className="text-[9px] uppercase font-bold text-zinc-500">{isVi ? "Ghi chú nhanh liên hệ / vai trò" : "Quick bio / contact handle"}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isVi ? "Ví dụ: Số ĐT liên lạc khẩn cấp..." : "Emergency contact or role detail..."}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none flex-1"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.8 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Selected Companion Side Card details */}
      <div className="lg:col-span-5 space-y-6" id="people-companion-info">
        {selectedPerson ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5" id="selected-companion-card animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full mx-auto bg-zinc-850 border border-zinc-750 flex items-center justify-center text-xl font-bold font-mono">
                {getInitials(selectedPerson.name)}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{selectedPerson.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${getRoleBadgeStyle(selectedPerson.relation)}`}>
                  {selectedPerson.relation}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800/60">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{isVi ? "Chi tiết liên kết:" : "Connection Notes:"}</span>
                <p className="text-xs text-zinc-300 bg-zinc-950 p-3.5 rounded-lg border border-zinc-850 leading-relaxed font-mono">
                  {selectedPerson.notes}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{isVi ? "Thống kê lưu bút:" : "Shared Statistics:"}</span>
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-850 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">{isVi ? "Kỷ niệm chung:" : "Shared memories logs:"}</span>
                  <span className="text-amber-550 font-bold font-mono">{getDynamicInteractions(selectedPerson.name)} {isVi ? "sự kiện" : "instances"}</span>
                </div>
              </div>
            </div>

            {/* Display list of shared memories */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                {isVi ? "Được gán thẻ chung" : "Tagged in Diaries"} ({sharedMemories.length})
              </span>

              <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                {sharedMemories.length === 0 ? (
                  <p className="text-[11px] text-zinc-600 italic">
                    {isVi ? "Chưa gắn thẻ companion này vào trang nhật ký nào." : "This connection hasn't been referenced in diary entries yet."}
                  </p>
                ) : (
                  sharedMemories.map((entry) => (
                    <div key={entry.date} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850/60 flex justify-between items-center text-left text-xs gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-zinc-550 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {entry.date}
                        </div>
                        <p className="text-[11px] text-zinc-300 truncate font-sans">{entry.text}</p>
                      </div>
                      <span className="text-[11px] text-amber-500 shrink-0 font-bold">{entry.feeling}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center py-16 text-zinc-550 space-y-2">
            <Users className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-xs">{isVi ? "Chọn một companion để xem chi tiết liên đới hồi ức." : "Please select an entity from index to preview details."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
