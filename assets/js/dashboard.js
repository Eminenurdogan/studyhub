const dashboardSidebar = document.querySelector("#appSidebar");
const sidebarMenuButton = document.querySelector(".sidebar-menu-button");
const sidebarCloseButton = document.querySelector(".sidebar-close-button");
const sidebarBackdrop = document.querySelector(".sidebar-backdrop");
const dashboardPage = document.querySelector(".dashboard-page");

const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
const dashboardThemeMediaQuery = window.matchMedia(
  "(prefers-color-scheme: dark)",
);
const DASHBOARD_SETTINGS_KEY = "studyhub.settings.v1";

const getDashboardThemePreference = () => {
  try {
    return JSON.parse(
      window.localStorage.getItem(DASHBOARD_SETTINGS_KEY) ?? "{}",
    ).theme ?? "system";
  } catch {
    return "system";
  }
};

const applyDashboardTheme = () => {
  if (!dashboardPage) return;
  const preference = getDashboardThemePreference();
  const dark =
    preference === "dark" ||
    (preference === "system" && dashboardThemeMediaQuery.matches);
  dashboardPage.dataset.theme = dark ? "dark" : "light";
};

applyDashboardTheme();
dashboardThemeMediaQuery.addEventListener("change", applyDashboardTheme);
window.addEventListener("storage", (event) => {
  if (event.key === DASHBOARD_SETTINGS_KEY) applyDashboardTheme();
});

let previouslyFocusedElement = null;

const getSidebarFocusableElements = () => {
  if (!dashboardSidebar) {
    return [];
  }

  return Array.from(
    dashboardSidebar.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
};

const isSidebarOpen = () =>
  dashboardSidebar?.classList.contains("is-open") ?? false;

const openSidebar = () => {
  if (
    !dashboardSidebar ||
    !sidebarMenuButton ||
    !sidebarBackdrop ||
    !dashboardPage ||
    desktopMediaQuery.matches
  ) {
    return;
  }

  previouslyFocusedElement = document.activeElement;

  dashboardSidebar.classList.add("is-open");
  sidebarBackdrop.classList.add("is-visible");
  dashboardPage.classList.add("sidebar-open");
  sidebarMenuButton.setAttribute("aria-expanded", "true");

  sidebarCloseButton?.focus();
};

const closeSidebar = ({ restoreFocus = true } = {}) => {
  if (
    !dashboardSidebar ||
    !sidebarMenuButton ||
    !sidebarBackdrop ||
    !dashboardPage
  ) {
    return;
  }

  dashboardSidebar.classList.remove("is-open");
  sidebarBackdrop.classList.remove("is-visible");
  dashboardPage.classList.remove("sidebar-open");
  sidebarMenuButton.setAttribute("aria-expanded", "false");

  if (
    restoreFocus &&
    previouslyFocusedElement instanceof HTMLElement &&
    document.contains(previouslyFocusedElement)
  ) {
    previouslyFocusedElement.focus();
  }

  previouslyFocusedElement = null;
};

const handleSidebarKeydown = (event) => {
  if (!isSidebarOpen()) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeSidebar();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getSidebarFocusableElements();
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements.at(-1);

  if (!firstFocusableElement || !lastFocusableElement) {
    event.preventDefault();
    return;
  }

  if (event.shiftKey && document.activeElement === firstFocusableElement) {
    event.preventDefault();
    lastFocusableElement.focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === lastFocusableElement
  ) {
    event.preventDefault();
    firstFocusableElement.focus();
  }
};

const handleViewportChange = (event) => {
  if (event.matches && isSidebarOpen()) {
    closeSidebar({ restoreFocus: false });
    dashboardSidebar
      ?.querySelector('[aria-current="page"]')
      ?.focus();
  }
};

if (
  dashboardSidebar &&
  sidebarMenuButton &&
  sidebarCloseButton &&
  sidebarBackdrop &&
  dashboardPage
) {
  sidebarMenuButton.addEventListener("click", openSidebar);
  sidebarCloseButton.addEventListener("click", () => closeSidebar());
  sidebarBackdrop.addEventListener("click", () => closeSidebar());
  document.addEventListener("keydown", handleSidebarKeydown);
  desktopMediaQuery.addEventListener("change", handleViewportChange);
}

const DASHBOARD_PROFILE_KEY = "studyhub.profile.v1";
const DASHBOARD_AUTH_KEY = "studyhub.auth.v1";
const DASHBOARD_TASKS_KEY = "studyhub.tasks.v1";
const DASHBOARD_SESSIONS_KEY = "studyhub.pomodoro.sessions.v1";
const DASHBOARD_POMODORO_SETTINGS_KEY = "studyhub.pomodoro.settings.v1";
const dashboardUserMenuHost = document.querySelector(".dashboard-header-end");
const DASHBOARD_PAGE_EMOJIS = new Map([
  ["dashboard.html", "☀️"],
  ["courses.html", "📚"],
  ["tasks.html", "📝"],
  ["calendar.html", "📅"],
  ["pomodoro.html", "🍅"],
  ["analytics.html", "📊"],
  ["hubby-ai.html", "✨"],
  ["account.html", "👤"],
  ["settings.html", "⚙️"],
]);

const applyDashboardPageIdentity = () => {
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  const emoji = DASHBOARD_PAGE_EMOJIS.get(currentPage);
  const title = document.querySelector(".dashboard-page-identity h1");
  if (emoji && title && !title.textContent.trim().startsWith(emoji)) {
    title.textContent = `${emoji} ${title.textContent.trim()}`;
  }
};

const readDashboardStorage = (key, fallback = null) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const getProfileViewModel = () => {
  const profile = readDashboardStorage(DASHBOARD_PROFILE_KEY, {});
  const authentication = readDashboardStorage(DASHBOARD_AUTH_KEY, {});
  const genericNames = new Set(["", "kullanıcı", "studyhub kullanıcısı"]);
  const storedName = String(profile.fullName || "").trim();
  const authenticatedName = String(authentication.user?.name || "").trim();
  const fullName = genericNames.has(storedName.toLocaleLowerCase("tr-TR"))
    ? genericNames.has(authenticatedName.toLocaleLowerCase("tr-TR"))
      ? "Profilini tamamla"
      : authenticatedName
    : storedName;
  const storedEmail = String(profile.email || "").trim();
  const authenticatedEmail = String(authentication.user?.email || "").trim();
  const email =
    !storedEmail || storedEmail === "kullanici@studyhub.local"
      ? authenticatedEmail || "E-posta eklenmedi"
      : storedEmail;
  const role = String(
    profile.role ||
      profile.goals?.program ||
      profile.goals?.career ||
      "Öğrenci",
  ).trim();
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");

  return {
    fullName,
    shortName: fullName.split(/\s+/).slice(0, 2).join(" "),
    email,
    role,
    initials: initials || "S",
    photo: typeof profile.photo === "string" ? profile.photo : "",
  };
};

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getDashboardAccountSummary = () => {
  const tasks = readDashboardStorage(DASHBOARD_TASKS_KEY, []);
  const sessions = readDashboardStorage(DASHBOARD_SESSIONS_KEY, []);
  const settings = readDashboardStorage(DASHBOARD_POMODORO_SETTINGS_KEY, {});
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedSessions = (Array.isArray(sessions) ? sessions : []).filter(
    (session) => session?.status === "completed" && session.type === "work",
  );
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklySessions = completedSessions.filter(
    (session) => new Date(session.completedAt) >= weekStart,
  );
  const weeklyMinutes = weeklySessions.reduce(
    (total, session) => total + Number(session.durationMinutes || 0),
    0,
  );
  const sessionDays = new Map();
  completedSessions.forEach((session) => {
    const key = getDateKey(session.completedAt);
    if (key) sessionDays.set(key, (sessionDays.get(key) || 0) + 1);
  });
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!sessionDays.has(getDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (sessionDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const dailyGoal = Math.max(1, Number(settings.dailyGoal) || 4);
  let achievedDays = 0;
  for (let index = 0; index < 7; index += 1) {
    const day = new Date();
    day.setDate(day.getDate() - index);
    if ((sessionDays.get(getDateKey(day)) || 0) >= dailyGoal) achievedDays += 1;
  }
  const todayCount = sessionDays.get(getDateKey(new Date())) || 0;
  const overdue = safeTasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return (
      task.status !== "completed" &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate < new Date()
    );
  });
  const highPriority = safeTasks.filter(
    (task) => task.status !== "completed" && task.priority === "high",
  );
  let hubbyMessage = "Bugünkü çalışma planın dengeli görünüyor.";
  if (overdue.length) {
    hubbyMessage = `${overdue.length} geciken görevin var. Önce en yakın teslim tarihine odaklan.`;
  } else if (highPriority.length) {
    hubbyMessage = `${highPriority.length} yüksek öncelikli görevin plan bekliyor.`;
  } else if (todayCount < dailyGoal) {
    hubbyMessage = `Günlük hedefin için ${dailyGoal - todayCount} Pomodoro daha tamamlayabilirsin.`;
  }

  const hours = Math.floor(weeklyMinutes / 60);
  const minutes = Math.round(weeklyMinutes % 60);
  const weeklyText = hours
    ? `${hours} sa${minutes ? ` ${minutes} dk` : ""}`
    : `${minutes} dk`;

  return {
    streak,
    weeklyText,
    goalRate: Math.round((achievedDays / 7) * 100),
    hubbyMessage,
  };
};

const createDashboardIcon = (symbol) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("dashboard-account-menu__icon");
  use.setAttribute("href", `assets/icons/dashboard-nav.svg#${symbol}`);
  svg.append(use);
  return svg;
};

const createAvatar = (profile, className) => {
  const avatar = document.createElement("span");
  avatar.className = className;
  avatar.setAttribute("aria-hidden", "true");

  if (profile.photo) {
    const image = document.createElement("img");
    image.src = profile.photo;
    image.alt = "";
    avatar.append(image);
  } else {
    avatar.textContent = profile.initials;
  }

  return avatar;
};

const initializeDashboardAccountMenu = () => {
  if (!dashboardUserMenuHost) return;

  const profile = getProfileViewModel();
  const summary = getDashboardAccountSummary();
  const sidebarName = document.querySelector(".sidebar-profile-name");
  const sidebarRole = document.querySelector(".sidebar-profile-label");
  const sidebarAvatar = document.querySelector(".sidebar-profile-avatar");
  if (sidebarName) sidebarName.textContent = profile.shortName;
  if (sidebarRole) sidebarRole.textContent = profile.role;
  if (sidebarAvatar) {
    sidebarAvatar.textContent = "";
    if (profile.photo) {
      const image = document.createElement("img");
      image.src = profile.photo;
      image.alt = "";
      sidebarAvatar.append(image);
    } else {
      sidebarAvatar.textContent = profile.initials;
    }
  }
  const wrapper = document.createElement("div");
  const trigger = document.createElement("button");
  const identity = document.createElement("span");
  const name = document.createElement("strong");
  const role = document.createElement("small");
  const chevron = document.createElement("span");
  const dropdown = document.createElement("div");

  wrapper.className = "dashboard-account";
  trigger.className = "dashboard-account-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-controls", "dashboardAccountMenu");
  trigger.append(createAvatar(profile, "dashboard-account-avatar"));

  identity.className = "dashboard-account-trigger__identity";
  name.textContent = profile.shortName;
  role.textContent = profile.role;
  identity.append(name, role);

  chevron.className = "dashboard-account-trigger__chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  trigger.append(identity, chevron);

  dropdown.className = "dashboard-account-menu";
  dropdown.id = "dashboardAccountMenu";
  dropdown.setAttribute("role", "menu");
  dropdown.hidden = true;

  const profileHeader = document.createElement("div");
  const profileText = document.createElement("div");
  const profileName = document.createElement("strong");
  const profileEmail = document.createElement("span");
  profileHeader.className = "dashboard-account-menu__profile";
  profileName.textContent = profile.fullName;
  profileEmail.textContent = profile.email;
  profileText.append(profileName, profileEmail);
  profileHeader.append(
    createAvatar(profile, "dashboard-account-menu__avatar"),
    profileText,
  );

  const createMenuLink = (
    label,
    description,
    href,
    icon,
    modifier = "",
  ) => {
    const link = document.createElement("a");
    const text = document.createElement("span");
    const title = document.createElement("strong");
    const detail = document.createElement("small");
    link.href = href;
    link.className = `dashboard-account-menu__item ${modifier}`.trim();
    link.setAttribute("role", "menuitem");
    title.textContent = label;
    detail.textContent = description;
    text.append(title, detail);
    link.append(createDashboardIcon(icon), text);
    return link;
  };

  const stats = document.createElement("div");
  stats.className = "dashboard-account-menu__stats";
  [
    ["Seri", `${summary.streak} gün`, "🔥"],
    ["Bu hafta", summary.weeklyText, "⏱"],
    ["Hedef", `%${summary.goalRate}`, "🎯"],
  ].forEach(([label, value, icon]) => {
    const item = document.createElement("div");
    const symbol = document.createElement("span");
    const text = document.createElement("span");
    const title = document.createElement("small");
    const result = document.createElement("strong");
    symbol.textContent = icon;
    title.textContent = label;
    result.textContent = value;
    text.append(title, result);
    item.append(symbol, text);
    stats.append(item);
  });

  const firstGroup = document.createElement("div");
  const secondGroup = document.createElement("div");
  firstGroup.className = "dashboard-account-menu__group";
  secondGroup.className = "dashboard-account-menu__group";
  firstGroup.append(
    createMenuLink("Dashboard", "Bugünkü çalışma alanına dön", "dashboard.html", "today"),
    createMenuLink("Profilim", "Profilini ve hedeflerini yönet", "account.html", "account"),
    createMenuLink("Ayarlar", "Uygulama tercihlerini düzenle", "settings.html", "settings"),
    createMenuLink("Hubby AI", "Akıllı çalışma asistanını aç", "hubby-ai.html", "hubby-ai"),
  );

  const switchAccount = createMenuLink(
    "Farklı Hesapla Giriş Yap",
    "Başka bir StudyHub hesabını kullan",
    "login.html?switch=1",
    "plus",
  );
  switchAccount.addEventListener("click", () => {
    window.localStorage.removeItem(DASHBOARD_AUTH_KEY);
  });
  const logout = createMenuLink(
    "Çıkış Yap",
    "Bu cihazdaki oturumu kapat",
    "index.html",
    "x",
    "dashboard-account-menu__item--danger",
  );
  logout.addEventListener("click", () => {
    window.localStorage.removeItem(DASHBOARD_AUTH_KEY);
  });
  secondGroup.append(switchAccount, logout);

  const hubbyCard = document.createElement("a");
  const hubbyCardTitle = document.createElement("strong");
  const hubbyCardMessage = document.createElement("span");
  hubbyCard.href = "hubby-ai.html";
  hubbyCard.className = "dashboard-account-menu__hubby";
  hubbyCardTitle.textContent = "✦ Hubby";
  hubbyCardMessage.textContent = summary.hubbyMessage;
  hubbyCard.append(hubbyCardTitle, hubbyCardMessage);

  dropdown.append(profileHeader, stats, firstGroup, hubbyCard, secondGroup);
  wrapper.append(trigger, dropdown);
  dashboardUserMenuHost.replaceChildren(wrapper);

  const menuItems = () =>
    Array.from(dropdown.querySelectorAll('[role="menuitem"]'));
  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (dropdown.hidden) return;
    wrapper.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!wrapper.classList.contains("is-open")) dropdown.hidden = true;
    }, 200);
    if (restoreFocus) trigger.focus();
  };
  const openMenu = () => {
    dropdown.hidden = false;
    window.requestAnimationFrame(() => {
      wrapper.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    });
  };

  trigger.addEventListener("click", () => {
    if (wrapper.classList.contains("is-open")) closeMenu();
    else openMenu();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!wrapper.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && wrapper.classList.contains("is-open")) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }
  });
  dropdown.addEventListener("keydown", (event) => {
    const items = menuItems();
    const index = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items.at(-1)?.focus();
    }
  });
};

initializeDashboardAccountMenu();
applyDashboardPageIdentity();
