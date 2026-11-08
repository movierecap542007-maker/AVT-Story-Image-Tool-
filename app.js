const tabs = document.querySelectorAll(".tab");
const form = document.querySelector("#create-form");
const storyOptions = document.querySelector("#story-options");
const imageOptions = document.querySelector("#image-options");
const buttonText = document.querySelector("#button-text");
const generateButton = document.querySelector("#generate");
const statusBox = document.querySelector("#status");
const resultBox = document.querySelector("#result");
const copyButton = document.querySelector("#copy");
let currentType = "story";

tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(item => item.classList.toggle("active", item === tab));
  currentType = tab.dataset.type;
  const isStory = currentType === "story";
  storyOptions.classList.toggle("hidden", !isStory);
  imageOptions.classList.toggle("hidden", isStory);
  buttonText.textContent = isStory ? "ဇာတ်လမ်း ဖန်တီးမယ်" : "Image Prompt ဖန်တီးမယ်";
  statusBox.textContent = isStory ? "ဇာတ်လမ်းအတွက် အကြောင်းအရာ ဖြည့်ပေးပါ။" : "ပုံဖန်တီးဖို့ Prompt အတွက် အကြောင်းအရာ ဖြည့်ပေးပါ။";
  resultBox.textContent = "";
  copyButton.disabled = true;
}));

form.addEventListener("submit", async event => {
  event.preventDefault();
  const topic = document.querySelector("#topic").value.trim();
  if (!topic) return;
  generateButton.disabled = true;
  buttonText.textContent = "ဖန်တီးနေသည်...";
  statusBox.textContent = "AI က စဉ်းစားပြီး ဖန်တီးနေပါတယ်။ ခဏစောင့်ပေးပါ...";
  resultBox.textContent = "";
  copyButton.disabled = true;
  const payload = {
    type: currentType,
    topic,
    language: document.querySelector("#language").value,
    genre: document.querySelector("#genre").value,
    characters: document.querySelector("#characters").value.trim(),
    setting: document.querySelector("#setting").value.trim(),
    length: document.querySelector("#length").value,
    style: currentType === "story"
      ? document.querySelector("#style").value
      : document.querySelector("#image-style").value
  };
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "တစ်ခုခု မှားယွင်းနေပါတယ်။");
    resultBox.textContent = data.result;
    statusBox.textContent = "ပြီးပါပြီ။ ရလဒ်ကို ကူးယူအသုံးပြုနိုင်ပါတယ်။";
    copyButton.disabled = false;
  } catch (error) {
    statusBox.textContent = error.message;
  } finally {
    generateButton.disabled = false;
    buttonText.textContent = currentType === "story" ? "ဇာတ်လမ်း ဖန်တီးမယ်" : "Image Prompt ဖန်တီးမယ်";
  }
});

copyButton.addEventListener("click", async () => {
  if (!resultBox.textContent) return;
  try {
    await navigator.clipboard.writeText(resultBox.textContent);
    copyButton.textContent = "ကူးပြီးပါပြီ ✓";
    setTimeout(() => copyButton.textContent = "ကူးယူရန်", 1600);
  } catch (_) {
    statusBox.textContent = "စာသားကို ဖိပြီး Select All လုပ်ကာ ကူးယူပါ။";
  }
});