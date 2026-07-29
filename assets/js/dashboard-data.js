(function initializeDashboardData(global) {
  "use strict";

  const KEYS = Object.freeze({
    profile: "studyhub.profile.v1",
    authentication: "studyhub.auth.v1",
    tasks: "studyhub.tasks.v1",
    courses: "studyhub.courses.v1",
    sessions: "studyhub.pomodoro.sessions.v1",
  });

  const PRIORITY_SCORE = Object.freeze({ high: 3, medium: 2, low: 1 });
  const GENERIC_NAMES = new Set(["", "kullanıcı", "studyhub kullanıcısı"]);

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(global.localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const toArray = (value) => (Array.isArray(value) ? value : []);

  const dateKey = (value = new Date()) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const addDays = (value, amount) => {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + amount);
    return date;
  };

  const isCompletedTask = (task) => task?.status === "completed";

  const taskTime = (task) =>
    String(task?.time || task?.startTime || task?.dueTime || "23:59");

  const comparePlanTasks = (first, second) => {
    const priorityDifference =
      (PRIORITY_SCORE[second.priority] || 0) -
      (PRIORITY_SCORE[first.priority] || 0);
    if (priorityDifference) return priorityDifference;
    const timeDifference = taskTime(first).localeCompare(taskTime(second));
    if (timeDifference) return timeDifference;
    return String(first.dueDate || "").localeCompare(
      String(second.dueDate || ""),
    );
  };

  const compareUpcomingTasks = (first, second) => {
    const dateDifference = String(first.dueDate || "").localeCompare(
      String(second.dueDate || ""),
    );
    return dateDifference || comparePlanTasks(first, second);
  };

  const getProfileName = (profile, authentication) => {
    const profileName = String(profile?.fullName || "").trim();
    const authName = String(authentication?.user?.name || "").trim();
    if (!GENERIC_NAMES.has(profileName.toLocaleLowerCase("tr-TR"))) {
      return profileName;
    }
    if (!GENERIC_NAMES.has(authName.toLocaleLowerCase("tr-TR"))) {
      return authName;
    }
    return "";
  };

  const calculateStreak = (sessions, today) => {
    const sessionDays = new Set(
      sessions
        .map((session) => dateKey(session.dateKey || session.completedAt))
        .filter(Boolean),
    );
    let streak = 0;
    const cursor = new Date(`${today}T12:00:00`);
    if (!sessionDays.has(today)) cursor.setDate(cursor.getDate() - 1);
    while (sessionDays.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  const getMotivation = ({ total, completed, remaining, completionRate }) => {
    if (!total) {
      return {
        title: "Bugün ilk görevini ekleyerek güzel bir başlangıç yapabilirsin.",
        detail: "Küçük bir plan, güne başlamayı kolaylaştırır.",
      };
    }
    if (!remaining) {
      return {
        title: "Bugünkü planını tamamladın.",
        detail: `${completed} görevin tamamlandı. Eline sağlık!`,
      };
    }
    if (completionRate >= 60) {
      return {
        title: "Neredeyse tamamladın, son adımlar kaldı.",
        detail: `${remaining} görev daha tamamlanmayı bekliyor.`,
      };
    }
    return {
      title: "Harika! Planın hazır.",
      detail: `${remaining} görevle bugünkü ilerlemene başlayabilirsin.`,
    };
  };

  const getSnapshot = (now = new Date()) => {
    const profile = readJson(KEYS.profile, {});
    const authentication = readJson(KEYS.authentication, {});
    const tasks = toArray(readJson(KEYS.tasks, []));
    const courses = toArray(readJson(KEYS.courses, []));
    const sessions = toArray(readJson(KEYS.sessions, [])).filter(
      (session) => session?.status === "completed" && session.type === "work",
    );
    const today = dateKey(now);
    const finalUpcomingDay = dateKey(addDays(now, 7));
    const courseNames = new Map(
      courses.map((course) => [course.id, course.name]),
    );
    const todayTasks = tasks
      .filter((task) => task?.dueDate === today)
      .sort(comparePlanTasks);
    const completedTasks = todayTasks.filter(isCompletedTask);
    const activeTasks = todayTasks.filter((task) => !isCompletedTask(task));
    const plannedMinutes = todayTasks.reduce(
      (total, task) => total + Math.max(0, Number(task.duration) || 0),
      0,
    );
    const completionRate = todayTasks.length
      ? Math.round((completedTasks.length / todayTasks.length) * 100)
      : 0;
    const todaySessions = sessions.filter(
      (session) => dateKey(session.dateKey || session.completedAt) === today,
    );
    const upcomingTasks = tasks
      .filter(
        (task) =>
          !isCompletedTask(task) &&
          task?.dueDate > today &&
          task.dueDate <= finalUpcomingDay,
      )
      .sort(compareUpcomingTasks);

    return {
      today,
      profileName: getProfileName(profile, authentication),
      courseNames,
      todayTasks,
      completedTasks,
      activeTasks,
      upcomingTasks,
      plannedMinutes,
      completionRate,
      todaySessionCount: todaySessions.length,
      streak: calculateStreak(sessions, today),
      motivation: getMotivation({
        total: todayTasks.length,
        completed: completedTasks.length,
        remaining: activeTasks.length,
        completionRate,
      }),
    };
  };

  global.StudyHubDashboardData = Object.freeze({
    KEYS,
    dateKey,
    getSnapshot,
  });
})(window);
