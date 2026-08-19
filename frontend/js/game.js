let session = JSON.parse(localStorage.getItem("dungeonSession"));

if (!session || (API_CONFIG.USE_API && (!session.sessionId || !session.customerId))) {
  localStorage.removeItem("dungeonSession");
  location.href = "profile.html";
  throw new Error("No valid dungeon session");
}

const $ = id => document.getElementById(id);
$("playerName").textContent = session.fantasyName.toUpperCase();

let currentIndex = session.currentQuestion || 0;
let locked = false;
let currentScenario = null; // holds API scenario when USE_API is true

async function renderScenario() {
  locked = false;
  $("saveState").textContent = "TRIAL READY";

  let scenario;

  if (API_CONFIG.USE_API) {
    try {
      scenario = await apiRequest(`/scenarios/next?session_id=${session.sessionId}`);
    } catch (e) {
      $("scenarioText").textContent = "⚠ " + e.message;
      $("answers").innerHTML = `<p style="color:#c97">Could not load scenario. Make sure the backend is running at http://127.0.0.1:8000</p>`;
      return;
    }
    currentScenario = scenario;
    currentIndex = scenario.question_number - 1;

    $("questionNumber").textContent = String(scenario.question_number).padStart(2, "0");
    $("progressBar").style.width = `${((scenario.question_number - 1) / 10) * 100}%`;
    $("chapterLabel").textContent = scenario.chapter || `CHAPTER ${Math.ceil(scenario.question_number / 3)}`;
    $("scenarioTitle").textContent = scenario.title || `TRIAL ${scenario.question_number}`;
    $("scenarioKicker").textContent = scenario.kicker || "THE DUNGEON SPEAKS";
    $("scenarioText").textContent = scenario.scenario_text;
    $("scenarioHint").textContent = scenario.hint || "";

    const atmosphere = document.querySelector(".scenario-atmosphere");
    atmosphere.className = `scenario-atmosphere atmosphere-${(currentIndex % 4) + 1}`;

    const answers = $("answers");
    answers.innerHTML = "";
    scenario.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "answer-btn";
      button.innerHTML = `
        <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
        <span>${option.option_text}</span>
        <b>◇</b>
      `;
      button.addEventListener("click", () => chooseAnswer(option, button));
      answers.appendChild(button);
    });

  } else {
    scenario = SCENARIOS[currentIndex];
    $("questionNumber").textContent = String(currentIndex + 1).padStart(2, "0");
    $("progressBar").style.width = `${(currentIndex / SCENARIOS.length) * 100}%`;
    $("chapterLabel").textContent = scenario.chapter;
    $("scenarioTitle").textContent = scenario.title;
    $("scenarioKicker").textContent = scenario.kicker;
    $("scenarioText").textContent = scenario.text;
    $("scenarioHint").textContent = scenario.hint;

    const atmosphere = document.querySelector(".scenario-atmosphere");
    atmosphere.className = `scenario-atmosphere atmosphere-${(currentIndex % 4) + 1}`;

    const answers = $("answers");
    answers.innerHTML = "";
    scenario.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.className = "answer-btn";
      button.innerHTML = `
        <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
        <span>${option.text}</span>
        <b>◇</b>
      `;
      button.addEventListener("click", () => chooseAnswer(option, button));
      answers.appendChild(button);
    });
  }
}

async function chooseAnswer(option, selectedButton) {
  if (locked) return;
  locked = true;

  const started = session.answerStartedAt || Date.now();
  const timeTaken = Math.max(250, Date.now() - started);

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
  selectedButton.classList.add("selected-answer");

  if (API_CONFIG.USE_API) {
    try {
      const res = await apiRequest("/responses", {
        method: "POST",
        body: JSON.stringify({
          session_id: session.sessionId,
          customer_id: session.customerId,
          scenario_id: currentScenario.scenario_id,
          option_id: option.option_id,
          question_number: currentScenario.question_number,
          time_taken_ms: timeTaken
        })
      });
      $("saveState").textContent = "CHOICE RECORDED";
      showToast(res.completed ? "The final seal breaks..." : "The dungeon remembers.");
      setTimeout(() => {
        if (res.completed) {
          location.href = "result.html";
        } else {
          session.currentQuestion = res.next_question_number - 1;
          session.answerStartedAt = Date.now();
          localStorage.setItem("dungeonSession", JSON.stringify(session));
          renderScenario();
        }
      }, 720);
    } catch (e) {
      showToast(e.message);
      locked = false;
    }
  } else {
    Object.entries(option.score).forEach(([dimension, value]) => {
      session.scores[dimension] = (session.scores[dimension] || 0) + value;
    });
    session.answers.push({
      scenarioId: SCENARIOS[currentIndex].id,
      optionId: option.id,
      questionNumber: currentIndex + 1,
      timeTakenMs: timeTaken
    });
    session.currentQuestion = currentIndex + 1;
    session.answerStartedAt = null;
    localStorage.setItem("dungeonSession", JSON.stringify(session));
    $("saveState").textContent = "CHOICE RECORDED";
    showToast(currentIndex === SCENARIOS.length - 1 ? "The final seal breaks..." : "The dungeon remembers.");
    setTimeout(() => {
      if (currentIndex >= SCENARIOS.length - 1) {
        location.href = "result.html";
      } else {
        currentIndex++;
        session.currentQuestion = currentIndex;
        session.answerStartedAt = Date.now();
        localStorage.setItem("dungeonSession", JSON.stringify(session));
        renderScenario();
      }
    }, 720);
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 650);
}

$("musicToggle").addEventListener("click", () => {
  const muted = AUDIO.toggle();
  $("musicToggle").textContent = muted ? "♩" : "♫";
  showToast(muted ? "Silence falls." : "The dungeon hums to life.");
});

session.answerStartedAt = Date.now();
localStorage.setItem("dungeonSession", JSON.stringify(session));
renderScenario();
