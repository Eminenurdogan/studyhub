const HOME_KEYS = {
  profile: "studyhub.profile.v1",
  authentication: "studyhub.auth.v1",
  tasks: "studyhub.tasks.v1",
  courses: "studyhub.courses.v1",
  sessions: "studyhub.pomodoro.sessions.v1",
};

const homeElements = {
  pageTitle: document.querySelector("#dashboardTodayTitle"),
  welcome: document.querySelector("#welcomeTitle"),
  taskCount: document.querySelector("#todayTaskCount"),
  taskMeta: document.querySelector("#todayTaskMeta"),
  duration: document.querySelector("#todayPlannedDuration"),
  sessionMeta: document.querySelector("#todaySessionMeta"),
  completionRate: document.querySelector("#todayCompletionRate"),
  completedMeta: document.querySelector("#todayCompletedMeta"),
  streak: document.querySelector("#todayStreak"),
  streakMeta: document.querySelector("#todayStreakMeta"),
  planBadge: document.querySelector("#todayPlanBadge"),
  planList: document.querySelector("#todayPlanList"),
  upcomingList: document.querySelector("#todayUpcomingList"),
  motivation: document.querySelector("#todayMotivation"),
  motivationMeta: document.querySelector("#todayMotivationMeta"),
};

const readHomeStorage = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const homeDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getHomeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 10) return { emoji: "🌅", text: "Günaydın" };
  if (hour >= 11 && hour <= 14) return { emoji: "☀️", text: "İyi Öğlenler" };
  if (hour >= 15 && hour <= 18) return { emoji: "🌤️", text: "İyi Günler" };
  if (hour >= 19 && hour <= 22) return { emoji: "🌇", text: "İyi Akşamlar" };
  return { emoji: "🌙", text: "İyi Geceler" };
};

const getHomeProfileName = () => {
  const profile = readHomeStorage(HOME_KEYS.profile, {});
  const authentication = readHomeStorage(HOME_KEYS.authentication, {});
  const profileName = String(profile.fullName || "").trim();
  const authName = String(authentication.user?.name || "").trim();
  const isGeneric = (name) =>
    ["", "kullanıcı", "studyhub kullanıcısı"].includes(
      name.toLocaleLowerCase("tr-TR"),
    );
  if (!isGeneric(profileName)) return profileName;
  if (!isGeneric(authName)) return authName;
  return "";
};

const durationText = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} dk`;
  return `${hours} sa${remainder ? ` ${remainder} dk` : ""}`;
};

const renderHomeEmpty = (container, message, tagName = "li") => {
  const item = document.createElement(tagName);
  item.className = "today-data-empty";
  item.textContent = message;
  container.append(item);
};

const renderDashboardHome = () => {
  const tasksValue = readHomeStorage(HOME_KEYS.tasks, []);
  const coursesValue = readHomeStorage(HOME_KEYS.courses, []);
  const sessionsValue = readHomeStorage(HOME_KEYS.sessions, []);
  const tasks = Array.isArray(tasksValue) ? tasksValue : [];
  const courses = Array.isArray(coursesValue) ? coursesValue : [];
  const sessions = (Array.isArray(sessionsValue) ? sessionsValue : []).filter(
    (session) => session?.status === "completed" && session.type === "work",
  );
  const today = homeDateKey();
  const courseNames = new Map(courses.map((course) => [course.id, course.name]));
  const todayTasks = tasks
    .filter((task) => task.dueDate === today)
    .sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return (priority[b.priority] || 0) - (priority[a.priority] || 0);
    });
  const completedTodayTasks = todayTasks.filter(
    (task) => task.status === "completed",
  );
  const activeTodayTasks = todayTasks.filter(
    (task) => task.status !== "completed",
  );
  const todaySessions = sessions.filter(
    (session) => homeDateKey(session.completedAt) === today,
  );
  const plannedMinutes = todayTasks.reduce(
    (total, task) => total + (Number(task.duration) || 0),
    0,
  );
  const completionRate = todayTasks.length
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
    : 0;

  const greeting = getHomeGreeting();
  const profileName = getHomeProfileName();
  homeElements.pageTitle.textContent = `${greeting.emoji} Bugün`;
  homeElements.welcome.textContent = `${greeting.emoji} ${greeting.text}${profileName ? `, ${profileName}` : ""}`;
  homeElements.taskCount.textContent = String(todayTasks.length);
  homeElements.taskMeta.textContent = activeTodayTasks.length
    ? `${activeTodayTasks.length} görev sırada`
    : todayTasks.length
      ? "Bugünkü görevlerin tamamlandı"
      : "Bugün için görev bulunmuyor";
  homeElements.duration.textContent = durationText(plannedMinutes);
  homeElements.sessionMeta.textContent = `${todaySessions.length} çalışma oturumu`;
  homeElements.completionRate.textContent = `%${completionRate}`;
  homeElements.completedMeta.textContent = `${completedTodayTasks.length} görev tamamlandı`;

  const sessionDays = new Set(sessions.map((session) => homeDateKey(session.completedAt)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!sessionDays.has(homeDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (sessionDays.has(homeDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  homeElements.streak.textContent = `${streak} gün`;
  homeElements.streakMeta.textContent = streak
    ? "Çalışma ritmini koruyorsun"
    : "İlk odak oturumunu tamamla";

  homeElements.planBadge.textContent = `${todayTasks.length} görev`;
  homeElements.planList.replaceChildren();
  if (!todayTasks.length) {
    renderHomeEmpty(
      homeElements.planList,
      "Bugün için planlanmış görev yok. Görevler sayfasından yeni bir görev ekleyebilirsin.",
    );
  } else {
    todayTasks.forEach((task) => {
      const item = document.createElement("li");
      const state = document.createElement("time");
      const marker = document.createElement("span");
      const content = document.createElement("div");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      item.className = "today-plan-item";
      if (task.status === "completed") item.classList.add("is-completed");
      state.dateTime = task.dueDate;
      state.textContent = task.status === "completed" ? "Bitti" : "Bugün";
      marker.className = "today-plan-marker";
      marker.setAttribute("aria-hidden", "true");
      title.textContent = task.title;
      meta.textContent = `${courseNames.get(task.course) || "Ders belirtilmedi"} · ${durationText(task.duration)}`;
      content.append(title, meta);
      item.append(state, marker, content);
      homeElements.planList.append(item);
    });
  }

  const upcoming = tasks
    .filter((task) => task.status !== "completed" && task.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  homeElements.upcomingList.replaceChildren();
  if (!upcoming.length) {
    renderHomeEmpty(
      homeElements.upcomingList,
      "Yaklaşan teslim tarihli görev bulunmuyor.",
    );
  } else {
    upcoming.forEach((task) => {
      const item = document.createElement("li");
      const content = document.createElement("div");
      const title = document.createElement("strong");
      const course = document.createElement("span");
      const time = document.createElement("time");
      const dueDate = new Date(`${task.dueDate}T12:00:00`);
      title.textContent = task.title;
      course.textContent = courseNames.get(task.course) || "Ders belirtilmedi";
      time.dateTime = task.dueDate;
      time.textContent = new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
      }).format(dueDate);
      content.append(title, course);
      item.append(content, time);
      homeElements.upcomingList.append(item);
    });
  }

  if (todayTasks.length && completionRate === 100) {
    homeElements.motivation.textContent = "Bugünkü görevlerinin tamamını bitirdin.";
    homeElements.motivationMeta.textContent = `${completedTodayTasks.length} görev tamamlandı.`;
  } else if (activeTodayTasks.length) {
    homeElements.motivation.textContent = "Bir sonraki küçük adım, bugünkü ilerlemeni başlatır.";
    homeElements.motivationMeta.textContent = `${activeTodayTasks.length} aktif görev seni bekliyor.`;
  } else {
    homeElements.motivation.textContent = "Çalışma alanın hazır.";
    homeElements.motivationMeta.textContent = "Bugün için bir görev planlayarak başlayabilirsin.";
  }
};

renderDashboardHome();
window.addEventListener("storage", (event) => {
  if (Object.values(HOME_KEYS).includes(event.key)) renderDashboardHome();
});
