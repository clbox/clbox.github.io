// Apply light, dark, or system colour preferences without a page-load flash.
const determineThemeSetting = () => {
  const setting = localStorage.getItem("theme");
  return ["light", "dark", "system"].includes(setting) ? setting : "system";
};

const determineComputedTheme = () => {
  const setting = determineThemeSetting();
  if (setting !== "system") return setting;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = () => {
  const theme = determineComputedTheme();
  document.documentElement.setAttribute("data-theme", theme);

  document.querySelectorAll("table").forEach((table) => {
    table.classList.toggle("table-dark", theme === "dark");
  });

  if (typeof medium_zoom !== "undefined") {
    medium_zoom.update({
      background: getComputedStyle(document.documentElement).getPropertyValue("--global-bg-color") + "ee",
    });
  }
};

const setThemeSetting = (setting) => {
  localStorage.setItem("theme", setting);
  document.documentElement.setAttribute("data-theme-setting", setting);
  applyTheme();
};

const toggleThemeSetting = () => {
  const setting = determineThemeSetting();
  setThemeSetting(setting === "system" ? "light" : setting === "light" ? "dark" : "system");
};

const initTheme = () => {
  setThemeSetting(determineThemeSetting());
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    document.getElementById("light-toggle")?.addEventListener("click", toggleThemeSetting);
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
};
