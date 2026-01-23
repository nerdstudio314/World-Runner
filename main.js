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
  hour: 8, // start at 8 AM
};

// UPDATE STATS UI
function updateStats() {
  const stats = document.getElementById("stats");

  const formattedHour = player.hour.toString().padStart(2, "0") + ":00";
  const isDaytime = player.hour >= 6 && player.hour < 18;

  stats.innerHTML = `
    <p>Day: ${player.day}</p>
    <p>Time: ${formattedHour} (${isDaytime ? "Daytime" : "Nighttime"})</p>
    <p>Money: $${player.money}</p>
    <p>Energy: ${player.energy}</p>
    <p>Hunger: ${player.hunger}</p>
    <p>City: ${playerCity}</p>
  `;
}

// ADVANCE TIME (1 real minute = 1 in-game hour)
function advanceTime() {
  player.hour++;

  if (player.hour >= 24) {
    player.hour = 0;
    player.day++;
    player.energy = 100;
    player.hunger += 10;
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

// TRAVEL FUNCTION (UPDATED WITH MONEY CHANGES)
function travel(place) {
  currentLocation = place;

  // Money changes based on location
  if (place === "work") {
    player.money += 20;
  } else if (place === "store") {
    player.money -= 20;
  } else if (place === "apartment") {
    player.money -= 20;
  } else if (place === "city") {
    player.money -= 20;
  }

  // Update the world text
  const world = document.getElementById("world");
  world.innerHTML = `
    <h3>${locations[place].name}</h3>
    <p>${locations[place].description()}</p>
  `;

  // Update stats after money changes
  updateStats();
}

// START GAME FUNCTION
function startGame() {
  updateStats();
  renderMap();
  travel("apartment");

  // 1 real minute = 1 in-game hour
  setInterval(advanceTime, 60000);
}
