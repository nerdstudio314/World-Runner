console.log("World Runner JS loaded");

// SCREEN ELEMENTS
const titleScreen = document.getElementById("title-screen");
const characterScreen = document.getElementById("character-screen");
const gameScreen = document.getElementById("game-screen");

// PLAYER CREATION DATA
let playerGender = null;
let playerCity = null;

// OFFLINE BUTTON → GO TO CHARACTER CREATION
document.getElementById("offline-btn").addEventListener("click", () => {
  titleScreen.style.display = "none";
  characterScreen.style.display = "block";
});

// ONLINE + SETTINGS PLACEHOLDERS
document.getElementById("online-btn").addEventListener("click", () => {
  alert("Online mode coming soon");
});

document.getElementById("settings-btn").addEventListener("click", () => {
  alert("Settings coming soon");
});

// START / TAX CONFIG
const TAX_AMOUNT = 1000;
const TAX_HOUR = 8; // taxes charged at 08:00 each day

// PLAYER STATS
const player = {
  money: 10000,
  energy: 100,
  hunger: 0,
  day: 1,
  hour: 8,     // start at 08:00
  minute: 0,
  second: 0,   // track seconds now
  totalSpent: 0,
  totalEarned: 0,
  lastTaxDay: 1,           // last day taxes were charged (start at current day so we don't charge immediately)
  energyPenaltyCounter: 0, // counts in-game seconds for energy penalty when hungry
};

// UPDATE STATS UI (shows HH:MM)
function updateStats() {
  const stats = document.getElementById("stats");

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

// Advance time by a number of in-game seconds.
// - Adds +10 hunger each in-game hour that passes.
// - Charges taxes of TAX_AMOUNT at TAX_HOUR:00:00 each day (once per day).
// - If hunger >= 50, every 5 in-game seconds reduce energy by 1.
function advanceTimeBySeconds(seconds = 1) {
  if (seconds <= 0) {
    updateStats();
    return;
  }

  for (let i = 0; i < seconds; i++) {
    // advance one in-game second
    player.second += 1;

    if (player.second >= 60) {
      player.second = 0;
      player.minute += 1;
    }

    if (player.minute >= 60) {
      player.minute = 0;
      player.hour += 1;

      // Each in-game hour -> +10 hunger
      player.hunger += 10;
    }

    if (player.hour >= 24) {
      player.hour = player.hour % 24;
      player.day += 1;
      // Reset energy at new day (existing behavior)
      player.energy = 100;
      // When day advances we don't additionally change hunger here (hours already handled)
    }

    // Tax check: if it's exactly TAX_HOUR:00:00 and we haven't charged for this day yet
    if (
      player.hour === TAX_HOUR &&
      player.minute === 0 &&
      player.second === 0 &&
      player.day > player.lastTaxDay
    ) {
      player.money -= TAX_AMOUNT;
      player.totalSpent += TAX_AMOUNT;
      player.lastTaxDay = player.day;

      // Show a temporary notification in the world area (if available)
      const world = document.getElementById("world");
      if (world) {
        const msg = document.createElement("div");
        msg.className = "tax-msg";
        msg.style.marginTop = "8px";
        msg.style.padding = "8px";
        msg.style.background = "#fff3f3";
        msg.style.border = "1px solid #f5c2c2";
        msg.style.borderRadius = "6px";
        msg.textContent = `Taxes paid at ${TAX_HOUR}:00 — $${TAX_AMOUNT}`;
        world.appendChild(msg);
        setTimeout(() => {
          msg.remove();
        }, 6000);
      }
    }

    // Energy penalty when hunger >= 50: every 5 in-game seconds, -1 energy
    if (player.hunger >= 50) {
      player.energyPenaltyCounter += 1;
      if (player.energyPenaltyCounter >= 5) {
        player.energy = Math.max(0, player.energy - 1);
        player.energyPenaltyCounter = 0;
      }
    } else {
      // Reset counter if hunger drops below threshold
      player.energyPenaltyCounter = 0;
    }
  }

  updateStats();
}

// MAP LOCATIONS
const locations = {
  apartment: {
    name: "Your Apartment",
    description: () => `A small starter apartment in ${playerCity}.`
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

// RENDER MAP BUTTONS
function renderMap() {
  const map = document.getElementById("map");
  map.innerHTML = `
    <h3>Map</h3>
    <button class="map-button" onclick="travel('apartment')">Apartment</button>
    <button class="map-button" onclick="travel('city')">City Center</button>
    <button class="map-button" onclick="travel('store')">Grocery Store</button>
    <button class="map-button" onclick="travel('work')">Workplace</button>
  `;
}

// TRAVEL FUNCTION (money: work +$10; other places -$20)
function travel(place) {
  currentLocation = place;

  let changeAmount = 0;
  if (place === "work") {
    changeAmount = 10; // earnings
    player.money += changeAmount;
    player.totalEarned += changeAmount;
  } else if (place === "store" || place === "apartment" || place === "city") {
    changeAmount = -20;
    player.money += changeAmount;
  }

  if (changeAmount < 0) {
    player.totalSpent += Math.abs(changeAmount);
  }

  const world = document.getElementById("world");
  world.innerHTML = `
    <h3>${locations[place].name}</h3>
    <p>${locations[place].description()}</p>
  `;

  updateStats();
}

// TICK LOGIC: convert real time -> in-game seconds
// Mapping set so 30 real seconds = 1 in-game hour (60 in-game minutes)
// => 1 in-game minute = 0.5 real seconds = 500 ms
// => 1 in-game second = 500 / 60 ms ≈ 8.333... ms
const MS_PER_INGAME_MINUTE = 500;
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

  // How many in-game seconds to add?
  const secondsToAdd = Math.floor(accumulatedMs / MS_PER_INGAME_SECOND);
  if (secondsToAdd > 0) {
    accumulatedMs -= secondsToAdd * MS_PER_INGAME_SECOND;
    advanceTimeBySeconds(secondsToAdd);
  } else {
    // refresh UI so minutes appear to move (even if not yet a full in-game second)
    updateStats();
  }
}

// START GAME FUNCTION
function startGame() {
  // Ensure lastTaxDay is initialized to current day so we don't charge immediately
  player.lastTaxDay = player.day;

  updateStats();
  renderMap();
  travel("apartment");

  // Clear any old interval if present
  if (tickIntervalId) clearInterval(tickIntervalId);
  lastTickTime = null;
  accumulatedMs = 0;

  // Use a short tick so the UI updates smoothly.
  tickIntervalId = setInterval(tickTime, 250);
}
