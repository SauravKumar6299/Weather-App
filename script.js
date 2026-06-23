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