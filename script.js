const root = document.documentElement;
const toggleButton = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector("#themeIcon");
const searchForm = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const searchButton = document.querySelector("#searchButton");
const statusMessage = document.querySelector("#statusMessage");
const weatherCard = document.querySelector("#weatherCard");
const forecastStrip = document.querySelector("#forecastStrip");
const insightsPanel = document.querySelector("#insightsPanel");
const savedTheme = localStorage.getItem("weather-theme");
const clearCityButton = document.querySelector("#clearCityButton");
const savedCityKey = "weather-last-city";
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

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-hidden", !message);
  statusMessage.classList.toggle("error", type === "error");
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  cityInput.disabled = isLoading;
  clearCityButton.disabled = isLoading;
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

function getWeatherMeta(code) {
  const weatherMap = {
    0: { label: "Clear Sky", icon: "☀" },
    1: { label: "Mainly Clear", icon: "🌤" },
    2: { label: "Partly Cloudy", icon: "⛅" },
    3: { label: "Cloudy", icon: "☁" },
    45: { label: "Fog", icon: "🌫" },
    48: { label: "Rime Fog", icon: "🌫" },
    51: { label: "Light Drizzle", icon: "🌦" },
    53: { label: "Drizzle", icon: "🌦" },
    55: { label: "Heavy Drizzle", icon: "🌧" },
    61: { label: "Light Rain", icon: "🌦" },
    63: { label: "Rain", icon: "🌧" },
    65: { label: "Heavy Rain", icon: "🌧" },
    71: { label: "Light Snow", icon: "❄" },
    73: { label: "Snow", icon: "❄" },
    75: { label: "Heavy Snow", icon: "❄" },
    80: { label: "Rain Showers", icon: "🌦" },
    81: { label: "Rain Showers", icon: "🌧" },
    82: { label: "Heavy Showers", icon: "🌧" },
    95: { label: "Thunderstorm", icon: "⛈" },
  };

  return weatherMap[code] || { label: "Unknown", icon: "☁" };
}

function getTemperatureClass(temperature) {
  if (temperature <= 10) {
    return "temp-cold";
  }

  if (temperature >= 26) {
    return "temp-hot";
  }

  return "temp-mild";
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function renderCurrentWeather(location, forecast) {
  const current = forecast.current;
  const weatherMeta = getWeatherMeta(current.weather_code);
  const temperature = Math.round(current.temperature_2m);
  const temperatureClass = getTemperatureClass(temperature);

  weatherCard.className = `weather-card ${temperatureClass}`;

  weatherCard.innerHTML = `
    <div class="current-weather">
      <div>
        <h2 class="weather-location">${location.name}, ${location.country}</h2>
        <p class="weather-date">${formatCurrentDate()}</p>

        <div class="temperature-row">
          <span class="temperature-value">${temperature}</span>
          <span class="temperature-unit">°C</span>
        </div>

        <div class="weather-condition">
          <span class="weather-icon" aria-hidden="true">${weatherMeta.icon}</span>
          <span>${weatherMeta.label}</span>
        </div>
      </div>

      <div class="weather-stats">
        <div class="stat-badge">
          <span class="stat-label">💧 Humidity</span>
          <span class="stat-value">${current.relative_humidity_2m}%</span>
        </div>

        <div class="stat-badge">
          <span class="stat-label">🌪️ Wind Speed</span>
          <span class="stat-value">${Math.round(current.wind_speed_10m)} km/h</span>
        </div>

        <div class="stat-badge">
          <span class="stat-label">🌡️ Pressure</span>
          <span class="stat-value">${Math.round(current.surface_pressure)} hPa</span>
        </div>
      </div>
    </div>
  `;
}

function formatDayLabel(dateString, index) {
  if (index === 0) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateString));
}

function formatHourLabel(dateString) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

function renderForecastStrip(forecast) {
  const daily = forecast.daily;
  const forecastDays = daily.time.slice(0, 5);

  forecastStrip.innerHTML = forecastDays
    .map((date, index) => {
      const weatherMeta = getWeatherMeta(daily.weather_code[index]);
      const high = Math.round(daily.temperature_2m_max[index]);
      const low = Math.round(daily.temperature_2m_min[index]);

      return `
        <article class="forecast-card ${index === 0 ? "active" : ""}">
          <span class="forecast-day">${formatDayLabel(date, index)}</span>
          <span class="forecast-icon" aria-hidden="true">${weatherMeta.icon}</span>
          <span class="forecast-temps">
            <span class="forecast-high">${high}°</span>
            <span class="forecast-low">${low}°</span>
          </span>
        </article>
      `;
    })
    .join("");
}

function getTodayHourlyEntries(forecast) {
  const hourly = forecast.hourly;
  const currentTime = forecast.current.time;
  const today = currentTime.slice(0, 10);

  const todayEntries = hourly.time
    .map((time, index) => ({
      time,
      temperature: hourly.temperature_2m[index],
      weatherCode: hourly.weather_code[index],
    }))
    .filter((entry) => entry.time.startsWith(today));

  const currentOrUpcomingIndex = todayEntries.findIndex(
    (entry) => entry.time >= currentTime
  );

  if (currentOrUpcomingIndex === -1) {
    return todayEntries.slice(0, 6);
  }

  return todayEntries.slice(currentOrUpcomingIndex, currentOrUpcomingIndex + 6);
}

function renderInsightsPanel(forecast) {
  const entries = getTodayHourlyEntries(forecast);

  insightsPanel.className = "insights-panel";

  insightsPanel.innerHTML = `
    <div class="insights-header">
      <h2 class="insights-title">Hourly Micro-Data Insights</h2>
      <span class="weather-icon" aria-hidden="true">⌁</span>
    </div>

    <div class="insight-list">
      ${entries
        .map((entry) => {
          const weatherMeta = getWeatherMeta(entry.weatherCode);

          return `
            <div class="insight-row">
              <span class="insight-time">${formatHourLabel(entry.time)}</span>
              <span class="insight-condition">
                <span aria-hidden="true">${weatherMeta.icon}</span>
                ${weatherMeta.label}
              </span>
              <span class="insight-temp">${Math.round(entry.temperature)}°C</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function resetDashboard() {
  localStorage.removeItem(savedCityKey);
  cityInput.value = "";
  clearCityButton.hidden = true;
  setStatus("");

  weatherCard.className = "weather-card is-empty";
  weatherCard.innerHTML = `
    <p class="empty-card-message">Search for a city to view current weather.</p>
  `;

  forecastStrip.innerHTML = `
    <article class="forecast-card active">Forecast will appear here</article>
  `;

  insightsPanel.className = "insights-panel placeholder";
  insightsPanel.innerHTML = "Hourly micro-data insights will appear here";
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

    renderCurrentWeather(location, forecast);
    renderForecastStrip(forecast);
    renderInsightsPanel(forecast);

    localStorage.setItem(savedCityKey, city);
    cityInput.value = location.name;
    clearCityButton.hidden = false;

    setStatus("");
  } catch (error) {
    console.error(error);
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

clearCityButton.addEventListener("click", resetDashboard);
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name.", "error");
    return;
  }

  fetchWeatherForCity(city);
});

const savedCity = localStorage.getItem(savedCityKey);

if (savedCity) {
  cityInput.value = savedCity;
  clearCityButton.hidden = false;
  fetchWeatherForCity(savedCity);
}