const form=document.querySelector("#creator"),statusBox=document.querySelector("#status"),results=document.querySelector("#results"),duration=document.querySelector("#duration");
function updateCount(){const s=Number(duration.value);document.querySelector("#sceneCount").textContent=`${s/60} မိနစ် = ၁၀ စက္ကန့်စီ Scene ${s/10} ခု`;}
duration.addEventListener("change",updateCount);updateCount();
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function block(label,value){return `<p><strong>${esc(label)}:</strong><br>${esc(value||"-")}</p>`;}
let allText="";
form.addEventListener("submit",async e=>{
 e.preventDefault();const button=document.querySelector("#submit");button.disabled=true;button.textContent="AI က ဖန်တီးနေပါတယ်...";statusBox.textContent="ခဏစောင့်ပေးပါနော်။ Scene အရေအတွက်များရင် အချိန်ပိုကြာနိုင်ပါတယ်။";results.hidden=true;
 try{
  const data=Object.fromEntries(new FormData(form).entries());data.durationSeconds=Number(data.durationSeconds);data.characterCount=Number(data.characterCount);
  const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  const out=await res.json();if(!res.ok)throw new Error(out.error||"ဖန်တီးလို့မရပါ။");
  document.querySelector("#title").textContent=out.title||"ဇာတ်လမ်း";document.querySelector("#logline").textContent=out.logline||"";
  document.querySelector("#charactersOut").innerHTML="<h2>ဇာတ်ကောင်များ</h2>"+(out.characterBible||[]).map(c=>`<div class="character"><h3>${esc(c.name)} — ${esc(c.role)}</h3>${block("အသက်",c.age)}${block("ပုံစံ",c.appearance)}${block("အဝတ်အစား",c.outfit)}${block("အသံ",c.voice)}</div>`).join("");
  document.querySelector("#scenes").innerHTML="<h2>Scene များ</h2>"+(out.scenes||[]).map(s=>`<article class="scene"><h3>Scene ${esc(s.scene)} · ${esc(s.durationSeconds)} စက္ကန့် · ${esc(s.timecode)}</h3>${block("နေရာ",s.location)}${block("ဖြစ်ပျက်မှု",s.action)}${block("Camera",s.camera)}${block("Image Prompt",s.imagePrompt)}${block("Video Prompt",s.videoPrompt)}${block("Dialogue", (s.dialogue||[]).map(d=>`${d.speaker} (${d.delivery}): ${d.text}`).join("\\n"))}${block("အသံနှင့် တေးဂီတ",s.sound)}${block("နောက် Scene သို့",s.transition)}<button class="copy secondary" type="button" data-copy="${encodeURIComponent([s.imagePrompt,s.videoPrompt,(s.dialogue||[]).map(d=>d.speaker+": "+d.text).join("\\n")].join("\\n\\n"))}">ဒီ Scene ကို Copy ကူးမယ်</button></article>`).join("");
  allText=JSON.stringify(out,null,2);results.hidden=false;statusBox.textContent="အောင်မြင်ပါပြီ။ ဇာတ်လမ်းနဲ့ Scene များကို အောက်မှာ ကြည့်နိုင်ပါပြီ။";results.scrollIntoView({behavior:"smooth"});
 }catch(err){statusBox.textContent="အမှား: "+err.message;}finally{button.disabled=false;button.textContent="✨ AI နဲ့ ဇာတ်လမ်းဖန်တီးမယ်";}
});
document.addEventListener("click",async e=>{const b=e.target.closest("button[data-copy]");if(b){try{await navigator.clipboard.writeText(decodeURIComponent(b.dataset.copy));b.textContent="ကူးပြီးပါပြီ ✓";}catch{b.textContent="Copy မရပါ";}}});
document.querySelector("#copyAll").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(allText);document.querySelector("#copyAll").textContent="ကူးပြီးပါပြီ ✓";}catch{statusBox.textContent="Copy မရပါ။";}});
