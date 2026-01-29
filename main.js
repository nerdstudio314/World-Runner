// defensive main.js (added guards + error reporting)
console.log("World Runner JS loaded (defensive)");

/* --- Helpers --- */
function $id(id) {
  return document.getElementById(id);
}
function safeAddListener(id, event, handler) {
  const el = $id(id);
  if (!el) {
    console.warn(`Element #${id} not found — listener for "${event}" not attached.`);
    return;
  }
  el.addEventListener(event, handler);
}
function showPageError(msg) {
  console.error(msg);
  const world = $id("world");
  if (world) {
    const e = document.createElement("div");
    e.className = "world-msg";
    e.textContent = `Error: ${msg}`;
    world.appendChild(e);
  } else {
    // fallback alert so user notices
    // (avoid spamming alert in loops)
    if (!window._pageErrorShown) {
      alert(`Error: ${msg}`);
      window._pageErrorShown = true;
    }
  }
}

/* global error listener -> show in page for visibility */
window.addEventListener("error", (ev) => {
  showPageError(ev.message || "Unknown JS error");
});

/* --- Screen Elements (guarded) --- */
const titleScreen = $id("title-screen");
const characterScreen = $id("character-screen");
const gameScreen = $id("game-screen");

/* --- Player creation data --- */
let playerGender = null;
let playerCity = null;

/* --- Attach main buttons safely --- */
safeAddListener("offline-btn", "click", () => {
  if (titleScreen) titleScreen.style.display = "none";
  if (characterScreen) characterScreen.style.display = "block";
});
safeAddListener("online-btn", "click", () => alert("Online mode coming soon"));
safeAddListener("settings-btn", "click", () => alert("Settings coming soon"));

/* --- TAX & TIMING CONFIG --- */
const TAX_AMOUNT = 1000;
const TAX_HOUR = 8; // taxes charged at 08:00 each day

/* --- PLAYER STATS --- */
const player = {
  money: 10000,
  energy: 100,
  hunger: 0,
  day: 1,
  hour: 8,
  minute: 0,
  second: 0,
  totalSpent: 0,
  totalEarned: 0,
  lastTaxDay: 1,
  energyPenaltyCounter: 0,
};

/* --- Small helper to post messages in world area --- */
function postWorldMessage(text, timeout = 5000) {
  const world = $id("world");
  if (!world) return;
  const msg = document.createElement("div");
  msg.className = "world-msg";
  msg.style.marginTop = "8px";
  msg.style.padding = "8px";
  msg.textContent = text;
  world.appendChild(msg);
  setTimeout(() => msg.remove(), timeout);
}

/* --- Update Stats (guarded) --- */
function updateStats() {
  const stats = $id("stats");
  if (!stats) {
    console.warn("#stats not found — cannot update stats UI.");
    return;
  }
  const hh = player.hour.toString().padStart(2, "0");
  const mm = player.minute.toString().padStart(2, "0");
  const formattedTime = `${hh}:${mm}`;
  const isDaytime = player.hour >= 6 && player.hour < 18;

  stats.innerHTML = `
    <p>Day: ${player.day}</p>
    <p>Time: ${formattedTime} (${isDaytime ? "Daytime" : "Nighttime"})</p>
    <p>Money: $${player.money}</p>
    <p>Total Earned: $${player.totalEarned}</p>
    <p>Total Spent: $${player.totalSpent}</p>
    <p>Energy: ${player.energy}</p>
    <p>Hunger: ${player.hunger}</p>
    <p>City: ${playerCity || "N/A"}</p>
  `;
}

/* --- Character creation functions (must be global for inline onclicks) --- */
window.chooseGender = function (g) {
  playerGender = g;
  updateCharacterSummary();
};
window.chooseCity = function (city) {
  playerCity = city;
  updateCharacterSummary();
};

function updateCharacterSummary() {
  const summary = $id("char-summary");
  const startBtn = $id("start-game-btn");
  if (!summary) {
    console.warn("#char-summary not found — skipping updateCharacterSummary UI update.");
    return;
  }

  if (playerGender && playerCity) {
    summary.innerHTML = `You are an 18-year-old ${playerGender} who just moved into an apartment in ${playerCity}.`;
    if (startBtn) startBtn.style.display = "block";
  } else {
    summary.innerHTML = "";
    if (startBtn) startBtn.style.display = "none";
  }
}

/* --- Start game (safe attach) --- */
safeAddListener("start-game-btn", "click", () => {
  if (characterScreen) characterScreen.style.display = "none";
  if (gameScreen) gameScreen.style.display = "block";
  startGame();
});

/* --- Locations --- */
const locations = {
  apartment: {
    name: "Your Apartment",
    description: () => `A small starter apartment in ${playerCity || "a city"}.`
  },
  city: {
    name: "City Center",
    description: () => "Shops, traffic, and people everywhere."
  },
  store: {
    name: "Grocery Store",
    description: () => "Buy food to reduce hunger."
  },
  work: {
    name: "Workplace",
    description: () => "Earn money here during the day."
  }
};

let currentLocation = "apartment";

/* --- Render map (guarded) --- */
function renderMap() {
  const map = $id("map");
  if (!map) {
    console.warn("#map not found — cannot render map.");
    return;
  }
  // Buttons shown as actual elements so their listeners work
  map.innerHTML = `
    <h3>Map</h3>
    <button class="map-button" onclick="travel('apartment')">Apartment</button>
    <button class="map-button" onclick="travel('city')">City Center</button>
    <button class="map-button" onclick="travel('store')">Grocery Store</button>
    <button class="map-button" onclick="travel('work')">Workplace</button>
  `;
}

/* --- Travel (guarded) --- */
window.travel = function (place) {
  if (!place) {
    console.warn("travel called with no place");
    return;
  }
  currentLocation = place;

  let changeAmount = 0;
  if (place === "work") {
    changeAmount = 10;
    player.money += changeAmount;
    player.totalEarned += changeAmount;
  } else if (place === "store" || place === "apartment" || place === "city") {
    changeAmount = -20;
    player.money += changeAmount;
  }

  if (changeAmount < 0) {
    player.totalSpent += Math.abs(changeAmount);
  }

  const world = $id("world");
  if (world) {
    world.innerHTML = `
      <h3>${locations[place].name}</h3>
      <p>${locations[place].description()}</p>
    `;
  } else {
    console.warn("#world not found — cannot update world text.");
  }

  updateStats();
};

/* --- Time / Hunger / Energy / Taxes logic --- */
function advanceTimeBySeconds(seconds = 1) {
  if (seconds <= 0) {
    updateStats();
    return;
  }

  for (let i = 0; i < seconds; i++) {
    player.second += 1;
    if (player.second >= 60) {
      player.second = 0;
      player.minute += 1;
    }
    if (player.minute >= 60) {
      player.minute = 0;
      player.hour += 1;
      player.hunger += 10;
      postWorldMessage(`Hour passed: hunger +10 -> ${player.hunger}`, 3000);
    }
    if (player.hour >= 24) {
      player.hour = player.hour % 24;
      player.day += 1;
      player.energy = 100;
    }

    // taxes at TAX_HOUR:00:00 once per day
    if (
      player.hour === TAX_HOUR &&
      player.minute === 0 &&
      player.second === 0 &&
      player.day > player.lastTaxDay
    ) {
      player.money -= TAX_AMOUNT;
      player.totalSpent += TAX_AMOUNT;
      player.lastTaxDay = player.day;
      postWorldMessage(`Taxes paid at ${TAX_HOUR}:00 — $${TAX_AMOUNT}`, 5000);
    }

    // energy penalty if hunger >= 50: every 5 in-game seconds lose 1 energy
    if (player.hunger >= 50) {
      player.energyPenaltyCounter += 1;
      if (player.energyPenaltyCounter >= 5) {
        player.energy = Math.max(0, player.energy - 1);
        player.energyPenaltyCounter = 0;
        postWorldMessage(`Energy -1 due to hunger. Energy=${player.energy}`, 2500);
      }
    } else {
      player.energyPenaltyCounter = 0;
    }
  }

  updateStats();
}

/* --- Tick logic (mapping: 30 real seconds = 1 in-game hour) --- */
const MS_PER_INGAME_MINUTE = 500; // 0.5s per in-game minute
const MS_PER_INGAME_SECOND = MS_PER_INGAME_MINUTE / 60;

let tickIntervalId = null;
let lastTickTime = null;
let accumulatedMs = 0;

function tickTime() {
  const now = Date.now();
  if (!lastTickTime) {
    lastTickTime = now;
    updateStats();
    return;
  }
  const delta = now - lastTickTime;
  lastTickTime = now;
  accumulatedMs += delta;

  const secondsToAdd = Math.floor(accumulatedMs / MS_PER_INGAME_SECOND);
  if (secondsToAdd > 0) {
    accumulatedMs -= secondsToAdd * MS_PER_INGAME_SECOND;
    advanceTimeBySeconds(secondsToAdd);
  } else {
    updateStats();
  }
}

/* --- Start game (safe) --- */
function startGame() {
  player.lastTaxDay = player.day;

  updateStats();
  renderMap();
  // show apartment without charging
  try { travel("apartment"); } catch (e) { console.warn(e); }

  if (tickIntervalId) clearInterval(tickIntervalId);
  lastTickTime = null;
  accumulatedMs = 0;

  tickIntervalId = setInterval(tickTime, 250);
}
window.startGame = startGame;

/* --- Defensive sanity check: confirm required elements exist and warn --- */
const required = ["offline-btn", "title-screen", "character-screen", "start-game-btn", "stats", "world", "map"];
required.forEach(id => {
  if (!$id(id)) {
    console.warn(`Warning: expected element #${id} not found. Some UI features may not work.`);
  }
});
