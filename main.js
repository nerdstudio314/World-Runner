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

// CHARACTER CREATION FUNCTIONS
function chooseGender(g) {
  playerGender = g;
  updateCharacterSummary();
}

function chooseCity(city) {
  playerCity = city;
  updateCharacterSummary();
}

function updateCharacterSummary() {
  const summary = document.getElementById("char-summary");

  if (playerGender && playerCity) {
    summary.innerHTML = `
      You are an 18-year-old ${playerGender} who just moved into an apartment in ${playerCity}.
    `;
    document.getElementById("start-game-btn").style.display = "block";
  } else {
    summary.innerHTML = "";
    document.getElementById("start-game-btn").style.display = "none";
  }
}

// START GAME BUTTON
document.getElementById("start-game-btn").addEventListener("click", () => {
  characterScreen.style.display = "none";
  gameScreen.style.display = "block";
  startGame();
});

// PLAYER STATS
const player = {
  money: 10000,
  energy: 100,
  hunger: 0,
  day: 1,
  hour: 8,    // start at 8 AM
  minute: 0,  // track minutes now
  totalSpent: 0, // track total money spent
  totalEarned: 0 // track total money earned
};

// UPDATE STATS UI (now shows minutes)
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
    <p>City: ${playerCity}</p>
  `;
}

// ADVANCE TIME BY MINUTES (rollover minutes -> hours -> days)
function advanceTimeByMinutes(minutes = 1) {
  if (minutes <= 0) {
    updateStats();
    return;
  }

  player.minute += minutes;

  if (player.minute >= 60) {
    const extraHours = Math.floor(player.minute / 60);
    player.minute = player.minute % 60;
    player.hour += extraHours;
  }

  if (player.hour >= 24) {
    const extraDays = Math.floor(player.hour / 24);
    player.hour = player.hour % 24;
    player.day += extraDays;
    player.energy = 100;
    player.hunger += 10 * extraDays;
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

// TICK LOGIC: convert real time -> in-game minutes
// New mapping requested:
//   30 real seconds = 1 in-game hour (60 in-game minutes)
// => 1 real second = 2 in-game minutes
// => 1 in-game minute = 0.5 real seconds = 500 ms
const MS_PER_INGAME_MINUTE = 500;

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

  // How many in-game minutes to add?
  const minutesToAdd = Math.floor(accumulatedMs / MS_PER_INGAME_MINUTE);
  if (minutesToAdd > 0) {
    accumulatedMs -= minutesToAdd * MS_PER_INGAME_MINUTE;
    advanceTimeByMinutes(minutesToAdd);
  } else {
    // refresh UI so minutes appear to move (even if not yet a full in-game minute)
    updateStats();
  }
}

// START GAME FUNCTION
function startGame() {
  updateStats();
  renderMap();
  travel("apartment");

  // Clear any old interval if present
  if (tickIntervalId) clearInterval(tickIntervalId);
  lastTickTime = null;
  accumulatedMs = 0;

  // Use a short tick so the UI updates smoothly.
  // With MS_PER_INGAME_MINUTE = 500, setting interval to 250ms keeps responsive UI.
  tickIntervalId = setInterval(tickTime, 250);
}
