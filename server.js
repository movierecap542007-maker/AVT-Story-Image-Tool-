const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

// Load .env without requiring an extra dependency.
try {
  const envText = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch (_) {}

function send(res, status, data, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("Request too large");
  }
  return JSON.parse(raw || "{}");
}

async function generate(req, res) {
  if (!process.env.API_KEY || !process.env.API_BASE_URL || !process.env.MODEL) {
    return send(res, 503, { error: "API မချိတ်ရသေးပါ။ .env ဖိုင်ထဲမှာ API_BASE_URL, API_KEY နဲ့ MODEL ကို ဖြည့်ပါ။" });
  }
  let body;
  try { body = await readBody(req); } catch (_) {
    return send(res, 400, { error: "ပေးပို့တဲ့အချက်အလက်ကို ဖတ်မရပါ။" });
  }
  const { type, language, genre, topic, characters, setting, length, style } = body;
  if (!["story", "imagePrompt"].includes(type) || !String(topic || "").trim()) {
    return send(res, 400, { error: "လိုအပ်တဲ့အချက်အလက်တွေကို ဖြည့်ပေးပါ။" });
  }

  const lang = language === "English" ? "English" : "Burmese";
  const instructions = type === "story"
    ? `Write an original ${lang} story. Genre: ${genre || "Adventure"}. Topic/idea: ${topic}. Characters: ${characters || "Create suitable characters"}. Setting: ${setting || "Choose a fitting setting"}. Length: ${length || "Medium"}. Style: ${style || "Engaging and vivid"}. Give it a suitable title. Keep the language natural and coherent.`
    : `Create a detailed image-generation prompt in ${lang}. Subject/topic: ${topic}. Genre/mood: ${genre || "Cinematic"}. Characters: ${characters || "As appropriate"}. Setting: ${setting || "Choose a fitting setting"}. Visual style: ${style || "High-quality cinematic digital art"}. Include composition, lighting, colors, camera/framing, atmosphere, and important visual details. Do not create a story; output a ready-to-copy image prompt.`;

  try {
    const base = process.env.API_BASE_URL.replace(/\/+$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MODEL,
        messages: [
          { role: "system", content: "You are a skilled creative writing and visual-prompt assistant. Follow the requested language exactly. Do not claim to generate images; only write text." },
          { role: "user", content: instructions }
        ],
        temperature: 0.8
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.error?.message || data.message || `Provider returned HTTP ${response.status}`;
      return send(res, 502, { error: `AI API အမှား: ${detail}` });
    }
    const result = data.choices?.[0]?.message?.content;
    if (!result) return send(res, 502, { error: "AI ဆီက စာသားပြန်မရပါ။ Model/API setting ကို စစ်ဆေးပါ။" });
    return send(res, 200, { result });
  } catch (err) {
    return send(res, 502, { error: `API ချိတ်ဆက်မရပါ: ${err.message}` });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/generate") return generate(req, res);
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(PUBLIC, requested);
  if (!file.startsWith(PUBLIC + path.sep) && file !== path.join(PUBLIC, "index.html")) {
    return send(res, 403, { error: "Forbidden" });
  }
  fs.readFile(file, (err, content) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    send(res, 200, content, MIME[path.extname(file)] || "application/octet-stream");
  });
});

server.listen(PORT, () => console.log(`AVT Story & Image Prompt Tool running on http://localhost:${PORT}`));