// api/parse.js — Vercel Serverless Function
// Securely processes AI print inquiries without exposing the API key on the frontend

module.exports = async function handler(req, res) {
  // Set CORS headers for security and flexibility
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) {}
  }
  const { prompt } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt" });
  }

  // Read API Key from Server Environment Variable (process.env.GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key is not configured in process.env.GEMINI_API_KEY" });
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemInstruction}\n\nCustomer Inquiry: "${prompt}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          resultJson = JSON.parse(rawContent.trim());
          break;
        }
      } else {
        lastErrorText = await response.text();
      }
    } catch (e) {
      lastErrorText = e.message;
    }
  }

  if (resultJson) {
    return res.status(200).json(resultJson);
  }
  return res.status(502).json({ error: "Gemini models busy", details: lastErrorText });
}
