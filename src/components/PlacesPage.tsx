import React, { useState } from "react";
import { DiaryEntry, VisitedPlace } from "../types";
import { MapPin, Sparkles, Navigation, Globe, Plus, Trash2, Calendar } from "lucide-react";
import { motion } from "motion/react";

interface PlacesPageProps {
  entries: DiaryEntry[];
  lang?: "vi" | "en";
}

export default function PlacesPage({ entries, lang = "vi" }: PlacesPageProps) {
  const isVi = lang === "vi";

  // Pull visited places dynamically from diaries
  const entriesWithGeoloc = entries.filter((e) => e.location && e.location.name && e.location.coords);

  // State for user added places (synced inside local states)
  const [placesList, setPlacesList] = useState<VisitedPlace[]>([
    { name: isVi ? "Hồ Gươm, Hà Nội" : "Sword Lake, Hanoi capital", date: "2026-06-10", description: isVi ? "Hẹn hò bè bạn, không khí mát lành." : "Hangout with buddies, refreshing breeze.", coords: { lat: 21.0285, lng: 105.8542 } },
    { name: isVi ? "Bến Thành, TP. Hồ Chí Minh" : "Ben Thanh Market, Ho Chi Minh", date: "2026-06-12", description: isVi ? "Công tác gấp và dạo bộ trung tâm." : "Quick business trip & downtown city tour.", coords: { lat: 10.7719, lng: 106.6983 } },
    { name: isVi ? "Cầu Rồng, Đà Nẵng" : "Dragon Bridge, Da Nang Beach", date: "2026-04-15", description: isVi ? "Kỳ nghỉ lễ cùng gia đình lớn." : "Holiday getaway with extended family.", coords: { lat: 16.0612, lng: 108.2268 } },
    { name: isVi ? "Hồ Xuân Hương, Đà Lạt" : "Xuan Huong Lake, Da Lat city", date: "2026-02-14", description: isVi ? "Kỷ niệm Valentine se lạnh đầy lãng mạn." : "Chilly romantic Valentine memory.", coords: { lat: 11.9416, lng: 108.4452 } }
  ]);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCity, setNewCity] = useState("DaNang");

  const [activePin, setActivePin] = useState<{ name: string; lat: number; lng: number; desc: string } | null>({
    name: isVi ? "Hồ Gươm, Hà Nội" : "Sword Lake, Hanoi capital",
    lat: 21.0285,
    lng: 105.8542,
    desc: isVi ? "Hẹn hò bè bạn, không khí mát lành." : "Hangout with buddies, refreshing breeze."
  });

  // Preselected Coordinates for fast pinpointing in Vietnam
  const coordinatePreset: Record<string, { lat: number; lng: number; name: string }> = {
    HaNoi: { lat: 21.0285, lng: 105.8542, name: isVi ? "Thủ đô Hà Nội" : "Hanoi Capital" },
    HaLong: { lat: 20.9501, lng: 107.0733, name: isVi ? "Vịnh Hạ Long, Quảng Ninh" : "Ha Long Bay world wonder" },
    DaNang: { lat: 16.0612, lng: 108.2268, name: isVi ? "Thành Phố Đà Nẵng" : "Da Nang Coastal City" },
    NhaTrang: { lat: 12.2388, lng: 109.1967, name: isVi ? "Vịnh Nha Trang, Khánh Hòa" : "Nha Trang Sea Bay" },
    DaLat: { lat: 11.9416, lng: 108.4452, name: isVi ? "Thành Phố Sương Mù Đà Lạt" : "Foggy Da Lat highlands" },
    SaiGon: { lat: 10.7719, lng: 106.6983, name: isVi ? "Thành Phố Hồ Chí Minh" : "Ho Chi Minh commerce hub" },
    PhuQuoc: { lat: 10.2191, lng: 103.9599, name: isVi ? "Đảo Ngọc Phú Quốc, Kiên Giang" : "Phu Quoc Emerald Island" }
  };

  const handleCreatePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const preset = coordinatePreset[newCity];
    const newPlace: VisitedPlace = {
      name: newName,
      date: newDate || new Date().toISOString().split("T")[0],
      description: newDesc || (isVi ? "Lưu địa danh từng ghé thăm." : "Journey log milestone."),
      coords: preset ? { lat: preset.lat, lng: preset.lng } : { lat: 16.0, lng: 108.0 }
    };

    setPlacesList([newPlace, ...placesList]);
    setActivePin({
      name: newPlace.name,
      lat: newPlace.coords.lat,
      lng: newPlace.coords.lng,
      desc: newPlace.description
    });

    setNewName("");
    setNewDesc("");
    setNewDate("");
  };

  const handleDeletePlace = (idx: number) => {
    setPlacesList(placesList.filter((_, i) => i !== idx));
  };

  // Convert GPS Coordinates dynamically to SVG canvas points
  const gpsToSvg = (lat: number, lng: number) => {
    const latMin = 8.0;
    const latMax = 23.5;
    const lngMin = 101.5;
    const lngMax = 110.5;

    const yPct = 100 - ((lat - latMin) / (latMax - latMin)) * 100;
    const xPct = ((lng - lngMin) / (lngMax - lngMin)) * 100;

    return { x: xPct, y: yPct };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left" id="places-layout">
      {/* Visual Vector Radar Map */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col space-y-4" id="map-panel">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500 animate-pulse" />
              {isVi ? "Bản Đồ Ký Ức Địa Danh" : "Memory Milestone Map"}
            </h2>
            <p className="text-xs text-zinc-400">
              {isVi 
                ? "Phác họa hành trình cuộc sống gắn với tọa độ không gian trực quan."
                : "Visualize your lifepaths, travels, and mapped diary records interactively."}
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-zinc-950 text-[11px] text-zinc-500 border border-zinc-850 font-mono">
            VN Grid Radar (GPS)
          </div>
        </div>

        {/* Dynamic Vector Map Stage */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl relative h-[420px] overflow-hidden flex items-center justify-center p-4">
          {/* Subtle Grid Backdrop lines representing longitude/latitude */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-[0.03] pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border border-zinc-500"></div>
            ))}
          </div>

          <svg className="w-full h-full absolute inset-0 text-zinc-800 p-8" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Outline Vietnam Curve Path approximation */}
            <path
              d="M 12 10 Q 30 18, 38 25 T 45 45 T 52 64 T 48 85 T 15 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              className="text-zinc-855"
            />
            <path
              d="M 38 25 L 43 28 T 46 38"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-zinc-855"
            />
            {/* Paracel & Spratly Islands indicators */}
            <circle cx="85" cy="55" r="1.5" className="fill-zinc-800 stroke-none" />
            <circle cx="87" cy="53" r="1" className="fill-zinc-800 stroke-none" />
            <circle cx="91" cy="72" r="1.2" className="fill-zinc-800 stroke-none" />
            <text x="75" y="50" className="text-[3px] font-mono fill-zinc-700">Hoàng Sa (VN)</text>
            <text x="80" y="78" className="text-[3px] font-mono fill-zinc-700">Trường Sa (VN)</text>
          </svg>

          {/* Render Active Diary Location Pinpoints */}
          {entriesWithGeoloc.map((ent, idx) => {
            if (!ent.location.coords) return null;
            const pos = gpsToSvg(ent.location.coords.lat, ent.location.coords.lng);
            return (
              <button
                key={`diary-pin-${idx}`}
                onClick={() => setActivePin({
                  name: ent.location.name,
                  lat: ent.location.coords!.lat,
                  lng: ent.location.coords!.lng,
                  desc: `${isVi ? "Sự kiện ngày" : "Story on"} ${ent.date}: ${ent.text.slice(0, 70)}...`
                })}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                id={`diary-pin-${idx}`}
              >
                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center animate-bounce duration-1000">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                </div>
                {/* Popover on hover */}
                <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-30 shadow-xl font-sans">
                  {ent.location.name} ({ent.date})
                </span>
              </button>
            );
          })}

          {/* Render Manual Places pins */}
          {placesList.map((place, idx) => {
            const pos = gpsToSvg(place.coords.lat, place.coords.lng);
            const isSelected = activePin?.name === place.name;
            return (
              <button
                key={`place-pin-${idx}`}
                onClick={() => setActivePin({
                  name: place.name,
                  lat: place.coords.lat,
                  lng: place.coords.lng,
                  desc: place.description
                })}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
                id={`manual-pin-${idx}`}
              >
                <span className={`absolute -inset-2 rounded-full border border-amber-500/40 animate-ping ${isSelected ? 'opacity-100' : 'opacity-0'}`}></span>
                <MapPin className={`w-5 h-5 ${isSelected ? "text-amber-400 stroke-[2.5]" : "text-zinc-550"} drop-shadow-lg`} />
              </button>
            );
          })}

          {/* Interactive Radar HUD at bottom of Map */}
          {activePin && (
            <div className="absolute bottom-3 left-3 right-3 bg-zinc-900/95 border border-zinc-800 p-3.5 rounded-xl flex items-start gap-3 z-30" id="pinpoint-hud">
              <div className="p-2 border border-amber-500/30 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="text-xs font-bold text-white truncate">{activePin.name}</div>
                  <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                    Lat: {activePin.lat.toFixed(4)} / Lng: {activePin.lng.toFixed(4)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                  {activePin.desc}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Total stats */}
        <div className="grid grid-cols-2 gap-3" id="map-counters">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/40 text-center space-y-0.5">
            <div className="text-[10px] text-zinc-550 uppercase font-bold">{isVi ? "Ký ức có GPS" : "Diaries with GPS"}</div>
            <div className="text-lg font-bold text-white">{entriesWithGeoloc.length} {isVi ? "địa điểm" : "places"}</div>
          </div>
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/40 text-center space-y-0.5">
            <div className="text-[10px] text-zinc-550 uppercase font-bold">{isVi ? "Ghim địa danh" : "Custom Landmarks Pin"}</div>
            <div className="text-lg font-bold text-white">{placesList.length} {isVi ? "thư mục" : "points"}</div>
          </div>
        </div>
      </div>

      {/* Places Manager & Form */}
      <div className="lg:col-span-5 space-y-6" id="places-dashboard">
        {/* Form to add Visited Landmarks */}
        <form onSubmit={handleCreatePlace} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4" id="add-place-form">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-500" />
              {isVi ? "Đánh Dấu Địa Danh Mới" : "Pin New Landmark"}
            </h3>
            <p className="text-zinc-400 text-xs text-[11px]">
              {isVi 
                ? "Ghim các nơi ý nghĩa bạn từng qua mà không cần ghi nhật ký rườm rà."
                : "Bookmark memorable coordinates offline without creating lengthy entries."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">{isVi ? "Tên địa danh cụ thể" : "Landmark Name"}</label>
              <input
                type="text"
                required
                placeholder={isVi ? "Ví dụ: Landmark 81, Kafe Hồ Tây..." : "E.g., Eiffel Tower, Banhar church..."}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">{isVi ? "Tọa độ Preset" : "Coordinates Preset"}</label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="HaNoi">{isVi ? "Hà Nội" : "Hanoi"}</option>
                  <option value="HaLong">{isVi ? "Hạ Long" : "Ha Long Bay"}</option>
                  <option value="DaNang">{isVi ? "Đà Nẵng" : "Da Nang"}</option>
                  <option value="NhaTrang">{isVi ? "Nha Trang" : "Nha Trang"}</option>
                  <option value="DaLat">{isVi ? "Đà Lạt" : "Da Lat"}</option>
                  <option value="SaiGon">{isVi ? "Sài Gòn" : "Saigon"}</option>
                  <option value="PhuQuoc">{isVi ? "Phú Quốc" : "Phu Quoc"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">{isVi ? "Ngày ghé" : "Visit Date"}</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-500">{isVi ? "Cảm tưởng ngắn về nơi này" : "Short memory / impression"}</label>
              <textarea
                placeholder={isVi ? "Lưu lại ghi chép, ấn tượng nơi này..." : "Key takeaway or romantic events..."}
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-400 text-xs font-bold rounded-lg transition-colors"
          >
            {isVi ? "Đóng Ghim Lên Bản Đồ" : "Graft Marker on Canvas Map"}
          </button>
        </form>

        {/* Visited list panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4" id="places-list-container">
          <h3 className="text-sm font-bold text-white">{isVi ? "Hồ Sơ Địa Danh Ghé Thăm" : "My Footprint Milestones"} ({placesList.length})</h3>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
            {placesList.map((place, idx) => (
              <div
                key={idx}
                onClick={() => setActivePin({ name: place.name, lat: place.coords.lat, lng: place.coords.lng, desc: place.description })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  activePin?.name === place.name ? "bg-zinc-950 border-amber-500/40" : "bg-zinc-950/60 border-zinc-850 hover:bg-zinc-950"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {place.name}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate leading-tight font-sans">{place.description}</p>
                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" /> {place.date}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlace(idx);
                  }}
                  className="text-zinc-650 hover:text-red-450 p-1 rounded hover:bg-zinc-800 transition-colors"
                  title={isVi ? "Xóa" : "Remove"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
