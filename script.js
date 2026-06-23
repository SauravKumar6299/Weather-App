const root = document.documentElement;
const toggleButton = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector("#themeIcon");

const savedTheme = localStorage.getItem("weather-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeIcon.textContent = theme === "dark" ? "☾" : "☀";
  localStorage.setItem("weather-theme", theme);
}

applyTheme(initialTheme);

toggleButton.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
});
const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const searchButton = document.querySelector("#searchButton");
const statusMessage = document.querySelector("#statusMessage");

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-hidden", !message);
  statusMessage.classList.toggle("error", type === "error");
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  cityInput.disabled = isLoading;
  searchButton.textContent = isLoading ? "Searching..." : "Search";
}

async function getCoordinates(city) {
  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", city);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", "en");
  geocodeUrl.searchParams.set("format", "json");

  const response = await fetch(geocodeUrl);

  if (!response.ok) {
    throw new Error("Could not connect to the city search service.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please try another search.");
  }

  return data.results[0];
}

async function getForecast(location) {
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");

  forecastUrl.searchParams.set("latitude", location.latitude);
  forecastUrl.searchParams.set("longitude", location.longitude);
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure"
  );
  forecastUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min"
  );
  forecastUrl.searchParams.set("hourly", "temperature_2m,weather_code");
  forecastUrl.searchParams.set("timezone", "auto");

  const response = await fetch(forecastUrl);

  if (!response.ok) {
    throw new Error("Could not fetch weather data. Please try again.");
  }

  return response.json();
}

async function fetchWeatherForCity(city) {
  setLoading(true);
  setStatus("Loading weather data...");

  try {
    const location = await getCoordinates(city);
    const forecast = await getForecast(location);

    const weatherData = {
      location,
      forecast,
    };

    console.log("Weather data:", weatherData);

    setStatus(`Weather data loaded for ${location.name}, ${location.country}.`);
  } catch (error) {
    console.error(error);
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name.", "error");
    return;
  }

  fetchWeatherForCity(city);
});