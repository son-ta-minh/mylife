import React, { useState, useEffect } from "react";
import TimelineView from "./components/TimelineView";
import PeoplePage from "./components/PeoplePage";
import PlacesPage from "./components/PlacesPage";
import SecureSafe from "./components/SecureSafe";
import LegacyWill from "./components/LegacyWill";
import AddLogModal from "./components/AddLogModal";
import SettingsPage from "./components/SettingsPage";
import { ServerState, DiaryEntry, Person, Goal, WillConfig } from "./types";
import { translations, Language } from "./translations";
import {
  ShieldAlert, Sparkles, Plus, FolderTree, BookOpen, MapPin, Users, Heart, Lock, KeyRound, Download, Upload, AlertCircle, RefreshCw, X, Check, Menu, Globe, Paintbrush, Code, Camera, Mic, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Recursive File Tree widget rendering
function FileTreeItem({ item }: { item: any; key?: any }) {
  const [isOpen, setIsOpen] = useState(true);
  const isDir = item.type === "directory";

  return (
    <div className="pl-4 font-mono text-[11px] text-zinc-300 select-none">
      <div
        onClick={() => isDir && setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 py-1 ${isDir ? "cursor-pointer hover:text-white" : ""}`}
      >
        {isDir ? (
          <>
            <span>{isOpen ? "📂" : "📁"}</span>
            <span className="font-bold text-amber-500">{item.name}/</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span className="text-zinc-400">{item.name}</span>
            {item.size !== undefined && (
              <span className="text-[9px] text-zinc-600 ml-1">({(item.size / 1024).toFixed(1)} KB)</span>
            )}
          </>
        )}
      </div>
      {isDir && isOpen && item.children && (
        <div className="border-l border-zinc-800 ml-2">
          {item.children.map((child: any, idx: number) => (
            <FileTreeItem key={idx} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"timeline" | "people" | "places" | "safe" | "will" | any>("timeline");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [will, setWill] = useState<WillConfig>({
    beneficiaryName: "Nguyễn Văn Trang",
    beneficiaryEmail: "beneficiary.trang@gmail.com",
    safetyKey: "SECRET-LEGACY-KEY-2026",
    lockedWillContent: "Tôi để lại toàn bộ tư liệu cuộc sống trực tuyến dặn dò của mình cho Trang quản lý...",
    inactivityDaysLimit: 30,
    lastCheckIn: new Date().toISOString()
  });

  const [masterPasscode, setMasterPasscode] = useState(() => {
    return localStorage.getItem("my_life_master_passcode") || "1234";
  });
  const [masterUnlocked, setMasterUnlocked] = useState(false);
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [addLogMode, setAddLogMode] = useState<"normal" | "camera" | "mic">("normal");
  const [simulationToast, setSimulationToast] = useState<{ title: string; message: string } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  // LANGUAGE (VI / EN)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("my_life_lang") as Language) || "vi";
  });

  // THEME (minimal | ocean | custom)
  const [theme, setTheme] = useState<"minimal" | "ocean" | "custom">(() => {
    return (localStorage.getItem("my_life_theme") as "minimal" | "ocean" | "custom") || "minimal";
  });

  const [customCss, setCustomCss] = useState(() => {
    return localStorage.getItem("my_life_custom_css") || `/* VIET: Hãy gõ các lệnh CSS ghi đè giao diện tại đây */\n/* ENG: Custom CSS rules go here */\nbody {\n  letter-spacing: 0.02em;\n}`;
  });

  // Responsive Sidebar open flag (mainly for mobile screens)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Persistent synchronizations
  useEffect(() => {
    localStorage.setItem("my_life_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("my_life_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("my_life_custom_css", customCss);
  }, [customCss]);

  // Translate helper function
  const t = (key: keyof typeof translations["vi"]) => {
    return translations[lang][key] || translations["vi"][key] || key;
  };

  // --- API INTERACTION / SAVE-LOAD IMPLEMENTATION ---
  useEffect(() => {
    const fetchData = async () => {
      setSyncing(true);
      try {
        // 1. Fetch entries
        const entriesRes = await fetch("/api/life-data/load-all");
        const entriesData = await entriesRes.json();
        if (entriesData.success && entriesData.entries) {
          setEntries(entriesData.entries);
        }

        // 2. Fetch global configs
        const settingsRes = await fetch("/api/life-data/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          if (settingsData.settings.people) setPeople(settingsData.settings.people);
          if (settingsData.settings.goals) setGoals(settingsData.settings.goals);
          if (settingsData.settings.will) setWill(settingsData.settings.will);
        }
        
        // Load tree files
        fetchTreeStructure();
      } catch (err) {
        console.warn("Express backend offline or sync required, loading from localStorage fallback:", err);
        // Resilient Fallback to LocalStorage
        const savedEntries = localStorage.getItem("my_life_local_entries");
        if (savedEntries) setEntries(JSON.parse(savedEntries));
      } finally {
        setSyncing(false);
      }
    };

    fetchData();
  }, []);

  const fetchTreeStructure = async () => {
    try {
      const res = await fetch("/api/life-data/debug-tree");
      const data = await res.json();
      if (data.success && data.tree) {
        setTreeData(data.tree);
      }
    } catch (err) {
      console.warn("Unable to fetch debug tree path structures", err);
    }
  };

  // Sync to backend and backup to localStorage simultaneously
  const handleSaveDiaryEntry = async (entry: DiaryEntry): Promise<boolean> => {
    setSyncing(true);
    try {
      // 1. Sync React Local State
      const updatedEntries = [entry, ...entries.filter((e) => e.date !== entry.date)];
      setEntries(updatedEntries);
      localStorage.setItem("my_life_local_entries", JSON.stringify(updatedEntries));

      // 2. Sync physical Folder creation on Backend Node via /memory/create using multipart/form-data
      const formData = new FormData();
      
      const serializedData = {
        title: entry.location?.name || `Footprint on ${entry.date}`,
        date: entry.date,
        location: entry.location || null,
        feeling: entry.feeling || "📝",
        people: entry.people || [],
        tags: entry.tags || [],
        text: entry.text || "",
        summary: entry.summary || "",
        secretText: entry.secretText || null,
        isOnlyMe: !!entry.isOnlyMe,
        createdAt: entry.createdAt || new Date().toISOString()
      };
      
      formData.append("data", JSON.stringify(serializedData));

      // Append image files by converting the base64 string to a blob
      if (entry.images && entry.images.length > 0) {
        entry.images.forEach((imgBase64, idx) => {
          const matches = imgBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const type = matches[1];
            const base64Data = matches[2];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type });
            formData.append("images", blob, `photo_${idx}.png`);
          }
        });
      }

      // Append dummy audio file if recording simulation is activated
      if (entry.audioUrl) {
        const audioBlob = new Blob([new TextEncoder().encode("MOCK_AUDIO_DATA")], { type: "audio/wav" });
        formData.append("audio", audioBlob, "audio_voice.wav");
      }

      const res = await fetch("/memory/create", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        fetchTreeStructure();
        setSimulationToast({
          title: lang === "vi" ? "Đã Lưu Thành Công" : "Memory Saved Successfully",
          message: lang === "vi" 
            ? "Kỷ niệm của bạn đã được lưu trữ cực kỳ an toàn và đồng bộ hóa thành công lên máy chủ Memory API."
            : "Your memory has been securely saved and successfully synchronized to the Memory API server."
        });
        return true;
      }
    } catch (err) {
      console.warn("Could not save to Express, backed up and secured in Browser Session", err);
      setSimulationToast({
        title: lang === "vi" ? "Lưu Trực Cục Bộ Thành Công" : "Offline Backup Completed",
        message: lang === "vi" 
          ? "Phiên bản nhật ký đã được khôi phục bảo vệ trong trình duyệt cục bộ của bạn."
          : "Saved in client browser session state because workspace server offline."
      });
      return true;
    } finally {
      setSyncing(false);
    }
    return false;
  };

  const handleDeleteDiaryEntry = async (date: string) => {
    setEntries(entries.filter((e) => e.date !== date));
    try {
      await fetch("/api/life-data/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      fetchTreeStructure();
    } catch (err) {
      console.warn("Error communicating deletion route to Express", err);
    }
  };

  // Global settings changes sync
  const syncGlobalSettings = async (updatedPeople: Person[], updatedGoals: Goal[], updatedWill: WillConfig) => {
    setSyncing(true);
    try {
      await fetch("/api/life-data/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people: updatedPeople, goals: updatedGoals, will: updatedWill })
      });
      fetchTreeStructure();
    } catch (err) {
      console.warn("Persisting global changes safely offline", err);
    } finally {
      setSyncing(false);
    }
  };

  // Add people companion
  const handleAddPerson = (person: Person) => {
    const updated = [...people, person];
    setPeople(updated);
    syncGlobalSettings(updated, goals, will);
  };

  const handleRemovePerson = (name: string) => {
    const updated = people.filter((p) => p.name !== name);
    setPeople(updated);
    syncGlobalSettings(updated, goals, will);
  };

  // Add personal dream bucket goals
  const handleAddGoal = (goal: Goal) => {
    const updated = [goal, ...goals];
    setGoals(updated);
    syncGlobalSettings(people, updated, will);
  };

  const handleToggleGoal = (id: string) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, achieved: !g.achieved } : g));
    setGoals(updated);
    syncGlobalSettings(people, updated, will);
  };

  // Update Will Sealing
  const handleUpdateWill = (updatedWill: WillConfig) => {
    setWill(updatedWill);
    syncGlobalSettings(people, goals, updatedWill);
  };

  // Triggered wipeout of all ONLY ME labeled items
  const handleWipeoutOnlyMe = async () => {
    const cleanEntries = entries.filter((e) => !e.isOnlyMe);
    setEntries(cleanEntries);
    localStorage.setItem("my_life_local_entries", JSON.stringify(cleanEntries));

    // Clear from Vault disk as well
    const onlyMeDates = entries.filter((e) => e.isOnlyMe).map((e) => e.date);
    for (const d of onlyMeDates) {
      try {
        await fetch("/api/life-data/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: d })
        });
      } catch (err) {
        console.warn(`Folder cleanup failed for ${d}`, err);
      }
    }
    fetchTreeStructure();
  };

  // Export Entire Database as Portable Backup file (VN requested)
  const handleDownloadBackup = () => {
    const dataStr = JSON.stringify({ entries, people, goals, will }, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `mylife_full_archive_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Dynamic style CSS generation block
  const getThemeCss = () => {
    if (theme === "minimal") {
      return `
        body, .min-h-screen, #applet-dashboard {
          background-color: #F9FAFB !important;
          color: #111827 !important;
        }
        header, aside, #sidebar {
          background-color: #ffffff !important;
          border-color: #E5E7EB !important;
        }
        .bg-zinc-900, .bg-zinc-850, .bg-zinc-950, [id^="card-"], [id^="person-card-"], #timeline-filter-panel, #selected-companion-card, #add-place-form, #places-list-container, #add-log-modal-container, #file-explorer-drawer, #timeline-list {
          background-color: #ffffff !important;
          color: #111827 !important;
          border-color: #E5E7EB !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
        }
        .bg-zinc-950, .bg-zinc-950\/40, .bg-zinc-950\/60, [id^="row-"] {
          background-color: #F9FAFB !important;
          color: #111827 !important;
          border-color: #E5E7EB !important;
        }
        input, select, textarea {
          background-color: #ffffff !important;
          border: 1px solid #D1D5DB !important;
          color: #111827 !important;
        }
        button[class*="bg-zinc-900"], button[class*="bg-zinc-950"], button[title="Thư Mục Lưu Trữ"], button[title="Xuất Package"] {
          background-color: #ffffff !important;
          border: 1px solid #E5E7EB !important;
          color: #374151 !important;
        }
        button[class*="bg-amber-500"] {
          background-color: #111827 !important;
          color: #ffffff !important;
        }
        .text-zinc-100, .text-zinc-200, .text-zinc-300, .text-white {
          color: #111827 !important;
        }
        .text-zinc-400, .text-zinc-500 {
          color: #4B5563 !important;
        }
        .text-zinc-650, .text-zinc-600, .text-zinc-700 {
          color: #6B7280 !important;
        }
        .border-zinc-800, .border-zinc-805, .border-zinc-850, .border-zinc-855, .border-zinc-900, .border-zinc-950 {
          border-color: #E5E7EB !important;
        }
      `;
    } else if (theme === "ocean") {
      return `
        body, .min-h-screen, #applet-dashboard {
          background-color: #030C16 !important;
          color: #E2E8F0 !important;
        }
        header, aside, #sidebar {
          background-color: #0A192F !important;
          border-color: #1A365D !important;
        }
        /* Custom sidebar menu items */
        aside button, #sidebar button {
          color: #94A3B8 !important;
        }
        /* Card boxes - Deep blue with subtle glossy outline */
        .bg-zinc-900, .bg-zinc-850, .bg-zinc-950, [id^="card-"], [id^="person-card-"], #timeline-filter-panel, #selected-companion-card, #add-place-form, #places-list-container, #add-log-modal-container, #file-explorer-drawer, #timeline-list {
          background-color: #0F1F35 !important;
          color: #F8FAFC !important;
          border-color: #1E3E62 !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4) !important;
        }
        /* Soft inline containers and row strips */
        .bg-zinc-950, .bg-zinc-950\/40, .bg-zinc-950\/60, [id^="row-"] {
          background-color: #071222 !important;
          color: #E2E8F0 !important;
          border-color: #1E3A5F !important;
        }
        /* Inputs styling for pristine ocean */
        input, select, textarea {
          background-color: #0d1b2a !important;
          border: 1px solid #1E3A5F !important;
          color: #38bdf8 !important;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
        }
        input::placeholder, textarea::placeholder {
          color: #475569 !important;
        }
        /* Action Buttons mapping */
        button[class*="bg-zinc-900"], button[class*="bg-zinc-950"], button[title="Thư Mục Lưu Trữ"], button[title="Xuất Package (.json)"] {
          background-color: #0F1F35 !important;
          border: 1px solid #1A365D !important;
          color: #94A3B8 !important;
        }
        button[class*="bg-zinc-900"]:hover, button[class*="bg-zinc-950"]:hover {
          background-color: #162C4E !important;
          color: #F8FAFC !important;
        }
        /* Strong CTA Teal Accent styling */
        button[class*="bg-amber-500"], button[class*="bg-white"] {
          background-color: #0ea5e9 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border: none !important;
        }
        button[class*="bg-amber-500"]:hover, button[class*="bg-white"]:hover {
          background-color: #38bdf8 !important;
        }
        /* Text overrides */
        .text-zinc-100, .text-zinc-200, .text-zinc-300, .text-white {
          color: #F8FAFC !important;
        }
        .text-zinc-400, .text-zinc-500 {
          color: #94A3B8 !important;
        }
        .text-zinc-600, .text-zinc-700, .text-zinc-650 {
          color: #64748B !important;
        }
        .border-zinc-800, .border-zinc-805, .border-zinc-850, .border-zinc-855, .border-zinc-900, .border-zinc-950 {
          border-color: #1E3E62 !important;
        }
        /* Keypad custom styling */
        #keypad-panel button {
          background-color: #071222 !important;
          color: #38bdf8 !important;
          border: 1px solid #1E3A5F !important;
        }
        #keypad-panel button:hover {
          background-color: #0F1F35 !important;
        }
      `;
    } else {
      return customCss;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row relative font-sans select-none overflow-x-hidden" id="applet-dashboard">
      
      {/* Raw Injection styling block representing selected theme */}
      <style dangerouslySetInnerHTML={{ __html: getThemeCss() }} />

      {/* Dynamic Simulation notifications / popup alerts */}
      <AnimatePresence>
        {simulationToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 max-w-lg w-full bg-zinc-900 border border-zinc-800 p-4.5 rounded-2xl shadow-2xl z-50 flex items-start gap-3.5">
            <div className="p-2 border border-amber-500/30 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1 text-left">
              <h4 className="text-xs font-bold text-white uppercase">{simulationToast.title}</h4>
              <p className="text-[11px] text-zinc-455 leading-relaxed font-mono">{simulationToast.message}</p>
            </div>
            <button
              onClick={() => setSimulationToast(null)}
              className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 shrink-0 self-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between bg-zinc-900 py-4 px-6 border-b border-zinc-800 shrink-0 w-full z-30 sticky top-0" id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/35 rounded-lg flex items-center justify-center text-amber-500 text-sm font-bold font-display">
            ML
          </div>
          <h1 className="text-sm font-bold text-white font-display uppercase tracking-wide">
            {t("appTitle")}
          </h1>
        </div>
        <button
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Left Sidebar (Desktop fixed pane, Mobile floating slide-out drawer) */}
      <aside
        id="sidebar"
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-72 bg-zinc-900 border-r border-zinc-800 p-5 flex flex-col justify-between transition-transform duration-300 shrink-0 overflow-y-auto no-scrollbar ${
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-[100vh]`}
      >
        <div className="space-y-5 text-left">
          
          {/* Brand header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-805/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/35 rounded-xl flex items-center justify-center text-amber-500 text-base font-bold font-display tracking-tight">
                ML
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white font-display flex items-center gap-1.5 leading-none">
                  {t("appTitle")}
                </h1>
                <span className="text-[9px] text-zinc-550 font-mono">Archive v2.6</span>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarMobileOpen(false)}
              className="md:hidden p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Life Quick stats removed as requested */}

          {/* Navigation vertical list links */}
          <div className="space-y-1 mt-2" id="sidebar-nav-links">
            <span className="text-[9px] uppercase font-bold text-zinc-550 tracking-wider block">Menu</span>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab("timeline");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "timeline" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{t("timeline")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("people");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "people" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{t("people")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("places");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "places" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{t("places")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("safe");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "safe" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{t("safe")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("will");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "will" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <Heart className="w-4 h-4 shrink-0 text-red-500" />
                <span>{t("will")}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSidebarMobileOpen(false);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold flex items-center gap-3 rounded-xl transition-all ${
                  activeTab === "settings" ? "bg-amber-500/10 text-white border-l-4 border-amber-500" : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-850/50"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{t("settings")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer actions built elegantly at sidebar base */}
        <div className="pt-4 border-t border-zinc-805/60 space-y-3 text-left">
          
          {/* Vault Explorer & Export JSON buttons removed as requested */}

          {/* Sync indicator */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 select-none">
            <span className="flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin text-amber-500" : "text-emerald-500"}`} />
              {syncing ? t("syncingLabel") : t("syncedLabel")}
            </span>
            <span className="font-mono text-[9px]">AES-256</span>
          </div>

        </div>
      </aside>

      {/* Main active layout viewport (Takes maximum leftover height dynamically) */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-viewport">
        
        {/* Main stage */}
        <main className="flex-1 p-6 md:p-8" id="main-view-stage">
          {activeTab === "timeline" && (
            <TimelineView
              entries={entries}
              onDeleteEntry={handleDeleteDiaryEntry}
              masterUnlocked={masterUnlocked}
              masterPasscode={masterPasscode}
              lang={lang}
              onNewMemoryTrigger={(mode) => {
                setAddLogMode(mode);
                setAddLogOpen(true);
              }}
            />
          )}

          {activeTab === "people" && (
            <PeoplePage
              people={people}
              entries={entries}
              onAddPerson={handleAddPerson}
              onRemovePerson={handleRemovePerson}
              lang={lang}
            />
          )}

          {activeTab === "places" && (
            <PlacesPage entries={entries} lang={lang} />
          )}

          {activeTab === "safe" && (
            <SecureSafe
              entries={entries}
              masterUnlocked={masterUnlocked}
              setMasterUnlocked={setMasterUnlocked}
              masterPasscode={masterPasscode}
              setMasterPasscode={setMasterPasscode}
              onDeleteEntry={handleDeleteDiaryEntry}
              lang={lang}
            />
          )}

          {activeTab === "will" && (
            <LegacyWill
              goals={goals}
              will={will}
              entries={entries}
              onAddGoal={handleAddGoal}
              onToggleGoal={handleToggleGoal}
              onUpdateWill={handleUpdateWill}
              onWipeoutOnlyMe={handleWipeoutOnlyMe}
              onSimulationNotify={(title, msg) => setSimulationToast({ title, message: msg })}
              lang={lang}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              lang={lang}
              setLang={setLang}
              theme={theme}
              setTheme={setTheme}
              customCss={customCss}
              setCustomCss={setCustomCss}
              t={t}
            />
          )}
        </main>

        {/* Quick Status indicators footer */}
        <footer className="border-t border-zinc-805 bg-zinc-950/40 py-4 px-6 text-center text-[11px] text-zinc-500 select-none flex flex-col sm:flex-row justify-between gap-2 shrink-0" id="footer-panel">
          <div>
            &copy; {new Date().getFullYear()} My Life Archive Co. {t("footerCopy")}
          </div>
          <div className="flex items-center justify-center gap-4">
            <span className="text-zinc-650">v2.60 Stable Node-Ingress</span>
            <span>{t("healthLabel")}</span>
          </div>
        </footer>
      </div>

      {/* Vault Debug Drawer Explorer overlay removed as requested */}

      {/* Add Diary Log Modal form */}
      <AddLogModal
        people={people}
        onSaveEntry={handleSaveDiaryEntry}
        isOpen={addLogOpen}
        onClose={() => setAddLogOpen(false)}
        lang={lang}
        initialMode={addLogMode}
      />
    </div>
  );
}
