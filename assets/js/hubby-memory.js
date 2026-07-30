(function initializeHubbyMemory(global) {
  "use strict";

  const DAY_MS = 86_400_000;
  const daysAgoText = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const days = Math.max(0, Math.floor((Date.now() - date) / DAY_MS));
    if (!days) return "bugün";
    if (days === 1) return "dün";
    return `${days} gün önce`;
  };

  const build = (plans, tasks) => {
    if (!plans.length) {
      return "İlk planını oluşturduğunda çalışma geçmişini burada hatırlayacağım.";
    }
    const latest = plans[0];
    const messages = [
      `Son planını ${daysAgoText(latest.createdAt)} oluşturdun.`,
    ];
    const planCourses = new Map();
    plans.slice(0, 4).forEach((plan) => {
      (plan.days || []).forEach((day) => {
        (day.tasks || []).forEach((task) => {
          const name = task.course || "Genel çalışma";
          planCourses.set(name, (planCourses.get(name) || 0) + 1);
        });
      });
    });
    const mostPlanned = [...planCourses].sort(
      (first, second) => second[1] - first[1],
    )[0];
    if (mostPlanned) {
      messages.push(
        `Son planlarında en sık ${mostPlanned[0]} alanına yer verdin.`,
      );
    }
    const importedTasks = tasks.filter((task) => task.hubbyImportId);
    const completed = importedTasks.filter(
      (task) => task.status === "completed",
    );
    if (completed.length) {
      messages.push(
        `${completed.length} Hubby çalışma görevini tamamlamış görünüyorsun.`,
      );
    }
    return messages.join(" ");
  };

  global.StudyHubHubbyMemory = Object.freeze({ build });
})(window);
