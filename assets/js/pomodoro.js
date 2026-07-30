const POMODORO_KEYS = {
  settings: "studyhub.pomodoro.settings.v1",
  sessions: "studyhub.pomodoro.sessions.v1",
  timer: "studyhub.pomodoro.timer.v1",
  tasks: "studyhub.tasks.v1",
};

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyGoal: 4,
};

const pomodoroElements = {
  modeButtons: document.querySelectorAll("[data-work-mode]"),
  taskField: document.querySelector("#pomodoroTaskField"),
  taskSelect: document.querySelector("#pomodoroTask"),
  taskError: document.querySelector("#pomodoroTaskError"),
  phaseLabel: document.querySelector("#timerPhaseLabel"),
  timer: document.querySelector("#pomodoroTimer"),
  context: document.querySelector("#pomodoroTimerContext"),
  start: document.querySelector("#pomodoroStart"),
  pause: document.querySelector("#pomodoroPause"),
  reset: document.querySelector("#pomodoroReset"),
  breakSuggestion: document.querySelector("#pomodoroBreakSuggestion"),
  breakMessage: document.querySelector("#pomodoroBreakMessage"),
  startBreak: document.querySelector("#startSuggestedBreak"),
  settingsForm: document.querySelector("#pomodoroSettingsForm"),
  workMinutes: document.querySelector("#workMinutes"),
  shortBreakMinutes: document.querySelector("#shortBreakMinutes"),
  longBreakMinutes: document.querySelector("#longBreakMinutes"),
  dailyGoal: document.querySelector("#dailyGoal"),
  settingsFeedback: document.querySelector("#pomodoroSettingsFeedback"),
  goalProgressText: document.querySelector("#goalProgressText"),
  goalTimeText: document.querySelector("#goalTimeText"),
  goalCompletedTime: document.querySelector("#goalCompletedTime"),
  goalProgress: document.querySelector(".pomodoro-progress"),
  goalProgressBar: document.querySelector("#goalProgressBar"),
  goalSuccess: document.querySelector("#goalSuccess"),
  todayPomodoros: document.querySelector("#todayPomodoros"),
  todayWorkTime: document.querySelector("#todayWorkTime"),
  todayBreaks: document.querySelector("#todayBreaks"),
  todayTaskTime: document.querySelector("#todayTaskTime"),
  todayFreeTime: document.querySelector("#todayFreeTime"),
  sessions: document.querySelector("#recentSessions"),
  sessionsEmpty: document.querySelector("#recentSessionsEmpty"),
  sessionCount: document.querySelector("#recentSessionCount"),
  toast: document.querySelector("#pomodoroToast"),
};

const pomodoroState = {
  settings: { ...DEFAULT_SETTINGS },
  sessions: [],
  tasks: [],
  mode: "task",
  phase: "work",
  remainingSeconds: DEFAULT_SETTINGS.workMinutes * 60,
  isRunning: false,
  endAt: null,
  startedAt: null,
  selectedTaskId: "",
  intervalId: null,
  suggestedBreak: "short-break",
  toastTimer: null,
  lastRenderedSecond: null,
};

const readJson = (key, fallback) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return value ?? fallback;
  } catch (error) {
    console.error(`${key} yüklenemedi.`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`${key} kaydedilemedi.`, error);
    return false;
  }
};

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isToday = (isoDate) => {
  const date = new Date(isoDate);
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === todayKey();
};

const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} dakika`;
  if (!remainder) return `${hours} saat`;
  return `${hours} saat ${remainder} dakika`;
};

const showToast = (message) => {
  if (!pomodoroElements.toast) return;
  window.clearTimeout(pomodoroState.toastTimer);
  pomodoroElements.toast.textContent = message;
  pomodoroElements.toast.hidden = false;
  pomodoroState.toastTimer = window.setTimeout(() => {
    pomodoroElements.toast.hidden = true;
  }, 3200);
};

const phaseDurationSeconds = (phase = pomodoroState.phase) => {
  const key = phase === "work"
    ? "workMinutes"
    : phase === "short-break"
      ? "shortBreakMinutes"
      : "longBreakMinutes";
  return pomodoroState.settings[key] * 60;
};

const saveTimer = () => writeJson(POMODORO_KEYS.timer, {
  phase: pomodoroState.phase,
  remainingSeconds: pomodoroState.remainingSeconds,
  isRunning: pomodoroState.isRunning,
  endAt: pomodoroState.endAt,
  startedAt: pomodoroState.startedAt,
  mode: pomodoroState.mode,
  selectedTaskId: pomodoroState.selectedTaskId,
  suggestedBreak: pomodoroState.suggestedBreak,
  savedAt: new Date().toISOString(),
});

const renderTimer = () => {
  const seconds = Math.max(0, Math.ceil(pomodoroState.remainingSeconds));
  if (seconds === pomodoroState.lastRenderedSecond) return;
  pomodoroState.lastRenderedSecond = seconds;
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = String(seconds % 60).padStart(2, "0");
  pomodoroElements.timer.textContent = `${String(minutesPart).padStart(2, "0")}:${secondsPart}`;
  document.title = `${minutesPart}:${secondsPart} | Pomodoro | StudyHub`;
};

const setControls = () => {
  pomodoroElements.start.textContent = pomodoroState.isRunning
    ? "Çalışıyor"
    : pomodoroState.remainingSeconds < phaseDurationSeconds()
      ? "Devam Et"
      : "Başlat";
  pomodoroElements.start.disabled = pomodoroState.isRunning;
  pomodoroElements.pause.disabled = !pomodoroState.isRunning;
  pomodoroElements.modeButtons.forEach((button) => {
    button.disabled = pomodoroState.phase !== "work" || pomodoroState.isRunning;
  });
  pomodoroElements.taskSelect.disabled =
    pomodoroState.mode !== "task" ||
    pomodoroState.phase !== "work" ||
    pomodoroState.isRunning;
  pomodoroElements.phaseLabel.textContent =
    pomodoroState.phase === "work"
      ? "Çalışma"
      : pomodoroState.phase === "short-break"
        ? "Kısa Mola"
        : "Uzun Mola";
  pomodoroElements.context.textContent = pomodoroState.isRunning
    ? "Oturum devam ediyor."
    : pomodoroState.remainingSeconds < phaseDurationSeconds()
      ? "Oturum duraklatıldı."
      : "Hazır olduğunda sayacı başlat.";
};

const loadTasks = () => {
  const tasks = readJson(POMODORO_KEYS.tasks, []);
  pomodoroState.tasks = Array.isArray(tasks) ? tasks : [];
  const activeTasks = pomodoroState.tasks.filter(
    (task) => task?.id && task?.title && task.status !== "completed",
  );
  pomodoroElements.taskSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = activeTasks.length ? "Görev seçin" : "Aktif görev bulunmuyor";
  pomodoroElements.taskSelect.append(placeholder);
  activeTasks.forEach((task) => {
    const option = document.createElement("option");
    const plannedSessions = Array.isArray(task.pomodoroPlan?.segments)
      ? task.pomodoroPlan.segments.length
      : 0;
    option.value = task.id;
    option.textContent = plannedSessions
      ? `${task.title} · ${plannedSessions} oturum`
      : task.title;
    pomodoroElements.taskSelect.append(option);
  });
  if (activeTasks.some((task) => task.id === pomodoroState.selectedTaskId)) {
    pomodoroElements.taskSelect.value = pomodoroState.selectedTaskId;
  } else {
    pomodoroState.selectedTaskId = "";
  }
};

const todaySessions = () => pomodoroState.sessions.filter(
  (session) => session.status === "completed" && isToday(session.completedAt),
);

const renderStatistics = () => {
  const sessions = todaySessions();
  const workSessions = sessions.filter((session) => session.type === "work");
  const breaks = sessions.filter((session) => session.type !== "work");
  const totalMinutes = workSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const taskMinutes = workSessions.filter((session) => session.mode === "task")
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const freeMinutes = totalMinutes - taskMinutes;
  const completed = workSessions.length;
  const goal = pomodoroState.settings.dailyGoal;
  const percent = Math.min(100, (completed / goal) * 100);

  pomodoroElements.todayPomodoros.textContent = completed;
  pomodoroElements.todayWorkTime.textContent = formatDuration(totalMinutes);
  pomodoroElements.todayBreaks.textContent = breaks.length;
  pomodoroElements.todayTaskTime.textContent = formatDuration(taskMinutes);
  pomodoroElements.todayFreeTime.textContent = formatDuration(freeMinutes);
  pomodoroElements.goalProgressText.textContent = `${completed} / ${goal}`;
  pomodoroElements.goalTimeText.textContent =
    `≈ ${formatDuration(goal * pomodoroState.settings.workMinutes)} hedef`;
  pomodoroElements.goalCompletedTime.textContent =
    `${formatDuration(totalMinutes)} tamamlandı`;
  pomodoroElements.goalProgressBar.style.width = `${percent}%`;
  pomodoroElements.goalProgress.setAttribute("aria-valuemax", goal);
  pomodoroElements.goalProgress.setAttribute("aria-valuenow", completed);
  pomodoroElements.goalSuccess.hidden = completed < goal;
  renderSessions(sessions);
};

const renderSessions = (sessions) => {
  pomodoroElements.sessions.replaceChildren();
  pomodoroElements.sessionCount.textContent = `${sessions.length} oturum`;
  pomodoroElements.sessions.hidden = sessions.length === 0;
  pomodoroElements.sessionsEmpty.hidden = sessions.length > 0;
  const fragment = document.createDocumentFragment();
  [...sessions].reverse().forEach((session) => {
    const row = document.createElement("article");
    const time = document.createElement("time");
    const name = document.createElement("strong");
    const duration = document.createElement("span");
    const status = document.createElement("span");
    row.className = "pomodoro-session";
    time.dateTime = session.completedAt;
    time.textContent = new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(session.completedAt));
    name.textContent = session.type === "work"
      ? session.mode === "task" ? session.taskTitle : "Serbest Çalışma"
      : session.type === "short-break" ? "Kısa Mola" : "Uzun Mola";
    duration.textContent = formatDuration(session.durationMinutes);
    status.textContent = "Tamamlandı";
    row.append(time, name, duration, status);
    fragment.append(row);
  });
  pomodoroElements.sessions.append(fragment);
};

const updateLinkedTask = (taskId, durationMinutes, completedAt) => {
  const tasks = readJson(POMODORO_KEYS.tasks, []);
  if (!Array.isArray(tasks)) return;
  const nextTasks = tasks.map((task) => task.id === taskId ? {
    ...task,
    pomodoroCount: (Number(task.pomodoroCount) || 0) + 1,
    pomodoroMinutes: (Number(task.pomodoroMinutes) || 0) + durationMinutes,
    studyStats: {
      sessions: (Number(task.studyStats?.sessions) || 0) + 1,
      totalMinutes: (Number(task.studyStats?.totalMinutes) || 0) + durationMinutes,
      lastStudiedAt: completedAt,
    },
    updatedAt: completedAt,
  } : task);
  writeJson(POMODORO_KEYS.tasks, nextTasks);
  pomodoroState.tasks = nextTasks;
};

const recordCompletedSession = () => {
  const completedAt = new Date().toISOString();
  const durationMinutes = phaseDurationSeconds() / 60;
  const task = pomodoroState.tasks.find(
    (item) => item.id === pomodoroState.selectedTaskId,
  );
  const session = {
    id: window.crypto?.randomUUID?.() ?? `session-${Date.now()}`,
    type: pomodoroState.phase,
    mode: pomodoroState.phase === "work" ? pomodoroState.mode : "system",
    taskId: pomodoroState.phase === "work" && pomodoroState.mode === "task"
      ? task?.id ?? null : null,
    taskTitle: pomodoroState.phase === "work" && pomodoroState.mode === "task"
      ? task?.title ?? null : null,
    durationMinutes,
    startedAt: pomodoroState.startedAt ?? completedAt,
    completedAt,
    dateKey: todayKey(),
    status: "completed",
  };
  const nextSessions = [...pomodoroState.sessions, session];
  if (!writeJson(POMODORO_KEYS.sessions, nextSessions)) {
    showToast("Oturum kaydedilemedi.");
    return;
  }
  pomodoroState.sessions = nextSessions;
  if (session.type === "work" && session.mode === "task" && session.taskId) {
    updateLinkedTask(session.taskId, durationMinutes, completedAt);
  }
};

const stopInterval = () => {
  window.clearInterval(pomodoroState.intervalId);
  pomodoroState.intervalId = null;
};

const completeTimer = () => {
  stopInterval();
  pomodoroState.remainingSeconds = 0;
  pomodoroState.isRunning = false;
  recordCompletedSession();
  const completedPhase = pomodoroState.phase;

  if (completedPhase === "work") {
    const workCount = todaySessions().filter((session) => session.type === "work").length;
    pomodoroState.suggestedBreak = workCount % 4 === 0 ? "long-break" : "short-break";
    pomodoroElements.breakMessage.textContent =
      pomodoroState.suggestedBreak === "long-break"
        ? "Dört çalışma tamamlandı. Uzun mola zamanı."
        : "Çalışma tamamlandı. Kısa bir mola verebilirsin.";
    pomodoroElements.breakSuggestion.hidden = false;
    showToast("Çalışma oturumu tamamlandı.");
    pomodoroState.phase = "work";
  } else {
    showToast("Mola tamamlandı. Yeni bir çalışma oturumuna hazırsın.");
    pomodoroState.phase = "work";
    pomodoroElements.breakSuggestion.hidden = true;
  }

  pomodoroState.remainingSeconds = phaseDurationSeconds("work");
  pomodoroState.endAt = null;
  pomodoroState.startedAt = null;
  pomodoroState.lastRenderedSecond = null;
  saveTimer();
  renderTimer();
  setControls();
  renderStatistics();
  loadTasks();
};

const tick = () => {
  if (!pomodoroState.isRunning || !pomodoroState.endAt) return;
  pomodoroState.remainingSeconds = Math.max(
    0,
    (pomodoroState.endAt - Date.now()) / 1000,
  );
  renderTimer();
  if (pomodoroState.remainingSeconds <= 0) completeTimer();
};

const startTimer = () => {
  if (
    pomodoroState.phase === "work" &&
    pomodoroState.mode === "task" &&
    !pomodoroElements.taskSelect.value
  ) {
    pomodoroElements.taskError.textContent = "Çalışmak istediğin görevi seç.";
    pomodoroElements.taskSelect.focus();
    return;
  }
  pomodoroState.selectedTaskId = pomodoroElements.taskSelect.value;
  pomodoroElements.taskError.textContent = "";
  pomodoroState.isRunning = true;
  pomodoroState.startedAt ??= new Date().toISOString();
  pomodoroState.endAt = Date.now() + pomodoroState.remainingSeconds * 1000;
  saveTimer();
  stopInterval();
  pomodoroState.intervalId = window.setInterval(tick, 250);
  setControls();
};

const pauseTimer = () => {
  tick();
  pomodoroState.isRunning = false;
  pomodoroState.endAt = null;
  stopInterval();
  saveTimer();
  setControls();
};

const resetTimer = () => {
  stopInterval();
  pomodoroState.phase = "work";
  pomodoroState.isRunning = false;
  pomodoroState.endAt = null;
  pomodoroState.startedAt = null;
  pomodoroState.remainingSeconds = phaseDurationSeconds("work");
  pomodoroState.lastRenderedSecond = null;
  pomodoroElements.breakSuggestion.hidden = true;
  saveTimer();
  renderTimer();
  setControls();
};

const startBreak = () => {
  pomodoroState.phase = pomodoroState.suggestedBreak;
  pomodoroState.remainingSeconds = phaseDurationSeconds();
  pomodoroState.startedAt = null;
  pomodoroState.lastRenderedSecond = null;
  pomodoroElements.breakSuggestion.hidden = true;
  renderTimer();
  setControls();
  startTimer();
};

const setMode = (mode) => {
  if (pomodoroState.isRunning || pomodoroState.phase !== "work") return;
  pomodoroState.mode = mode;
  pomodoroElements.modeButtons.forEach((button) => {
    const active = button.dataset.workMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  pomodoroElements.taskField.hidden = mode === "free";
  pomodoroElements.taskError.textContent = "";
  saveTimer();
  setControls();
};

const saveSettings = (event) => {
  event.preventDefault();
  const settings = {
    workMinutes: Number(pomodoroElements.workMinutes.value),
    shortBreakMinutes: Number(pomodoroElements.shortBreakMinutes.value),
    longBreakMinutes: Number(pomodoroElements.longBreakMinutes.value),
    dailyGoal: Number(pomodoroElements.dailyGoal.value),
  };
  const valid = settings.workMinutes >= 1 && settings.workMinutes <= 180 &&
    settings.shortBreakMinutes >= 1 && settings.shortBreakMinutes <= 60 &&
    settings.longBreakMinutes >= 1 && settings.longBreakMinutes <= 120 &&
    settings.dailyGoal >= 1 && settings.dailyGoal <= 50;
  if (!valid || pomodoroState.isRunning) {
    pomodoroElements.settingsFeedback.textContent = pomodoroState.isRunning
      ? "Çalışan sayaç durdurulmadan ayarlar değiştirilemez."
      : "Lütfen ayar değerlerini izin verilen aralıklarda gir.";
    pomodoroElements.settingsFeedback.hidden = false;
    return;
  }
  if (!writeJson(POMODORO_KEYS.settings, settings)) {
    pomodoroElements.settingsFeedback.textContent = "Ayarlar kaydedilemedi.";
    pomodoroElements.settingsFeedback.hidden = false;
    return;
  }
  pomodoroState.settings = settings;
  pomodoroElements.settingsFeedback.hidden = true;
  resetTimer();
  renderStatistics();
  showToast("Pomodoro ayarları kaydedildi.");
};

const loadState = () => {
  const settings = readJson(POMODORO_KEYS.settings, DEFAULT_SETTINGS);
  pomodoroState.settings = {
    workMinutes: Number(settings.workMinutes) || 25,
    shortBreakMinutes: Number(settings.shortBreakMinutes) || 5,
    longBreakMinutes: Number(settings.longBreakMinutes) || 15,
    dailyGoal: Number(settings.dailyGoal) || 4,
  };
  const sessions = readJson(POMODORO_KEYS.sessions, []);
  pomodoroState.sessions = Array.isArray(sessions) ? sessions : [];
  const timer = readJson(POMODORO_KEYS.timer, null);
  if (timer) {
    pomodoroState.phase = ["work", "short-break", "long-break"].includes(timer.phase)
      ? timer.phase : "work";
    pomodoroState.mode = timer.mode === "free" ? "free" : "task";
    pomodoroState.remainingSeconds = Number(timer.remainingSeconds) ||
      phaseDurationSeconds();
    pomodoroState.isRunning = Boolean(timer.isRunning && timer.endAt);
    pomodoroState.endAt = Number(timer.endAt) || null;
    pomodoroState.startedAt = timer.startedAt || null;
    pomodoroState.selectedTaskId = timer.selectedTaskId || "";
    pomodoroState.suggestedBreak = timer.suggestedBreak || "short-break";
  } else {
    pomodoroState.remainingSeconds = phaseDurationSeconds();
  }
  pomodoroElements.workMinutes.value = pomodoroState.settings.workMinutes;
  pomodoroElements.shortBreakMinutes.value = pomodoroState.settings.shortBreakMinutes;
  pomodoroElements.longBreakMinutes.value = pomodoroState.settings.longBreakMinutes;
  pomodoroElements.dailyGoal.value = pomodoroState.settings.dailyGoal;
};

const initializePomodoro = () => {
  if (!pomodoroElements.timer) return;
  loadState();
  loadTasks();
  pomodoroElements.modeButtons.forEach((button) => {
    const active = button.dataset.workMode === pomodoroState.mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  pomodoroElements.taskField.hidden = pomodoroState.mode === "free";
  renderStatistics();
  renderTimer();
  setControls();
  pomodoroElements.modeButtons.forEach((button) =>
    button.addEventListener("click", () => setMode(button.dataset.workMode)));
  pomodoroElements.taskSelect.addEventListener("change", () => {
    pomodoroState.selectedTaskId = pomodoroElements.taskSelect.value;
    pomodoroElements.taskError.textContent = "";
    saveTimer();
  });
  pomodoroElements.start.addEventListener("click", startTimer);
  pomodoroElements.pause.addEventListener("click", pauseTimer);
  pomodoroElements.reset.addEventListener("click", resetTimer);
  pomodoroElements.startBreak.addEventListener("click", startBreak);
  pomodoroElements.settingsForm.addEventListener("submit", saveSettings);
  window.addEventListener("storage", (event) => {
    if (event.key === POMODORO_KEYS.tasks) loadTasks();
  });
  window.addEventListener("studyhub:data-changed", loadTasks);
  if (pomodoroState.isRunning) {
    tick();
    if (pomodoroState.isRunning) {
      pomodoroState.intervalId = window.setInterval(tick, 250);
    }
  }
};

initializePomodoro();
