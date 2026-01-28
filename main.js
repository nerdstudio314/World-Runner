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

// Improved tick logic: tick every 10s, use timestamps.
// Mapping: 1000 ms real = 1 in-game minute -> 60000 ms real = 60 in-game minutes = 1 in-game hour.
let tickIntervalId = null;
let lastTickTime = null;
let accumulatedMs = 0;

function tickTime() {
  const now = Date.now();

  if (!lastTickTime) {
    lastTickTime = now;
    // update UI immediately
    updateStats();
    return;
  }

  const delta = now - lastTickTime;
  lastTickTime = now;
  accumulatedMs += delta;

  // Calculate how many in-game minutes to add (1 in-game minute per 1000 ms real)
  const minutesToAdd = Math.floor(accumulatedMs / 1000);
  if (minutesToAdd > 0) {
    accumulatedMs -= minutesToAdd * 1000;
    advanceTimeByMinutes(minutesToAdd);
  } else {
    // If no minute advanced, still refresh UI so it updates every tick
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

  // Tick every 10 real seconds (the conversion uses actual elapsed ms so it's robust)
  tickIntervalId = setInterval(tickTime, 10000);
}
