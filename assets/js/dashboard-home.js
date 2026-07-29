const dashboardData = window.StudyHubDashboardData;

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

const durationText = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} dk`;
  return `${hours} sa${remainder ? ` ${remainder} dk` : ""}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 10) return { emoji: "🌅", text: "Günaydın" };
  if (hour >= 11 && hour <= 14) return { emoji: "☀️", text: "İyi Öğlenler" };
  if (hour >= 15 && hour <= 18) return { emoji: "🌤️", text: "İyi Günler" };
  if (hour >= 19 && hour <= 22) return { emoji: "🌇", text: "İyi Akşamlar" };
  return { emoji: "🌙", text: "İyi Geceler" };
};

const renderEmptyState = (
  container,
  {
    icon,
    title,
    description,
    href = "",
    linkLabel = "",
    tagName = "li",
  },
) => {
  const item = document.createElement(tagName);
  const symbol = document.createElement("span");
  const content = document.createElement("span");
  const heading = document.createElement("strong");
  const detail = document.createElement("span");
  item.className = "today-data-empty";
  symbol.className = "today-data-empty__icon";
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = icon;
  heading.textContent = title;
  detail.textContent = description;
  content.append(heading, detail);
  item.append(symbol, content);
  if (href && linkLabel) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = linkLabel;
    item.append(link);
  }
  container.append(item);
};

const renderPlan = (snapshot) => {
  homeElements.planList.replaceChildren();
  if (!snapshot.todayTasks.length) {
    renderEmptyState(homeElements.planList, {
      icon: "📚",
      title: "Henüz bugün için görev planlamadın.",
      description: "Günün planını oluşturduğunda görevlerin burada görünecek.",
      href: "tasks.html",
      linkLabel: "Yeni görev oluştur",
    });
    return;
  }

  const fragment = document.createDocumentFragment();
  snapshot.todayTasks.forEach((task) => {
    const item = document.createElement("li");
    const state = document.createElement("time");
    const marker = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    item.className = "today-plan-item";
    if (task.status === "completed") item.classList.add("is-completed");
    state.dateTime = task.dueDate;
    state.textContent =
      task.status === "completed"
        ? "Bitti"
        : String(task.time || task.startTime || task.dueTime || "Bugün");
    marker.className = "today-plan-marker";
    marker.setAttribute("aria-hidden", "true");
    title.textContent = task.title;
    meta.textContent = `${snapshot.courseNames.get(task.course) || "Çalışma alanı belirtilmedi"} · ${durationText(task.duration)}`;
    content.append(title, meta);
    item.append(state, marker, content);
    fragment.append(item);
  });
  homeElements.planList.append(fragment);
};

const renderUpcoming = (snapshot) => {
  homeElements.upcomingList.replaceChildren();
  if (!snapshot.upcomingTasks.length) {
    renderEmptyState(homeElements.upcomingList, {
      icon: "🗓️",
      title: "Önümüzdeki 7 gün sakin görünüyor.",
      description: "Yaklaşan teslim tarihli aktif görevin bulunmuyor.",
    });
    return;
  }

  const fragment = document.createDocumentFragment();
  snapshot.upcomingTasks.slice(0, 4).forEach((task) => {
    const item = document.createElement("li");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const course = document.createElement("span");
    const time = document.createElement("time");
    const dueDate = new Date(`${task.dueDate}T12:00:00`);
    title.textContent = task.title;
    course.textContent =
      snapshot.courseNames.get(task.course) || "Çalışma alanı belirtilmedi";
    time.dateTime = task.dueDate;
    time.textContent = new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
    }).format(dueDate);
    content.append(title, course);
    item.append(content, time);
    fragment.append(item);
  });
  homeElements.upcomingList.append(fragment);
};

const renderDashboardHome = () => {
  if (!dashboardData) return;
  const snapshot = dashboardData.getSnapshot();
  const greeting = getGreeting();
  const remainingCount = snapshot.activeTasks.length;

  homeElements.pageTitle.textContent = `${greeting.emoji} Bugün`;
  homeElements.welcome.textContent =
    `${greeting.emoji} ${greeting.text}${snapshot.profileName ? `, ${snapshot.profileName}` : ""}`;
  homeElements.taskCount.textContent = String(remainingCount);
  homeElements.taskMeta.textContent = snapshot.todayTasks.length
    ? remainingCount
      ? `${snapshot.completedTasks.length}/${snapshot.todayTasks.length} görev tamamlandı`
      : "Bugünkü görevlerin tamamlandı"
    : "Bugün için görev bulunmuyor";
  homeElements.duration.textContent = durationText(snapshot.plannedMinutes);
  homeElements.sessionMeta.textContent =
    `${snapshot.todaySessionCount} çalışma oturumu`;
  homeElements.completionRate.textContent = `%${snapshot.completionRate}`;
  homeElements.completedMeta.textContent =
    `${snapshot.completedTasks.length}/${snapshot.todayTasks.length} görev tamamlandı`;
  homeElements.streak.textContent = `${snapshot.streak} gün`;
  homeElements.streakMeta.textContent = snapshot.streak
    ? "Çalışma ritmini koruyorsun"
    : "İlk odak oturumunu tamamla";
  homeElements.planBadge.textContent =
    `${remainingCount} görev kaldı`;
  homeElements.motivation.textContent = snapshot.motivation.title;
  homeElements.motivationMeta.textContent = snapshot.motivation.detail;

  renderPlan(snapshot);
  renderUpcoming(snapshot);
};

renderDashboardHome();
window.addEventListener("storage", (event) => {
  if (Object.values(dashboardData?.KEYS || {}).includes(event.key)) {
    renderDashboardHome();
  }
});
