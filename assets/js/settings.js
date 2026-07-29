const SETTINGS_KEY = "studyhub.settings.v1";
const POMODORO_SETTINGS_KEY = "studyhub.pomodoro.settings.v1";
const DEFAULT_APP_SETTINGS = {
  theme: "system",
  language: "tr",
  notifications: {
    pomodoroComplete: true,
    breakReminder: true,
    dailyGoal: true,
    endOfDaySummary: false,
  },
};
const DEFAULT_POMODORO = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyGoal: 4,
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  form: $("#settingsForm"),
  work: $("#settingsWorkMinutes"),
  short: $("#settingsShortBreak"),
  long: $("#settingsLongBreak"),
  goal: $("#settingsDailyGoal"),
  pomodoro: $("#notifyPomodoro"),
  break: $("#notifyBreak"),
  goalNotify: $("#notifyGoal"),
  summary: $("#notifySummary"),
  language: $("#settingsLanguage"),
  feedback: $("#settingsFeedback"),
  reset: $("#resetSettings"),
  clear: $("#clearAllData"),
  deleteAccount: $("#deleteAccount"),
  toast: $("#settingsToast"),
};

let toastTimer;
let savedFormState = "";
let navigationInProgress = false;

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch (error) {
    console.error(`${key} okunamadı`, error);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`${key} kaydedilemedi`, error);
    return false;
  }
};

const showToast = (message) => {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 3000);
};

const currentSettings = () => {
  const stored = read(SETTINGS_KEY, DEFAULT_APP_SETTINGS);
  return {
    ...DEFAULT_APP_SETTINGS,
    ...stored,
    notifications: {
      ...DEFAULT_APP_SETTINGS.notifications,
      ...stored.notifications,
    },
  };
};

const currentPomodoro = () => ({
  ...DEFAULT_POMODORO,
  ...read(POMODORO_SETTINGS_KEY, DEFAULT_POMODORO),
});

const getFormState = () =>
  JSON.stringify({
    theme: $('input[name="theme"]:checked')?.value ?? "system",
    work: elements.work.value,
    short: elements.short.value,
    long: elements.long.value,
    goal: elements.goal.value,
    pomodoro: elements.pomodoro.checked,
    break: elements.break.checked,
    goalNotify: elements.goalNotify.checked,
    summary: elements.summary.checked,
    language: elements.language.value,
  });

const markFormAsSaved = () => {
  savedFormState = getFormState();
};

const hasUnsavedChanges = () => getFormState() !== savedFormState;

const fill = () => {
  const settings = currentSettings();
  const pomodoro = currentPomodoro();
  document.querySelectorAll('input[name="theme"]').forEach((input) => {
    input.checked = input.value === settings.theme;
  });
  elements.work.value = pomodoro.workMinutes;
  elements.short.value = pomodoro.shortBreakMinutes;
  elements.long.value = pomodoro.longBreakMinutes;
  elements.goal.value = pomodoro.dailyGoal;
  elements.pomodoro.checked = settings.notifications.pomodoroComplete;
  elements.break.checked = settings.notifications.breakReminder;
  elements.goalNotify.checked = settings.notifications.dailyGoal;
  elements.summary.checked = settings.notifications.endOfDaySummary;
  elements.language.value = settings.language;
  markFormAsSaved();
};

const applyTheme = (theme) => {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.dataset.theme = dark ? "dark" : "light";
};

const saveSettings = ({ showSuccess = true } = {}) => {
  const pomodoro = {
    workMinutes: Number(elements.work.value),
    shortBreakMinutes: Number(elements.short.value),
    longBreakMinutes: Number(elements.long.value),
    dailyGoal: Number(elements.goal.value),
  };
  const valid =
    pomodoro.workMinutes >= 1 &&
    pomodoro.workMinutes <= 180 &&
    pomodoro.shortBreakMinutes >= 1 &&
    pomodoro.shortBreakMinutes <= 60 &&
    pomodoro.longBreakMinutes >= 1 &&
    pomodoro.longBreakMinutes <= 120 &&
    pomodoro.dailyGoal >= 1 &&
    pomodoro.dailyGoal <= 50;

  if (!valid) {
    elements.feedback.textContent =
      "Pomodoro değerlerini izin verilen aralıklarda gir.";
    elements.feedback.hidden = false;
    return false;
  }

  const settings = {
    theme: $('input[name="theme"]:checked')?.value ?? "system",
    language: "tr",
    notifications: {
      pomodoroComplete: elements.pomodoro.checked,
      breakReminder: elements.break.checked,
      dailyGoal: elements.goalNotify.checked,
      endOfDaySummary: elements.summary.checked,
    },
  };

  if (
    !write(SETTINGS_KEY, settings) ||
    !write(POMODORO_SETTINGS_KEY, pomodoro)
  ) {
    elements.feedback.textContent = "Ayarlar kaydedilemedi.";
    elements.feedback.hidden = false;
    return false;
  }

  elements.feedback.hidden = true;
  applyTheme(settings.theme);
  markFormAsSaved();
  if (showSuccess) {
    showToast("Tercihler kaydedildi.");
  }
  return true;
};

document.querySelectorAll('input[name="theme"]').forEach((input) => {
  input.addEventListener("change", () => applyTheme(input.value));
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettings();
});

document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[href]");
  if (
    !link ||
    navigationInProgress ||
    !hasUnsavedChanges() ||
    link.target === "_blank" ||
    link.hasAttribute("download")
  ) {
    return;
  }

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) {
    return;
  }

  event.preventDefault();
  const choice = await StudyHubConfirmationDialog.open({
    title: "Kaydedilmemiş değişiklikler",
    description:
      "Ayarlarında kaydedilmemiş değişiklikler var. Ayrılmadan önce kaydetmek ister misin?",
    cancelLabel: "İptal",
    alternativeLabel: "Kaydetmeden çık",
    confirmLabel: "Kaydet ve devam et",
  });

  if (choice === false) {
    return;
  }
  if (choice === true && !saveSettings({ showSuccess: false })) {
    return;
  }

  navigationInProgress = true;
  window.location.assign(destination.href);
});

elements.reset.addEventListener("click", async () => {
  const confirmed = await StudyHubConfirmationDialog.open({
    title: "Ayarları sıfırla",
    description:
      "Tüm tercihleri varsayılan değerlere döndürmek istediğine emin misin?",
    confirmLabel: "Sıfırla",
    cancelLabel: "İptal",
  });
  if (!confirmed) return;
  write(SETTINGS_KEY, DEFAULT_APP_SETTINGS);
  write(POMODORO_SETTINGS_KEY, DEFAULT_POMODORO);
  fill();
  applyTheme("system");
  showToast("Ayarlar varsayılan değerlere döndürüldü.");
});

elements.clear.addEventListener("click", async () => {
  const confirmed = await StudyHubConfirmationDialog.open({
    title: "Tüm verileri temizle",
    description:
      "StudyHub içindeki tüm yerel verileri silmek istediğine emin misin? Bu işlem geri alınamaz.",
    confirmLabel: "Tümünü Sil",
    cancelLabel: "İptal",
  });
  if (!confirmed) return;
  localStorage.clear();
  write(SETTINGS_KEY, DEFAULT_APP_SETTINGS);
  write(POMODORO_SETTINGS_KEY, DEFAULT_POMODORO);
  fill();
  applyTheme("system");
  showToast("Tüm yerel veriler temizlendi.");
});

elements.deleteAccount.addEventListener("click", async () => {
  const confirmed = await StudyHubConfirmationDialog.open({
    title: "Hesabı sil",
    description:
      "Hesabını silmek istediğine emin misin? Bu işlem geri alınamaz.",
    details:
      "Backend bağlantısı bu sprintte etkin değildir; bu işlem yalnızca arayüz ön izlemesidir.",
    confirmLabel: "Hesabı Sil",
    cancelLabel: "İptal",
  });
  if (confirmed) {
    showToast("Hesap silme işlemi için backend bağlantısı gereklidir.");
  }
});

fill();
