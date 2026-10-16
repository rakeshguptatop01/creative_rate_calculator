// server.js — Local Development & API Proxy Server
// Serves static files and routes /api/parse to Gemini 1.5 Flash using .env.local

const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env.local if present
let apiKey = process.env.GEMINI_API_KEY || "";
try {
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=")) {
        apiKey = trimmed.split("=")[1].trim();
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env.local", e);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  console.log("REQ:", req.method, pathname);

  // Route: /api/settings (Multi-user sync & data persistence)
  const DATA_DIR = path.join(__dirname, "data");
  const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

  if (pathname === "/api/settings") {
    if (req.method === "GET") {
      if (fs.existsSync(SETTINGS_FILE)) {
        try {
          const content = fs.readFileSync(SETTINGS_FILE, "utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(content);
        } catch (e) {
          console.error("Error reading settings.json", e);
        }
      }
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ notFound: true }));
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body || "{}");
          if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
          }
          fs.writeFileSync(SETTINGS_FILE, JSON.stringify(parsed, null, 2), "utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
        } catch (err) {
          console.error("Error saving settings.json", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Failed to persist settings", message: err.message }));
        }
      });
      return;
    }
  }

  // Route: /api/parse
  if (pathname === "/api/parse" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const prompt = parsed.prompt || "";
        if (!prompt) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing prompt" }));
        }

        if (!apiKey) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "GEMINI_API_KEY not configured" }));
        }

        const systemInstruction = `You are a commercial digital press estimator AI for print shops.
Analyze the user's printing inquiry and extract job specifications into strict JSON format.

JSON Schema:
{
  "mode": "standard" | "brochure",
  "qty": integer or null (total finished pieces or books ordered. If NO quantity is mentioned in the prompt, return null),
  "hasExplicitQty": boolean (true if quantity was explicitly stated by user, false if not mentioned),
  "preset": "a3" | "a4" | "a5" | "a6" | "a7" | "custom",
  "width": number (width in inches, e.g. 2.25, default to 0 if not specified),
  "height": number (height in inches, e.g. 6.6, default to 0 if not specified),
  "unit": "in",
  "isDieCut": boolean (true if plotter die cut, sticker contour, round, circle, kiss cut),
  "substrateMatch": string (e.g. "White Vinyl", "Clear Vinyl", "Golden Vinyl", "Normal Gumming", "AD Gumming", "Art Paper 130 GSM", "Art Card 300 GSM", "Texture Paper 250 GSM"),
  "pages": integer (total pages for booklet/brochure, e.g. 4 for 4-page brochure, 16 for standard booklet),
  "is2Fold": boolean (true if 2-fold, tri-fold, or 3-panel brochure),
  "binding": "none" | "saddle" | "perfect" | "wiro" ("none" if single fold, loose fold, or no binding; "saddle" for staple/center pin; "perfect" for hot melt; "wiro" for spiral),
  "printSides": "s" | "d" ("d" if F/B, front and back, both sides printed, double sided; "s" if single side only),
  "lamination": "n" | "s" | "d" ("d" if both sides, both side lamination, double lamination; "s" if single/outer lamination; "n" if none)
}

Rules:
- CRITICAL: DO NOT confuse page count with quantity! "4 pages F/B" means pages=4 and printSides="d", NOT qty=4! If the user did not say how many copies/books/pieces they want, set qty=null and hasExplicitQty=false.
- If A5 is mentioned, preset="a5". If A4, preset="a4". If A6, preset="a6". If A7, preset="a7". If A3, preset="a3".
- "Single fold booklet" or "1 fold" or "loose fold" means mode="brochure", pages=4, and binding="none".
- "both side lamination" or "both sides glossy/matt" means lamination="d". "single lamination", "outer lamination" means lamination="s". "no lamination" means lamination="n".
- "F/B", "front and back", "both sides print" means printSides="d".
- Output ONLY pure JSON. No markdown backticks, no explanations.`;

        const candidateModels = [
          "gemini-3.5-flash",
          "gemini-3.5-flash-lite",
          "gemini-flash-latest",
          "gemini-3.8-flash"
        ];

        let resultJson = null;
        let lastErrorText = "";

        for (const model of candidateModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemInstruction}\n\nCustomer Inquiry: "${prompt}"` }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1
                }
              })
            });

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawContent) {
                resultJson = JSON.parse(rawContent.trim());
                break;
              }
            } else {
              lastErrorText = await geminiRes.text();
            }
          } catch (e) {
            lastErrorText = e.message;
          }
        }

        if (resultJson) {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(resultJson));
        }

        res.writeHead(502, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Gemini models busy", details: lastErrorText }));

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(resultJson));
      } catch (err) {
        console.error("API error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Processing failed", message: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  const relFile = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  let filePath = path.join(__dirname, "public", relFile);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, relFile);
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/ (with Gemini API proxy enabled)`);
});
