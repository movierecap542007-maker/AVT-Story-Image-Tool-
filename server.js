const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const ROOT = path.join(__dirname, "public");
const MIME = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};

function send(res, status, data, type="application/json; charset=utf-8") {
  res.writeHead(status, {"Content-Type":type, "Cache-Control":"no-store"});
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let raw=""; req.on("data",c=>{raw+=c; if(raw.length>1e6) reject(new Error("Request too large"));});
    req.on("end",()=>{try{resolve(JSON.parse(raw||"{}"));}catch(e){reject(e);}});
    req.on("error",reject);
  });
}
const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if(req.method==="GET" && url.pathname==="/api/health") return send(res,200,{ok:true});
  if(req.method==="POST" && url.pathname==="/api/generate") {
    try {
      const body=await readBody(req);
      const {API_BASE_URL,API_KEY,MODEL}=process.env;
      if(!API_KEY || !MODEL) return send(res,500,{error:"Server API settings are missing. Check API_KEY and MODEL in hosting settings."});
      const seconds=Number(body.durationSeconds);
      if(!Number.isInteger(seconds) || seconds<10 || seconds>3600 || seconds%10!==0) return send(res,400,{error:"Duration must be a multiple of 10 seconds, from 10 seconds to 60 minutes."});
      const scenes=seconds/10;
      const clean = v => String(v||"").trim().slice(0,3000);
      const details = {
        language: clean(body.language)||"Burmese",
        platform: clean(body.platform)||"TikTok 9:16",
        genre: clean(body.genre)||"Adventure",
        idea: clean(body.idea),
        characterCount: Math.max(1,Math.min(6,Number(body.characterCount)||2)),
        characters: clean(body.characters),
        clothing: clean(body.clothing),
        location: clean(body.location),
        voiceMode: clean(body.voiceMode)||"Character dialogue",
        tone: clean(body.tone)||"Cinematic"
      };
      const prompt = `Create a complete short-film plan in ${details.language}. Return ONLY valid JSON, no markdown. The requested total duration is exactly ${seconds} seconds. Create exactly ${scenes} scenes, each exactly 10 seconds. Keep story continuity and character identity consistent across all scenes. Do not add video generation claims; produce prompts for an external video generator.
User settings: ${JSON.stringify(details)}
Return this JSON shape:
{
 "title":"...",
 "logline":"...",
 "characterBible":[{"name":"...","role":"...","age":"...","appearance":"...","outfit":"...","voice":"..."}],
 "scenes":[
  {"scene":1,"durationSeconds":10,"timecode":"00:00-00:10","location":"...","action":"...","camera":"...","imagePrompt":"Detailed still-image prompt in English, preserving character appearance and outfit","videoPrompt":"Detailed 10-second video prompt in English, including motion, camera movement, lighting, continuity and aspect ratio","dialogue":[{"speaker":"Character name or Narrator","delivery":"...","text":"Short speakable line"}],"sound":"...","transition":"..."}
 ]
}
Exactly ${scenes} scene objects. Dialogue mode: ${details.voiceMode}. If narrator only, dialogue speaker should be Narrator. If character speaks, use character names. If mixed, use both. Keep dialogue short enough to fit the 10-second scene. Make the image and video prompts practical and visually specific. No copyrighted existing characters.`;
      const base=(API_BASE_URL||"https://api.groq.com/openai/v1").replace(/\/+$/,"");
      const response=await fetch(base+"/chat/completions",{
        method:"POST",
        headers:{"Authorization":"Bearer "+API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({model:MODEL,temperature:0.8,max_tokens:Math.min(12000,1800+scenes*450),messages:[
          {role:"system",content:"You are an expert screenwriter and video-prompt designer. Follow requested JSON schema exactly."},
          {role:"user",content:prompt}
        ]})
      });
      const data=await response.json();
      if(!response.ok) return send(res,response.status,{error:data.error?.message||"AI provider request failed. Check model and API settings."});
      const content=data.choices?.[0]?.message?.content||"";
      let parsed;
      try {
        const cleaned=content.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
        parsed=JSON.parse(cleaned);
      } catch(e) { return send(res,502,{error:"AI returned an unexpected format. Please try again with a shorter duration."}); }
      return send(res,200,parsed);
    } catch(e) { return send(res,500,{error:e.message||"Something went wrong."}); }
  }
  if(req.method==="GET") {
    let requested=decodeURIComponent(url.pathname==="/" ? "/index.html" : url.pathname);
    const file=path.normalize(path.join(ROOT,requested));
    if(!file.startsWith(ROOT)) return send(res,403,{error:"Forbidden"});
    fs.readFile(file,(err,buf)=>err?send(res,404,"Not found","text/plain; charset=utf-8"):send(res,200,buf,MIME[path.extname(file)]||"application/octet-stream"));
    return;
  }
  send(res,404,{error:"Not found"});
});
server.listen(PORT,"0.0.0.0",()=>console.log(`AVT Story Video Studio running on port ${PORT}`));
