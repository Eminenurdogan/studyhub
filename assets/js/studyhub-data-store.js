(function initializeStudyHubDataStore(global) {
  "use strict";

  const KEYS = Object.freeze({
    tasks: "studyhub.tasks.v1",
    courses: "studyhub.courses.v1",
    sessions: "studyhub.pomodoro.sessions.v1",
    pomodoroSettings: "studyhub.pomodoro.settings.v1",
    hubbyImports: "studyhub.hubby.imports.v1",
  });

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(global.localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    global.localStorage.setItem(key, JSON.stringify(value));
  };

  const getArray = (key) => {
    const value = readJson(key, []);
    return Array.isArray(value) ? value : [];
  };

  const hash = (value) => {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  };

  const normalizePlan = (days) =>
    (Array.isArray(days) ? days : []).map((day) => ({
      date: String(day.date || ""),
      tasks: (Array.isArray(day.tasks) ? day.tasks : []).map((task) => ({
        taskId: String(task.taskId || ""),
        title: String(task.title || "").trim(),
        courseId: String(task.courseId || ""),
        course: String(task.course || ""),
        priority: ["high", "medium", "low"].includes(task.priority)
          ? task.priority
          : "medium",
        minutes: Math.max(1, Math.round(Number(task.minutes) || 25)),
      })),
    }));

  const planIdFor = (days, sourceFile = "") => {
    const signature = normalizePlan(days)
      .flatMap((day) =>
        day.tasks.map(
          (task) =>
            `${day.date}|${task.taskId}|${task.title}|${task.minutes}`,
        ),
      )
      .join(";");
    return `hubby-plan-${hash(`${sourceFile}|${signature}`)}`;
  };

  const pomodoroSegments = (minutes) => {
    const segments = [];
    let remaining = Math.max(1, Math.round(Number(minutes) || 25));
    while (remaining > 0) {
      const segment = Math.min(25, remaining);
      segments.push(segment);
      remaining -= segment;
    }
    return segments;
  };

  const createBlocks = (days, planId, sourceFile) => {
    const normalized = normalizePlan(days);
    const blocks = [];
    normalized.forEach((day) => {
      day.tasks.forEach((task, index) => {
        const blockId = `hubby-${hash(`${planId}|${day.date}|${task.taskId}|${index}`)}`;
        blocks.push({
          id: blockId,
          title: task.title,
          description: "Hubby AI haftalık çalışma planından oluşturuldu.",
          course: task.courseId,
          courseLabel: task.course,
          priority: task.priority,
          dueDate: day.date,
          duration: task.minutes,
          tags: ["Hubby AI", "Çalışma Planı"],
          status: "pending",
          createdAt: new Date().toISOString(),
          hubbyImportId: planId,
          hubbySourceTaskId: task.taskId,
          hubbySourceFile: sourceFile,
          calendarEvent: {
            title: task.title,
            date: day.date,
            estimatedMinutes: task.minutes,
            priority: task.priority,
          },
          pomodoroPlan: {
            totalMinutes: task.minutes,
            segments: pomodoroSegments(task.minutes),
          },
        });
      });
    });
    return blocks;
  };

  const dispatchChange = (detail) => {
    global.dispatchEvent(
      new CustomEvent("studyhub:data-changed", { detail }),
    );
  };

  const importWeeklyPlan = ({
    days,
    sourceFile = "",
    action = "all",
  }) => {
    const planId = planIdFor(days, sourceFile);
    const blocks = createBlocks(days, planId, sourceFile);
    const tasks = getArray(KEYS.tasks);
    const imports = getArray(KEYS.hubbyImports);
    const previousManifest = imports.find((item) => item.id === planId);
    const previousActions = new Set(previousManifest?.actions || []);

    const allBlocksExist = blocks.every((block) =>
      tasks.some(
        (task) =>
          task.id === block.id && task.hubbyImportId === planId,
      ),
    );
    if (
      (previousActions.has(action) || previousActions.has("all")) &&
      allBlocksExist
    ) {
      return {
        planId,
        duplicate: true,
        created: 0,
        updated: 0,
        taskIds: previousManifest.taskIds || [],
      };
    }

    const courses = getArray(KEYS.courses);
    const courseByName = new Map(
      courses.map((course) => [
        String(course.name || "")
          .trim()
          .toLocaleLowerCase("tr-TR"),
        course,
      ]),
    );
    const createdCourseIds = [];
    let coursesChanged = false;
    blocks.forEach((block) => {
      const courseName = String(block.courseLabel || "").trim();
      if (!courseName) return;
      const normalizedName = courseName.toLocaleLowerCase("tr-TR");
      const existingCourse = courseByName.get(normalizedName);
      if (existingCourse) {
        block.course = existingCourse.id;
        return;
      }
      const course = {
        id: block.course || `hubby-course-${hash(normalizedName)}`,
        name: courseName,
        color: "lavender",
        description: "Hubby AI tarafından yüklenen programdan oluşturuldu.",
        createdAt: new Date().toISOString(),
      };
      courses.push(course);
      createdCourseIds.push(course.id);
      courseByName.set(normalizedName, course);
      block.course = course.id;
      coursesChanged = true;
    });

    let created = 0;
    let updated = 0;
    const nextTasks = [...tasks];
    blocks.forEach((block) => {
      const existingIndex = nextTasks.findIndex((task) => task.id === block.id);
      if (existingIndex === -1) {
        nextTasks.push({
          ...block,
          integration: {
            tasks: action === "tasks" || action === "all",
            calendar: action === "calendar" || action === "all",
            pomodoro: action === "pomodoro" || action === "all",
          },
        });
        created += 1;
        return;
      }
      const existing = nextTasks[existingIndex];
      nextTasks[existingIndex] = {
        ...existing,
        integration: {
          tasks:
            existing.integration?.tasks ||
            action === "tasks" ||
            action === "all",
          calendar:
            existing.integration?.calendar ||
            action === "calendar" ||
            action === "all",
          pomodoro:
            existing.integration?.pomodoro ||
            action === "pomodoro" ||
            action === "all",
        },
        calendarEvent:
          action === "calendar" || action === "all"
            ? block.calendarEvent
            : existing.calendarEvent,
        pomodoroPlan:
          action === "pomodoro" || action === "all"
            ? block.pomodoroPlan
            : existing.pomodoroPlan,
        updatedAt: new Date().toISOString(),
      };
      updated += 1;
    });

    const actions = new Set(previousActions);
    actions.add(action);
    if (action === "all") {
      actions.add("tasks");
      actions.add("calendar");
      actions.add("pomodoro");
    }
    const manifest = {
      id: planId,
      sourceFile,
      createdAt: previousManifest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions: [...actions],
      taskIds: blocks.map((block) => block.id),
      courseIds: [
        ...new Set([
          ...(previousManifest?.courseIds || []),
          ...createdCourseIds,
        ]),
      ],
    };
    writeJson(KEYS.tasks, nextTasks);
    if (coursesChanged) writeJson(KEYS.courses, courses);
    writeJson(
      KEYS.hubbyImports,
      [...imports.filter((item) => item.id !== planId), manifest],
    );
    dispatchChange({
      source: "hubby-ai",
      type: "plan-imported",
      planId,
      action,
      taskIds: manifest.taskIds,
    });
    return {
      planId,
      duplicate: false,
      created,
      updated,
      taskIds: manifest.taskIds,
    };
  };

  const undoImport = (planId) => {
    const imports = getArray(KEYS.hubbyImports);
    const manifest = imports.find((item) => item.id === planId);
    if (!manifest) return { removed: 0 };
    const taskIds = new Set(manifest.taskIds || []);
    const tasks = getArray(KEYS.tasks);
    const nextTasks = tasks.filter(
      (task) =>
        !(taskIds.has(task.id) && task.hubbyImportId === manifest.id),
    );
    const removed = tasks.length - nextTasks.length;
    const removableCourseIds = new Set(manifest.courseIds || []);
    const remainingCourseIds = new Set(
      nextTasks.map((task) => task.course).filter(Boolean),
    );
    const courses = getArray(KEYS.courses);
    const nextCourses = courses.filter(
      (course) =>
        !(
          removableCourseIds.has(course.id) &&
          !remainingCourseIds.has(course.id)
        ),
    );
    writeJson(KEYS.tasks, nextTasks);
    if (nextCourses.length !== courses.length) {
      writeJson(KEYS.courses, nextCourses);
    }
    writeJson(
      KEYS.hubbyImports,
      imports.filter((item) => item.id !== planId),
    );
    dispatchChange({
      source: "hubby-ai",
      type: "plan-undone",
      planId,
      taskIds: [...taskIds],
    });
    return { removed };
  };

  global.StudyHubDataStore = Object.freeze({
    KEYS,
    getTasks: () => getArray(KEYS.tasks),
    getImports: () => getArray(KEYS.hubbyImports),
    planIdFor,
    pomodoroSegments,
    importWeeklyPlan,
    undoImport,
  });
})(window);
