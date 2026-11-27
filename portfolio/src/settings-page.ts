import "./styles.css";
import { element, mountNavigation } from "./navigation";
import { accents, readPreferences, savePreferences, themes } from "./preferences";

mountNavigation("settings");

const form = element<HTMLFormElement>("#site-preferences");
const back = element<HTMLAnchorElement>("#settings-back");
const previous = URL.parse(document.referrer);
if (previous?.origin === location.origin && previous.pathname !== location.pathname) {
  back.href = previous.pathname + previous.search;
  back.addEventListener("click", (event) => {
    if (event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    history.back();
  });
}

function syncForm() {
  const preferences = readPreferences();
  for (const input of form.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
    input.checked = input.value === preferences[input.name as keyof typeof preferences];
  }
}

syncForm();
window.addEventListener("pageshow", (event) => {
  if (event.persisted) syncForm();
});
window.addEventListener("storage", syncForm);
form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("change", () => {
  const values = new FormData(form);
  const previous = readPreferences();
  savePreferences({
    theme: themes.find((theme) => theme === values.get("theme")) ?? previous.theme,
    accent: accents.find((accent) => accent === values.get("accent")) ?? previous.accent,
  });
});
