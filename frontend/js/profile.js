const selections = {
  ageGroup: "",
  adventureStyle: "",
  selfDescription: ""
};

function setupChoiceGroup(id, key) {
  const group = document.getElementById(id);
  group.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selections[key] = btn.dataset.value;
    });
  });
}

setupChoiceGroup("ageGroup", "ageGroup");
setupChoiceGroup("adventureStyle", "adventureStyle");
setupChoiceGroup("selfDescription", "selfDescription");

document.getElementById("profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("fantasyName").value.trim();
  const error = document.getElementById("formError");
  const submitBtn = event.submitter || document.querySelector(".prof-submit");

  if (!name || !selections.ageGroup || !selections.adventureStyle || !selections.selfDescription) {
    error.textContent = "The dungeon requires every choice before it will open.";
    return;
  }

  error.textContent = "";
  if (submitBtn) submitBtn.disabled = true;
  const submitText = document.querySelector(".prof-submit-text");
  if (submitText) submitText.textContent = "ENTERING THE DUNGEON...";

  if (API_CONFIG.USE_API) {
    try {
      const customer = await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify({
          fantasy_name: name,
          age_group: selections.ageGroup,
          adventure_style: selections.adventureStyle,
          self_description: selections.selfDescription
        })
      });
      const sess = await apiRequest("/sessions", {
        method: "POST",
        body: JSON.stringify({ customer_id: customer.customer_id })
      });
      localStorage.setItem("dungeonSession", JSON.stringify({
        sessionId: sess.session_id,
        customerId: customer.customer_id,
        fantasyName: name,
        ...selections,
        currentQuestion: 0,
        answers: [],
        scores: { courage:0, logic:0, empathy:0, leadership:0, risk:0, creativity:0, loyalty:0, chaos:0 },
        startedAt: Date.now()
      }));
    } catch (e) {
      error.textContent = e.message || "Could not reach the dungeon. Is the backend running?";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
  } else {
    localStorage.setItem("dungeonSession", JSON.stringify({
      sessionId: crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`,
      customerId: crypto.randomUUID ? crypto.randomUUID() : `customer-${Date.now()}`,
      fantasyName: name,
      ...selections,
      currentQuestion: 0,
      answers: [],
      scores: { courage:0, logic:0, empathy:0, leadership:0, risk:0, creativity:0, loyalty:0, chaos:0 },
      startedAt: Date.now()
    }));
  }

  location.href = "game.html";
});
