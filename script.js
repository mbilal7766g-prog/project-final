
const API_KEY = "787947350c4c4eb89c9183933262110";
const API_URL = "https://api.weatherapi.com/v1";

const $ = id => document.getElementById(id);

const input = $("cityInput");
const suggestions = $("suggestions");
const status = $("status");

let searchTimer;
let requestController;

const weatherMap = {
  1000: ["☀️", "sunny"],
  1003: ["🌤️", "cloudy"],
  1006: ["☁️", "cloudy"],
  1009: ["☁️", "cloudy"],
  1030: ["🌫️", "cloudy"],
  1063: ["🌦️", "rainy"],
  1066: ["🌨️", "cold"],
  1087: ["⛈️", "rainy"],
  1114: ["🌨️", "cold"],
  1117: ["❄️", "cold"],
  1135: ["🌫️", "cloudy"],
  1150: ["🌦️", "rainy"],
  1153: ["🌦️", "rainy"],
  1168: ["🌧️", "rainy"],
  1171: ["🌧️", "rainy"],
  1180: ["🌦️", "rainy"],
  1183: ["🌧️", "rainy"],
  1186: ["🌧️", "rainy"],
  1189: ["🌧️", "rainy"],
  1192: ["🌧️", "rainy"],
  1195: ["🌧️", "rainy"],
  1198: ["🌧️", "rainy"],
  1201: ["🌧️", "rainy"],
  1210: ["🌨️", "cold"],
  1213: ["❄️", "cold"],
  1216: ["🌨️", "cold"],
  1219: ["❄️", "cold"],
  1222: ["❄️", "cold"],
  1225: ["❄️", "cold"],
  1240: ["🌦️", "rainy"],
  1243: ["🌧️", "rainy"],
  1246: ["🌧️", "rainy"],
  1273: ["⛈️", "rainy"],
  1276: ["⛈️", "rainy"]
};

function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? "#ffd1d1" : "";
}

async function getJSON(url, signal) {
  const response = await fetch(url, { signal });
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Request failed.");
  }

  return data;
}

function hideSuggestions() {
  suggestions.classList.remove("show");
}

async function searchCities(query) {
  if (query.trim().length < 2) {
    hideSuggestions();
    return;
  }

  try {
    const places = await getJSON(
      `${API_URL}/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`
    );

    suggestions.replaceChildren();

    places.slice(0, 6).forEach(place => {
      const button = document.createElement("button");
      button.type = "button";

      button.textContent = [
        place.name,
        place.region,
        place.country
      ].filter(Boolean).join(", ");

      button.addEventListener("click", () => {
        input.value = place.name + ", " + place.country;
        hideSuggestions();
        loadWeather(place.name + ", " + place.country);
      });

      suggestions.appendChild(button);
    });

    suggestions.classList.toggle("show", places.length > 0);
  } catch (error) {
    hideSuggestions();
  }
}

function updateWeatherTheme(current) {
  document.body.classList.remove(
    "hot", "rainy", "cold", "night"
  );

  const code = current.condition.code;
  const mapped = weatherMap[code] || ["🌡️", "cloudy"];

  let theme = mapped[1];

  if (!current.is_day) {
    theme = "night";
  } else if (current.temp_c >= 32 &&
             (code === 1000 || code === 1003)) {
    theme = "hot";
  } else if (current.temp_c <= 8 && theme !== "rainy") {
    theme = "cold";
  }

  document.body.classList.add(theme);

  $("icon").textContent = current.is_day
    ? mapped[0]
    : "🌙";

  $("rain").classList.toggle("active", theme === "rainy");

  $("wind").classList.toggle(
    "active",
    current.wind_kph >= 25 && theme !== "rainy"
  );
}

function createEffects() {
  for (let i = 0; i < 55; i++) {
    const drop = document.createElement("i");
    drop.className = "drop";
    drop.style.left = Math.random() * 100 + "%";
    drop.style.animationDuration = (0.6 + Math.random()) + "s";
    drop.style.animationDelay = (-Math.random() * 2) + "s";
    $("rain").appendChild(drop);
  }

  for (let i = 0; i < 12; i++) {
    const gust = document.createElement("i");
    gust.className = "gust";
    gust.style.top = Math.random() * 100 + "%";
    gust.style.animationDelay = (-Math.random() * 3) + "s";
    $("wind").appendChild(gust);
  }
}

function formatDate(localtime) {
  return new Date(localtime.replace(" ", "T"))
    .toLocaleString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
}

async function loadWeather(city) {
  if (!city.trim()) return;

  if (requestController) requestController.abort();
  requestController = new AbortController();

  const signal = requestController.signal;

  setStatus("Fetching live weather...");
  $("temp").textContent = "--";

  try {
    const data = await getJSON(
      `${API_URL}/current.json?key=${API_KEY}` +
      `&q=${encodeURIComponent(city)}&aqi=no`,
      signal
    );

    const location = data.location;
    const current = data.current;

    $("location").textContent = [
      location.name,
      location.region,
      location.country
    ].filter(Boolean).join(", ");

    $("date").textContent = formatDate(location.localtime);
    $("temp").textContent = Math.round(current.temp_c);
    $("condition").textContent = current.condition.text;
    $("feels").textContent =
      `Feels like ${Math.round(current.feelslike_c)}°C`;

    $("humidity").textContent = current.humidity + "%";
    $("windSpeed").textContent =
      Math.round(current.wind_kph) + " km/h";

    $("windDirection").textContent =
      `${current.wind_dir} · Gusts ${Math.round(current.gust_kph)} km/h`;

    $("pressure").textContent =
      Math.round(current.pressure_mb) + " mb";

    $("visibility").textContent = current.vis_km + " km";

    updateWeatherTheme(current);
    input.value = location.name + ", " + location.country;

    setStatus("Live conditions for " + location.name);
  } catch (error) {
    if (error.name === "AbortError") return;

    setStatus(
      "Unable to load weather. Check your internet connection and API key.",
      true
    );

    console.error(error);
  }
}

input.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(
    () => searchCities(input.value),
    300
  );
});

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();

  const city = input.value.trim();

  if (city) {
    hideSuggestions();
    loadWeather(city);
  }
});

document.addEventListener("click", event => {
  if (!event.target.closest(".search-wrap")) {
    hideSuggestions();
  }
});

createEffects();
loadWeather("Karachi");
