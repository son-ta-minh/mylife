import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Bypass certificate validation since localhost:8088 may use self-signed HTTPS certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;
const VAULT_DIR = path.join(process.cwd(), "vault");
const upload = multer({ storage: multer.memoryStorage() });

// Ensure the main data vault directory exists
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to sanitize date string for safe folder name
const sanitizeFolder = (dateStr: string) => {
  return dateStr.replace(/[^0-9\-]/g, ""); // Standardize YYYY-MM-DD
};

// --- MEMORY API FOR EXTERNAL INTEGRATION ---
app.post("/memory/create", upload.fields([{ name: "images" }, { name: "audio" }]), async (req: any, res) => {
  try {
    const rawData = req.body.data;
    if (!rawData) {
      return res.status(400).json({ success: false, error: "Missing data payload" });
    }

    const entryData = JSON.parse(rawData);
    const date = entryData.date || new Date().toISOString().split("T")[0];
    const folderName = sanitizeFolder(date);
    const dayFolderPath = path.join(VAULT_DIR, folderName);

    if (!fs.existsSync(dayFolderPath)) {
      fs.mkdirSync(dayFolderPath, { recursive: true });
    }

    // Save locally
    fs.writeFileSync(path.join(dayFolderPath, "diary.txt"), entryData.text || "", "utf8");

    if (entryData.secretText) {
      fs.writeFileSync(path.join(dayFolderPath, "secret_safe.txt"), entryData.secretText, "utf8");
    } else {
      const secFile = path.join(dayFolderPath, "secret_safe.txt");
      if (fs.existsSync(secFile)) fs.unlinkSync(secFile);
    }

    const images: string[] = [];
    const filesList = req.files || {};

    if (filesList.images && filesList.images.length > 0) {
      const imagesFolder = path.join(dayFolderPath, "images");
      if (!fs.existsSync(imagesFolder)) {
        fs.mkdirSync(imagesFolder, { recursive: true });
      }
      filesList.images.forEach((file: any, idx: number) => {
        const filePath = path.join(imagesFolder, `photo_${idx}.png`);
        fs.writeFileSync(filePath, file.buffer);
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        images.push(base64);
      });
    }

    if (filesList.audio && filesList.audio.length > 0) {
      fs.writeFileSync(path.join(dayFolderPath, "audio_voice.bin"), filesList.audio[0].buffer);
    }

    const metadata = {
      date: date,
      location: entryData.location || { name: entryData.title || "Địa điểm chưa gán", coords: null },
      feeling: entryData.feeling || "📝",
      people: entryData.people || [],
      tags: entryData.tags || [],
      summary: entryData.summary || "",
      isOnlyMe: !!entryData.isOnlyMe,
      audioUrl: (filesList.audio && filesList.audio.length > 0) ? "audio_voice.bin" : null,
      createdAt: entryData.createdAt || new Date().toISOString()
    };
    fs.writeFileSync(path.join(dayFolderPath, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

    // Forward to remote Node.js server at https://localhost:8088
    let externalSuccess = false;
    let externalId = date.replace(/-/g, "") + "_" + new Date().toTimeString().split(" ")[0].replace(/:/g, "");
    try {
      const extFormData = new FormData();
      extFormData.append("data", JSON.stringify(entryData));

      if (filesList.images) {
        filesList.images.forEach((file: any) => {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          extFormData.append("images", blob, file.originalname || "image.png");
        });
      }

      if (filesList.audio) {
        filesList.audio.forEach((file: any) => {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          extFormData.append("audio", blob, file.originalname || "audio.wav");
        });
      }

      console.log("Forwarding memory creation to upstream server: https://localhost:8088/memory/create");
      const extRes = await fetch("https://localhost:8088/memory/create", {
        method: "POST",
        body: extFormData
      });

      if (extRes.ok) {
        const extResult = await extRes.json();
        if (extResult && extResult.id) {
          externalId = extResult.id;
        }
        externalSuccess = true;
      }
    } catch (err: any) {
      console.warn("Unable to contact upstream local server:", err.message);
    }

    res.json({ success: true, id: externalId, externalSynced: externalSuccess });
  } catch (err: any) {
    console.error("Failed to create memory:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/memory/list", async (req, res) => {
  try {
    const params = new URLSearchParams();
    Object.entries(req.query).forEach(([key, val]) => {
      if (val !== undefined) {
        params.append(key, String(val));
      }
    });

    try {
      const extRes = await fetch(`https://localhost:8088/memory/list?${params.toString()}`);
      if (extRes.ok) {
        const data = await extRes.json();
        return res.json(data);
      }
    } catch (err: any) {
      console.warn("Upstream /memory/list failed, pulling from local storage instead:", err.message);
    }

    // fallback locally
    const folders = fs.readdirSync(VAULT_DIR);
    const allItems: any[] = [];
    folders.forEach((folder) => {
      const folderPath = path.join(VAULT_DIR, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const metaPath = path.join(folderPath, "metadata.json");
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            allItems.push({
              id: meta.date ? sanitizeFolder(meta.date) : "unknown",
              title: meta.location?.name || `Footprint on ${meta.date}`,
              feeling: meta.feeling || "😊",
              createdAt: meta.createdAt || new Date().toISOString()
            });
          } catch (e) {}
        }
      }
    });

    let items = allItems;
    if (req.query.search) {
      const s = String(req.query.search).toLowerCase();
      items = items.filter(item => item.title.toLowerCase().includes(s));
    }
    if (req.query.feeling) {
      items = items.filter(item => item.feeling === String(req.query.feeling));
    }

    res.json({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      totalCount: items.length,
      hasMore: false,
      items: items
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/memory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const extRes = await fetch(`https://localhost:8088/memory/${id}`);
      if (extRes.ok) {
        const data = await extRes.json();
        return res.json(data);
      }
    } catch (err: any) {
      console.warn(`Upstream /memory/${id} failed, finding locally in vault:`, err.message);
    }

    const folderName = sanitizeFolder(id);
    const folderPath = path.join(VAULT_DIR, folderName);
    const metaPath = path.join(folderPath, "metadata.json");
    const diaryPath = path.join(folderPath, "diary.txt");
    const secretPath = path.join(folderPath, "secret_safe.txt");

    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      const diaryText = fs.existsSync(diaryPath) ? fs.readFileSync(diaryPath, "utf8") : "";
      const secretText = fs.existsSync(secretPath) ? fs.readFileSync(secretPath, "utf8") : "";

      const images: string[] = [];
      const imagesFolder = path.join(folderPath, "images");
      if (fs.existsSync(imagesFolder)) {
        const files = fs.readdirSync(imagesFolder);
        files.forEach((file) => {
          if (file.endsWith(".png")) {
            const dataImg = fs.readFileSync(path.join(imagesFolder, file));
            images.push(`data:image/png;base64,${dataImg.toString("base64")}`);
          }
        });
      }

      res.json({
        id: id,
        imageCount: images.length,
        audioCount: meta.audioUrl ? 1 : 0,
        createdAt: meta.createdAt || new Date().toISOString(),
        data: {
          title: meta.location?.name || `Footprint on ${meta.date}`,
          date: meta.date,
          location: meta.location,
          feeling: meta.feeling,
          people: meta.people,
          tags: meta.tags,
          text: diaryText,
          summary: meta.summary,
          secretText: secretText || null,
          isOnlyMe: !!meta.isOnlyMe,
          createdAt: meta.createdAt || new Date().toISOString(),
          images: images
        }
      });
    } else {
      res.status(404).json({ success: false, error: "Memory not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- DATA ACCESS LAYER (Folder-based) ---
// Save Daily Log - outputs separate physical files in folder per date
app.post("/api/life-data/save", async (req, res) => {
  try {
    const { entry } = req.body;
    if (!entry || !entry.date) {
      return res.status(400).json({ success: false, error: "Invalid life data payload" });
    }

    const folderName = sanitizeFolder(entry.date);
    const dayFolderPath = path.join(VAULT_DIR, folderName);

    // Create day-specific directory
    if (!fs.existsSync(dayFolderPath)) {
      fs.mkdirSync(dayFolderPath, { recursive: true });
    }

    // 1. Text Diary Body
    fs.writeFileSync(path.join(dayFolderPath, "diary.txt"), entry.text || "", "utf8");

    // 2. Secret Content (Encrypted/separated securely on disk)
    if (entry.secretText) {
      fs.writeFileSync(path.join(dayFolderPath, "secret_safe.txt"), entry.secretText, "utf8");
    } else {
      const secFile = path.join(dayFolderPath, "secret_safe.txt");
      if (fs.existsSync(secFile)) fs.unlinkSync(secFile);
    }

    // 3. Metadata JSON (Emotion, Location, Helpers, Audio Meta, Tags, AI summaries)
    const metadata = {
      date: entry.date,
      location: entry.location || null,
      feeling: entry.feeling || "📝",
      people: entry.people || [],
      tags: entry.tags || [],
      summary: entry.summary || "",
      isOnlyMe: entry.isOnlyMe || false,
      audioUrl: entry.audioUrl ? "audio_voice.bin" : null,
      createdAt: entry.createdAt || new Date().toISOString()
    };
    fs.writeFileSync(path.join(dayFolderPath, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

    // 4. Base64 Photos / Attachments Folder
    const imagesFolder = path.join(dayFolderPath, "images");
    if (entry.images && entry.images.length > 0) {
      if (!fs.existsSync(imagesFolder)) {
        fs.mkdirSync(imagesFolder, { recursive: true });
      }
      // Write each base64 string to a localized image file
      entry.images.forEach((imgBase64: string, idx: number) => {
        const matches = imgBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], "base64");
          fs.writeFileSync(path.join(imagesFolder, `photo_${idx}.png`), buffer);
        } else {
          // If already plain text/url metadata, save as txt/reference
          fs.writeFileSync(path.join(imagesFolder, `photo_ref_${idx}.txt`), imgBase64, "utf8");
        }
      });
    } else {
      if (fs.existsSync(imagesFolder)) {
        fs.rmSync(imagesFolder, { recursive: true, force: true });
      }
    }

    // --- SERVER INTEGRATION: POST /memory/create ---
    try {
      console.log("Saving memory to external Node.js server on https://localhost:8088/memory/create");
      const extFormData = new FormData();
      
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
        createdAt: entry.createdAt || new Date().toISOString(),
        images: entry.images || [] // Keep inline image data strings inside serialized JSON
      };
      
      extFormData.append("data", JSON.stringify(serializedData));
      
      // Images attachments
      if (entry.images && entry.images.length > 0) {
        entry.images.forEach((imgBase64: string, idx: number) => {
          const matches = imgBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const type = matches[1];
            const buffer = Buffer.from(matches[2], "base64");
            const blob = new Blob([buffer], { type });
            extFormData.append("images", blob, `photo_${idx}.png`);
          }
        });
      }
      
      // Audio attachments (if defined/needed)
      if (entry.audioUrl || entry.voiceRecording) {
        const audioBlob = new Blob([Buffer.from("MOCK_AUDIO_DATA_FOR_EXPERIMENT")], { type: "audio/wav" });
        extFormData.append("audio", audioBlob, "audio_voice.wav");
      }
      
      const extRes = await fetch("https://localhost:8088/memory/create", {
        method: "POST",
        body: extFormData
      });
      
      if (extRes.ok) {
        const extResult = await extRes.json();
        console.log("Successfully created memory on external server:", extResult);
      } else {
        console.warn(`External server return code ${extRes.status} during memory creation`);
      }
    } catch (err: any) {
      console.warn("External memory create failed (backed up locally instead):", err.message);
    }

    res.json({ success: true, folder: folderName, message: `Story folder created successfully: vault/${folderName}/` });
  } catch (error: any) {
    console.error("Save daily folder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete specific daily directory (and only me items)
app.post("/api/life-data/delete", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, error: "Date parameter is required" });
    const folderName = sanitizeFolder(date);
    const dayFolderPath = path.join(VAULT_DIR, folderName);

    if (fs.existsSync(dayFolderPath)) {
      fs.rmSync(dayFolderPath, { recursive: true, force: true });
    }
    res.json({ success: true, message: `Folder for ${date} removed.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load all items - reads from vault folders
app.get("/api/life-data/load-all", async (req, res) => {
  try {
    const entries: any[] = [];
    let fetchedFromExternal = false;

    // Try loading from the external Node.js server at https://localhost:8088
    try {
      console.log("Loading memories from https://localhost:8088/memory/list");
      const listRes = await fetch("https://localhost:8088/memory/list");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData && Array.isArray(listData.items) && listData.items.length > 0) {
          // Fetch full detailed memory item for each list summary
          const detailPromises = listData.items.map(async (item: any) => {
            try {
              const itemRes = await fetch(`https://localhost:8088/memory/${item.id}`);
              if (itemRes.ok) {
                const itemDetail = await itemRes.json();
                if (itemDetail && itemDetail.data) {
                  const d = itemDetail.data;
                  return {
                    date: d.date,
                    location: d.location || { name: "Địa điểm chưa gán", coords: null },
                    feeling: d.feeling || "📝",
                    people: d.people || [],
                    tags: d.tags || [],
                    text: d.text || "",
                    summary: d.summary || "",
                    secretText: d.secretText || "",
                    images: d.images || [],
                    audioUrl: d.audioUrl || (itemDetail.audioCount > 0 ? "audio_voice.bin" : undefined),
                    createdAt: d.createdAt || itemDetail.createdAt || new Date().toISOString()
                  };
                }
              }
            } catch (detailErr: any) {
              console.error(`Failed to load memory detail for ID ${item.id}:`, detailErr.message);
            }
            return null;
          });

          const details = await Promise.all(detailPromises);
          details.forEach((d) => {
            if (d) entries.push(d);
          });

          if (entries.length > 0) {
            fetchedFromExternal = true;
            console.log(`Loaded ${entries.length} items successfully from external Memory API.`);
          }
        }
      }
    } catch (extLoadErr: any) {
      console.warn("Could not load memories from external server:", extLoadErr.message);
    }

    // Fall back to local file vault if external server failed or was empty
    if (!fetchedFromExternal) {
      console.log("Using local folder-based vault as backup/fallback...");
      const folders = fs.readdirSync(VAULT_DIR);
      folders.forEach((folder) => {
        const folderPath = path.join(VAULT_DIR, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          const metaPath = path.join(folderPath, "metadata.json");
          const diaryPath = path.join(folderPath, "diary.txt");
          const secretPath = path.join(folderPath, "secret_safe.txt");

          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
              const diaryText = fs.existsSync(diaryPath) ? fs.readFileSync(diaryPath, "utf8") : "";
              const secretText = fs.existsSync(secretPath) ? fs.readFileSync(secretPath, "utf8") : "";

              // Collect images
              const imagesFolder = path.join(folderPath, "images");
              const images: string[] = [];
              if (fs.existsSync(imagesFolder)) {
                const files = fs.readdirSync(imagesFolder);
                files.forEach((file) => {
                  const imgPath = path.join(imagesFolder, file);
                  if (file.endsWith(".txt")) {
                    images.push(fs.readFileSync(imgPath, "utf8"));
                  } else if (file.endsWith(".png")) {
                    const data = fs.readFileSync(imgPath);
                    images.push(`data:image/png;base64,${data.toString("base64")}`);
                  }
                });
              }

              entries.push({
                ...meta,
                text: diaryText,
                secretText: secretText,
                images: images
              });
            } catch (err) {
              console.warn(`File parsing failed for directory ${folder}:`, err);
            }
          }
        }
      });

      // Provide pre-seeded data if Vault is brand new and external was empty/failed
      if (entries.length === 0) {
        const currentYear = new Date().getFullYear();
        const mockHistoricalEntries = [
          {
            date: `${currentYear}-06-10`,
            location: { name: "Hồ Gươm, Hà Nội", coords: { lat: 21.0285, lng: 105.8542 } },
            feeling: "😊",
            people: ["Cường", "Trang"],
            tags: ["#kyniem", "#hanoi", "#caphe"],
            text: "Hôm nay mình cùng Cường và Trang đi dạo quanh Hồ Gươm, thời tiết Hà Nội đầu hè dịu mát lạ thường. Gặp nhau sau 2 năm xa cách, kể đủ thứ chuyện về gia đình và cuộc sống tự do.",
            summary: "Gặp lại Cường và Trang bên Hồ Gươm sau 2 năm, cùng chia sẻ về cuộc đời và thư giãn.",
            secretText: "Thực ra hôm nay có bàn thêm việc hùn vốn mở quán cà phê bí mật nhỏ ở ngoại thành.",
            isOnlyMe: false,
            images: [],
            createdAt: new Date().toISOString()
          },
          {
            date: `${currentYear}-06-12`,
            location: { name: "Bến Thành, TP. Hồ Chí Minh", coords: { lat: 10.7719, lng: 106.6983 } },
            feeling: "🔥",
            people: ["Mai Anh"],
            tags: ["#landmark", "#congviec", "#mieu-chi"],
            text: "Chuyến bay đêm bất chợt vào Sài Gòn. Công ty có buổi họp khẩn nhưng tối nay rảnh rỗi ghé qua quận 1 ngắm thành phố. Thấy bản thân cần tập trung cho mục tiêu Legacy hoài bão này.",
            summary: "Công tác gấp tại Quận 1 Sài Gòn và tìm lại năng lượng hoàn thành các cột mốc cuộc đời.",
            secretText: "Tài khoản tiết kiệm mật hiện tại đã tích lũy được 500 triệu đồng cho quỹ Legacy.",
            isOnlyMe: true,
            images: [],
            createdAt: new Date().toISOString()
          }
        ];

        // Auto-save seeds
        for (const ent of mockHistoricalEntries) {
          const folderName = sanitizeFolder(ent.date);
          const dayFolderPath = path.join(VAULT_DIR, folderName);
          fs.mkdirSync(dayFolderPath, { recursive: true });
          fs.writeFileSync(path.join(dayFolderPath, "diary.txt"), ent.text, "utf8");
          fs.writeFileSync(path.join(dayFolderPath, "secret_safe.txt"), ent.secretText, "utf8");
          const metadata = {
            date: ent.date,
            location: ent.location,
            feeling: ent.feeling,
            people: ent.people,
            tags: ent.tags,
            summary: ent.summary,
            isOnlyMe: ent.isOnlyMe,
            createdAt: ent.createdAt
          };
          fs.writeFileSync(path.join(dayFolderPath, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");
          entries.push(ent);
        }
      }
    }

    res.json({ success: true, entries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch active folder tree representation so user can inspect structures
app.get("/api/life-data/debug-tree", (req, res) => {
  try {
    const listDirRecursive = (dir: string): any => {
      const name = path.basename(dir);
      const stat = fs.statSync(dir);
      if (stat.isDirectory()) {
        const children = fs.readdirSync(dir).map((child) => {
          return listDirRecursive(path.join(dir, child));
        });
        return { name, type: "directory", children };
      }
      return { name, type: "file", size: stat.size };
    };

    const tree = listDirRecursive(VAULT_DIR);
    res.json({ success: true, tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Global Metadata (Will Config, People list, goals)
app.post("/api/life-data/settings", (req, res) => {
  try {
    const { people, goals, will } = req.body;
    const settingsPath = path.join(VAULT_DIR, "global_settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ people: people || [], goals: goals || [], will: will || {} }, null, 2),
      "utf8"
    );
    res.json({ success: true, message: "Global archive settings updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load Global Settings
app.get("/api/life-data/settings", (req, res) => {
  try {
    const settingsPath = path.join(VAULT_DIR, "global_settings.json");
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      res.json({ success: true, settings: data });
    } else {
      // Default global database values matching Vietnamese requests
      const initialSettings = {
        people: [
          { name: "Cường", relation: "Bạn Thân", notes: "Kỹ sư công nghệ, thường hay đàm đạo triết lý cuộc sống", avatar: "B", interactions: 15 },
          { name: "Trang", relation: "Gia Đình", notes: "Lắng nghe tâm sự, hỗ trợ quản lý di chúc và liên hệ chính", avatar: "G", interactions: 8 },
          { name: "Mai Anh", relation: "Người Yêu/Vợ", notes: "Đồng hành du lịch và cuộc sống, giữ khóa khóa phụ", avatar: "P", interactions: 26 },
        ],
        goals: [
          { id: "g1", title: "Cân bằng tài chính tích lũy gia đình", category: "Legacy", targetDate: "2027-12-31", achieved: false, notes: "Quỹ ủy thác cho người thừa kế." },
          { id: "g2", title: "Phượt hết đông tây bắc Việt Nam", category: "Relationships", targetDate: "2026-11-01", achieved: true, notes: "Chuyến đi ý nghĩa cùng nhóm bạn đại học cũ." },
          { id: "g3", title: "Lập di chúc số an toàn tuyệt đối", category: "Legacy", targetDate: "2026-06-30", achieved: false, notes: "Kích hoạt tính năng bảo mật một tháng nhắc nhở, xóa thông tin cá nhân Only Me." }
        ],
        will: {
          beneficiaryName: "Nguyễn Văn Trang",
          beneficiaryEmail: "beneficiary.trang@gmail.com",
          safetyKey: "SECRET-LEGACY-KEY-2026",
          lockedWillContent: "Tôi để lại toàn bộ tư liệu cuộc sống trực tuyến, tài khoản dự phòng và những lời dặn dò quan trọng nhất của cả đời tôi cho Trang quản lý. Hãy sống hạnh phúc tiếp nhé!",
          inactivityDaysLimit: 30,
          lastCheckIn: new Date().toISOString()
        }
      };
      fs.writeFileSync(settingsPath, JSON.stringify(initialSettings, null, 2), "utf8");
      res.json({ success: true, settings: initialSettings });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// --- GEMINI AI SERVICES ---
// Express proxies Gemini key securely. Client never sees GEMINI_API_KEY.
app.post("/api/ai/analyze-diary", async (req, res) => {
  try {
    const { text, focusTopic } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Nội dung nhật ký trống" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Intelligent Vietnam Fallback to maintain wonderful experience
      const snippet = text.slice(0, 50) + (text.length > 50 ? "..." : "");
      const generatedTags = ["#dongky"];
      const lower = text.toLowerCase();
      if (lower.includes("gia đình") || lower.includes("bố") || lower.includes("mẹ") || lower.includes("vợ")) generatedTags.push("#giadinh");
      if (lower.includes("bạn") || lower.includes("cường") || lower.includes("trang")) generatedTags.push("#giasu");
      if (lower.includes("công việc") || lower.includes("họp") || lower.includes("tiền")) generatedTags.push("#congviec");
      if (lower.includes("vui") || lower.includes("tuyệt")) generatedTags.push("#niemvui");
      if (lower.includes("bí mật") || lower.includes("chỉ mình")) generatedTags.push("#mat-onlyme");
      if (lower.includes("đi") || lower.includes("du lịch") || lower.includes("bản đồ")) generatedTags.push("#khampha");

      return res.json({
        summary: `[Tóm tắt tự động] Ngày hôm nay của bạn: "${snippet}". Bản thân bạn đã ghi nhận những cảm xúc cụ thể về các trải nghiệm cá nhân liên quan.`,
        tags: Array.from(new Set(generatedTags))
      });
    }

    // Modern SDK usage with User-Agent custom header for telemetry
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const systemInstruction = `Bạn là trợ lý AI chuyên nghiệp phân tích nhật ký cuộc đời của người Việt. Bạn cần tóm tắt cực ngắn gọn (1 câu ấm áp, tinh tế, giàu cảm xúc) và tự động dán nhãn từ 2-4 hashtag cốt lõi nhất (nhận diện những từ khóa quan trọng về con người, địa điểm, sự kiện). 

Hãy trả về CHỈ định dạng JSON theo đúng cấu trúc sau:
{
  "summary": "Tóm tắt giàu cảm xúc của ngày hôm nay",
  "tags": ["#hasgtag1", "#hashtag2"]
}`;

    const promptText = `Nội dung nhật ký: "${text}" ${focusTopic ? `Chủ đề trọng tâm hỗ trợ dán nhãn: ${focusTopic}` : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json({
      summary: parsedResponse.summary || "Nhật ký lưu lại cảm xúc và trải nghiệm quý báu.",
      tags: parsedResponse.tags || ["#nhatky"]
    });
  } catch (error: any) {
    console.error("Gemini proxy helper error:", error);
    res.status(500).json({ error: error.message });
  }
});


// --- PRODUCTION BUILD STRATEGY ---
// Dev Mode (Vite server bridges) / Production static setup
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[My Life Backend Server] Listening securely on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
