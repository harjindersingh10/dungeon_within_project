// result.js — fetches character result from backend API
const session = JSON.parse(localStorage.getItem("dungeonSession"));
const $r = id => document.getElementById(id);

if (!session || !session.sessionId) {
  localStorage.removeItem("dungeonSession");
  location.href = "profile.html";
  throw new Error("No session");
}

const GLYPHS = { titan: "ᛏ", cipher: "◈", levian: "🐉", noctis: "☾", emberwraith: "✦" };

const VISUAL_MAP = {
  "TITAN": "titan",
  "CIPHER": "cipher",
  "LEVIAN": "levian",
  "NOCTIS": "noctis",
  "EMBERWRAITH": "emberwraith"
};

const LOCAL_STATS = {
  "TITAN":       { courage:92, logic:68, empathy:57, leadership:95, risk:78, creativity:49, loyalty:91, chaos:28 },
  "CIPHER":      { courage:61, logic:97, empathy:62, leadership:72, risk:44, creativity:94, loyalty:71, chaos:22 },
  "LEVIAN":      { courage:84, logic:41, empathy:38, leadership:65, risk:98, creativity:91, loyalty:52, chaos:100 },
  "NOCTIS":      { courage:55, logic:86, empathy:92, leadership:58, risk:33, creativity:79, loyalty:96, chaos:19 },
  "EMBERWRAITH": { courage:88, logic:51, empathy:88, leadership:67, risk:76, creativity:86, loyalty:90, chaos:73 }
};

const STAT_LABELS = {
  courage:"COURAGE", logic:"LOGIC", empathy:"EMPATHY", leadership:"LEADERSHIP",
  risk:"RISK", creativity:"CREATIVITY", loyalty:"LOYALTY", chaos:"CHAOS"
};

function characterGlyph(visual) {
  const g = GLYPHS[visual] || "✦";
  return `<div class="glyph">${g}</div><div class="glyph-ring"></div><div class="glyph-smoke"></div>`;
}

function characterArtHTML(visual) {
  const imgSrc = `assets/images/${visual}.png.png`;
  return `
    <img class="char-img" src="${imgSrc}"
         alt="${visual}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"
         onload="this.nextElementSibling.style.display='none'">
    <div class="char-glyph-fallback">${characterGlyph(visual)}</div>
  `;
}

function renderResult(character, confidence) {
  $r("characterSpecies").textContent  = character.species;
  $r("characterName").textContent     = character.character_name;
  $r("characterTitle").textContent    = character.title;
  $r("characterDescription").textContent = `"${character.description}"`;
  $r("strength").textContent  = character.strengths;
  $r("weakness").textContent  = character.weaknesses;
  $r("ability").textContent   = character.special_ability;

  const visual = VISUAL_MAP[character.character_name.toUpperCase()] || "titan";
  const stats  = LOCAL_STATS[character.character_name.toUpperCase()] || {};

  $r("stats").innerHTML = "";
  $r("cardStats").innerHTML = "";

  ["courage","logic","empathy","leadership","risk","creativity","loyalty","chaos"].forEach(dim => {
    const val = stats[dim] || 0;
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span>${STAT_LABELS[dim]}</span>
      <div class="stat-bar"><i style="width:${val}%"></i></div>
      <strong>${val}</strong>`;
    $r("stats").appendChild(row);

    const mini = document.createElement("div");
    mini.className = "mini-stat";
    mini.innerHTML = `<span>${STAT_LABELS[dim]}</span><b>${val}</b>`;
    $r("cardStats").appendChild(mini);
  });

  [$r("characterArt"), $r("cardArt")].forEach(el => {
    el.className = `character-art ${visual}`;
    el.innerHTML = characterArtHTML(visual);
  });

  $r("cardName").textContent    = character.character_name;
  $r("cardSubtitle").textContent = `${character.species} • ${character.title}`;
}

async function showAnalysis() {
  const lines = [
    "Reading the echoes left behind.",
    "Measuring the courage you never named.",
    "Tracing the choices between the choices.",
    "The ancient seals are opening."
  ];
  let i = 0;
  const line = $r("analysisLine");
  const interval = setInterval(() => {
    line.style.opacity = "0";
    setTimeout(() => { line.textContent = lines[i++ % lines.length]; line.style.opacity = "1"; }, 250);
  }, 850);

  // Fetch result from backend in parallel with the animation
  let data;
  try {
    const [result] = await Promise.all([
      apiRequest(`/sessions/${session.sessionId}/result`),
      new Promise(resolve => setTimeout(resolve, 3600)) // min animation time
    ]);
    data = result;
  } catch (e) {
    clearInterval(interval);
    line.textContent = "⚠ " + e.message;
    return;
  }

  clearInterval(interval);
  renderResult(data.character, data.confidence_score);

  $r("analysisScreen").classList.add("hidden");
  $r("revealScreen").classList.remove("hidden");
  requestAnimationFrame(() => $r("revealScreen").classList.add("revealed"));
}

$r("playAgain").addEventListener("click", () => {
  localStorage.removeItem("dungeonSession");
  location.href = "profile.html";
});

showAnalysis();
