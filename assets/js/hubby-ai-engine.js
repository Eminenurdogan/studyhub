(function initializeHubbyEngine(global) {
  "use strict";

  const KEYS = Object.freeze({
    tasks: "studyhub.tasks.v1",
    courses: "studyhub.courses.v1",
    sessions: "studyhub.pomodoro.sessions.v1",
    settings: "studyhub.pomodoro.settings.v1",
    plan: "studyhub.hubby.plan.v1",
  });

  const PRIORITY_SCORE = Object.freeze({ high: 30, medium: 20, low: 10 });
  const DAY_MS = 86_400_000;

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(global.localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const toDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dateKey = (value = new Date()) => {
    const date = value instanceof Date ? value : toDate(value);
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const minutesText = (minutes) => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return hours
      ? `${hours} sa${remainder ? ` ${remainder} dk` : ""}`
      : `${remainder} dk`;
  };

  const getState = () => ({
    tasks: safeArray(readJson(KEYS.tasks, [])),
    courses: safeArray(readJson(KEYS.courses, [])),
    sessions: safeArray(readJson(KEYS.sessions, [])),
    settings: readJson(KEYS.settings, { workMinutes: 25, dailyGoal: 4 }),
    savedPlan: safeArray(readJson(KEYS.plan, [])),
  });

  const courseName = (state, id) =>
    state.courses.find((course) => course.id === id)?.name || "Genel çalışma";

  const activeTasks = (state) =>
    state.tasks.filter((task) => task?.status !== "completed");

  const completedWorkSessions = (state) =>
    state.sessions.filter(
      (session) => session?.status === "completed" && session.type === "work",
    );

  const taskScore = (task, now = new Date()) => {
    const dueDate = toDate(task?.dueDate);
    const urgency = dueDate
      ? Math.max(0, 14 - Math.ceil((dueDate - now) / DAY_MS)) * 3
      : 0;
    return (PRIORITY_SCORE[task?.priority] || 20) + urgency;
  };

  const suggestedMinutes = (task) => {
    const duration =
      Number(task?.duration) || Number(task?.estimatedDuration) || 25;
    if (duration >= 90) return 50;
    if (duration >= 45) return 45;
    return 25;
  };

  const buildDailyPlan = (state) =>
    activeTasks(state)
      .sort((first, second) => taskScore(second) - taskScore(first))
      .slice(0, 4)
      .map((task, index) => ({
        taskId: task.id,
        title: task.title,
        course: courseName(state, task.course),
        minutes: suggestedMinutes(task),
        order: index + 1,
      }));

  const buildWeeklyPlan = (state, now = new Date()) => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return {
        date: dateKey(date),
        label: new Intl.DateTimeFormat("tr-TR", {
          weekday: "long",
        }).format(date),
        shortDate: new Intl.DateTimeFormat("tr-TR", {
          day: "numeric",
          month: "short",
        }).format(date),
        tasks: [],
        totalMinutes: 0,
      };
    });
    const sortedTasks = activeTasks(state).sort((first, second) => {
      const dateDifference = String(first.dueDate || "9999").localeCompare(
        String(second.dueDate || "9999"),
      );
      return dateDifference || taskScore(second) - taskScore(first);
    });

    sortedTasks.forEach((task) => {
      const dueIndex = days.findIndex((day) => day.date === task.dueDate);
      const availableDays =
        dueIndex >= 0 ? days.slice(0, dueIndex + 1) : days;
      const target = [...availableDays].sort(
        (first, second) =>
          first.totalMinutes - second.totalMinutes ||
          first.tasks.length - second.tasks.length,
      )[0];
      if (!target) return;
      const minutes = suggestedMinutes(task);
      target.tasks.push({
        taskId: task.id,
        title: task.title,
        course: courseName(state, task.course),
        priority: task.priority || "medium",
        minutes,
      });
      target.totalMinutes += minutes;
    });

    return days;
  };

  const buildInsights = (state, now = new Date()) => {
    const tasks = activeTasks(state);
    const items = [];
    const overdue = tasks.filter((task) => {
      const dueDate = toDate(task.dueDate);
      return dueDate && dueDate < now;
    });
    if (overdue.length) {
      items.push({
        icon: "⚠️",
        title: `${overdue.length} geciken görevin var`,
        detail: "En yakın teslim tarihli görevi önce tamamlamanı öneriyorum.",
      });
    }
    const upcomingExam = tasks
      .filter((task) => /sınav|exam|vize|final/i.test(task.title || ""))
      .filter((task) => {
        const dueDate = toDate(task.dueDate);
        return dueDate && dueDate >= now && dueDate - now <= 7 * DAY_MS;
      })
      .sort((first, second) =>
        String(first.dueDate).localeCompare(String(second.dueDate)),
      )[0];
    if (upcomingExam) {
      const days = Math.max(
        0,
        Math.ceil((toDate(upcomingExam.dueDate) - now) / DAY_MS),
      );
      items.push({
        icon: "📝",
        title: `${days} gün sonra “${upcomingExam.title}” var`,
        detail: `${courseName(state, upcomingExam.course)} için kısa tekrar blokları planlayabilirsin.`,
      });
    }
    const topTask = [...tasks].sort(
      (first, second) => taskScore(second) - taskScore(first),
    )[0];
    if (topTask) {
      items.push({
        icon: "🎯",
        title: `Bugün ${courseName(state, topTask.course)} alanına öncelik ver`,
        detail: `“${topTask.title}” mevcut görevlerin içinde en yüksek öncelik puanına sahip.`,
      });
    }
    const recentSessions = completedWorkSessions(state).filter((session) => {
      const completedAt = toDate(session.completedAt);
      return completedAt && completedAt >= new Date(now - 2 * DAY_MS);
    });
    if (!recentSessions.length) {
      items.push({
        icon: "🍅",
        title: "Son iki gündür tamamlanmış Pomodoro görünmüyor",
        detail: "Başlamak için kısa bir 25/5 odak oturumu deneyebilirsin.",
      });
    }
    if (!items.length) {
      items.push({
        icon: "✨",
        title: "Çalışma düzenin dengeli görünüyor",
        detail: "Mevcut ritmini koruyup yeni görevlerini zamanında planlayabilirsin.",
      });
    }
    return items.slice(0, 4);
  };

  const buildReport = (state, now = new Date()) => {
    const weekStart = new Date(now - 7 * DAY_MS);
    const sessions = completedWorkSessions(state).filter((session) => {
      const completedAt = toDate(session.completedAt);
      return completedAt && completedAt >= weekStart;
    });
    const minutes = sessions.reduce(
      (total, session) => total + Number(session.durationMinutes || 0),
      0,
    );
    const completedTasks = state.tasks.filter((task) => {
      const completedAt = toDate(task.completedAt || task.updatedAt);
      return task.status === "completed" && completedAt && completedAt >= weekStart;
    });
    const days = new Map();
    sessions.forEach((session) => {
      const completedAt = toDate(session.completedAt);
      const label = new Intl.DateTimeFormat("tr-TR", {
        weekday: "long",
      }).format(completedAt);
      days.set(label, (days.get(label) || 0) + Number(session.durationMinutes || 0));
    });
    const bestDay = [...days].sort((first, second) => second[1] - first[1])[0];
    return [
      ["Toplam çalışma", minutesText(minutes)],
      ["Pomodoro", String(sessions.length)],
      ["Tamamlanan görev", String(completedTasks.length)],
      ["En verimli gün", bestDay?.[0] || "Veri yok"],
    ];
  };

  const parseCsv = async (file) => {
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);
    const delimiter =
      (rows[0]?.match(/;/g) || []).length > (rows[0]?.match(/,/g) || []).length
        ? ";"
        : ",";
    const cells = rows
      .slice(1)
      .map((row) => row.split(delimiter).map((cell) => cell.trim()));
    const courses = new Set(
      cells
        .map((row) => row[0])
        .filter(
          (value) =>
            value &&
            !/ders|konu|başlık|title/i.test(value) &&
            !/\d{1,2}[./-]\d{1,2}/.test(value),
        ),
    );
    const dateCells = cells
      .flat()
      .filter((value) =>
        /\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/.test(value),
      );
    const examRows = cells.filter((row) =>
      row.some((cell) => /sınav|vize|final|exam/i.test(cell)),
    );
    return {
      rowCount: cells.length,
      courses: [...courses].slice(0, 8),
      deadlineCount: dateCells.length,
      examCount: examRows.length,
    };
  };

  const localAnalysisProvider = {
    id: "local",
    async analyzeFile(file, state) {
      const extension = file.name.split(".").pop()?.toLocaleLowerCase("tr-TR");
      const isCsv = extension === "csv";
      const csv = isCsv ? await parseCsv(file) : null;
      const tasks = activeTasks(state);
      const estimatedMinutes = tasks.reduce(
        (total, task) => total + (Number(task.duration) || suggestedMinutes(task)),
        0,
      );
      const weeklyPlan = buildWeeklyPlan(state);
      return {
        provider: "local",
        fileName: file.name,
        extension,
        requiresRemoteExtraction: !isCsv,
        detectedCourses: csv?.courses || [],
        deadlineCount: csv?.deadlineCount || 0,
        examCount: csv?.examCount || 0,
        priorityTasks: [...tasks]
          .sort((first, second) => taskScore(second) - taskScore(first))
          .slice(0, 3)
          .map((task) => task.title),
        estimatedMinutes,
        studyDayCount: weeklyPlan.filter((day) => day.tasks.length).length,
        weeklyPlan,
      };
    },
  };

  const answer = (question, state) => {
    const text = question.toLocaleLowerCase("tr-TR");
    const tasks = activeTasks(state);
    if (text.includes("motivasyon")) {
      return tasks.length
        ? `Önünde ${tasks.length} aktif görev var; hepsini aynı anda düşünmek yerine yalnızca ilk 25 dakikaya odaklan. Küçük ama tamamlanmış bir adım, kusursuz bir plandan daha değerlidir.`
        : "Bugün yeni bir hedef belirlemek için iyi bir gün. Küçük bir görev ekleyip ilk odak oturumunu başlatabilirsin.";
    }
    if (text.includes("hafta")) {
      const plan = buildWeeklyPlan(state);
      const activeDays = plan.filter((day) => day.tasks.length);
      return activeDays.length
        ? `Haftalık planında ${activeDays.length} çalışma günü öneriyorum: ${activeDays.map((day) => `${day.label} ${minutesText(day.totalMinutes)}`).join(", ")}.`
        : "Haftalık plan hazırlamak için önce teslim tarihli aktif görev eklemelisin.";
    }
    if (
      text.includes("bugün") ||
      text.includes("çalış") ||
      text.includes("boş zaman")
    ) {
      const plan = buildDailyPlan(state);
      return plan.length
        ? `Bugün ${plan.map((item) => `${item.course}: ${item.title} (${item.minutes} dk)`).join("; ")} sırasını öneriyorum.`
        : "Aktif görevin olmadığı için veriye dayalı bir plan oluşturamıyorum.";
    }
    if (
      text.includes("öncelik") ||
      text.includes("sınav") ||
      text.includes("sırala")
    ) {
      const task = [...tasks].sort(
        (first, second) => taskScore(second) - taskScore(first),
      )[0];
      return task
        ? `${courseName(state, task.course)} alanındaki “${task.title}” teslim tarihi ve öncelik bilgilerine göre ilk sırada.`
        : "Öncelik hesaplamak için aktif görev eklemelisin.";
    }
    if (text.includes("pomodoro") || text.includes("dakika")) {
      const task = [...tasks].sort(
        (first, second) => taskScore(second) - taskScore(first),
      )[0];
      const minutes = task
        ? suggestedMinutes(task)
        : Number(state.settings.workMinutes) || 25;
      return `${task ? `“${task.title}” için ` : "Başlangıç için "}${minutes}/${minutes === 25 ? 5 : 10} çalışma-mola düzenini öneriyorum.`;
    }
    return "Görev önceliği, günlük veya haftalık plan, Pomodoro süresi ve mevcut çalışma ritmin hakkında veriye dayalı öneriler sunabilirim.";
  };

  global.StudyHubHubbyEngine = Object.freeze({
    KEYS,
    getState,
    buildDailyPlan,
    buildWeeklyPlan,
    buildInsights,
    buildReport,
    localAnalysisProvider,
    answer,
    minutesText,
  });
})(window);
