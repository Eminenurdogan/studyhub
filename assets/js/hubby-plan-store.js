(function initializeHubbyPlanStore(global) {
  "use strict";

  const KEYS = Object.freeze({
    plans: "studyhub.ai.plans.v1",
    currentPlan: "studyhub.ai.currentPlan.v1",
    tasks: "studyhub.tasks.v1",
  });

  const read = (key, fallback) => {
    try {
      return JSON.parse(global.localStorage.getItem(key) ?? "null") ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) =>
    global.localStorage.setItem(key, JSON.stringify(value));
  const plans = () => {
    const value = read(KEYS.plans, []);
    return Array.isArray(value) ? value : [];
  };
  const createId = () =>
    global.crypto?.randomUUID?.() ||
    `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const signature = (days, sourceFileId = "") =>
    `${sourceFileId}|${(days || [])
      .flatMap((day) =>
        (day.tasks || []).map(
          (task) => `${day.date}|${task.title}|${task.minutes}`,
        ),
      )
      .join(";")}`;
  const summary = (days) => {
    const tasks = (days || []).flatMap((day) => day.tasks || []);
    return {
      courseCount: new Set(
        tasks.map((task) => task.courseId || task.course).filter(Boolean),
      ).size,
      taskCount: tasks.length,
      totalMinutes: tasks.reduce(
        (total, task) => total + Number(task.minutes || 0),
        0,
      ),
    };
  };
  const dispatch = (type, detail = {}) =>
    global.dispatchEvent(
      new CustomEvent("hubby:history-changed", {
        detail: { type, ...detail },
      }),
    );

  const savePlan = (snapshot, { forceNew = false } = {}) => {
    const all = plans();
    const planSignature = signature(
      snapshot.days,
      snapshot.sourceFileId || "",
    );
    if (!forceNew) {
      const existing = all.find((plan) => plan.signature === planSignature);
      if (existing) {
        write(KEYS.currentPlan, existing.id);
        return existing;
      }
    }
    const createdAt = new Date().toISOString();
    const record = {
      id: createId(),
      name: snapshot.name || "Haftalık Çalışma Planı",
      createdAt,
      updatedAt: createdAt,
      status: "draft",
      signature: planSignature,
      sourceFileId: snapshot.sourceFileId || "",
      sourceFileName: snapshot.sourceFileName || "",
      analysis: snapshot.analysis || null,
      days: snapshot.days || [],
      insights: snapshot.insights || [],
      aiSummary: snapshot.aiSummary || "",
      summary: summary(snapshot.days),
      importPlanId: "",
      transferActions: [],
    };
    write(KEYS.plans, [record, ...all]);
    write(KEYS.currentPlan, record.id);
    dispatch("created", { planId: record.id });
    return record;
  };

  const updatePlan = (id, changes) => {
    let updated = null;
    const next = plans().map((plan) => {
      if (plan.id !== id) return plan;
      updated = {
        ...plan,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    if (!updated) return null;
    write(KEYS.plans, next);
    dispatch("updated", { planId: id });
    return updated;
  };

  const syncStatuses = () => {
    const tasksValue = read(KEYS.tasks, []);
    const tasks = Array.isArray(tasksValue) ? tasksValue : [];
    let changed = false;
    const next = plans().map((plan) => {
      if (!plan.importPlanId || !["imported", "completed"].includes(plan.status)) {
        return plan;
      }
      const importedTasks = tasks.filter(
        (task) => task.hubbyImportId === plan.importPlanId,
      );
      const completed =
        importedTasks.length > 0 &&
        importedTasks.every((task) => task.status === "completed");
      const status = completed ? "completed" : "imported";
      if (status === plan.status) return plan;
      changed = true;
      return { ...plan, status, updatedAt: new Date().toISOString() };
    });
    if (changed) write(KEYS.plans, next);
    return next;
  };

  const getAll = () =>
    syncStatuses().sort(
      (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
    );
  const getById = (id) => getAll().find((plan) => plan.id === id) || null;
  const getCurrent = () => {
    const all = getAll();
    const currentId = read(KEYS.currentPlan, "");
    const selected = all.find((plan) => plan.id === currentId);
    if (selected && !["completed", "archived"].includes(selected.status)) {
      return selected;
    }
    return (
      all.find((plan) => !["completed", "archived"].includes(plan.status)) ||
      null
    );
  };
  const setCurrent = (id) => {
    if (!getById(id)) return null;
    write(KEYS.currentPlan, id);
    dispatch("selected", { planId: id });
    return getById(id);
  };
  const markImported = (id, result, action) => {
    const plan = getById(id);
    if (!plan) return null;
    return updatePlan(id, {
      status: "imported",
      importPlanId: result.planId,
      transferActions: [
        ...new Set([...(plan.transferActions || []), action]),
      ],
    });
  };
  const archive = (id) => updatePlan(id, { status: "archived" });
  const remove = (id) => {
    const all = plans();
    const next = all.filter((plan) => plan.id !== id);
    if (next.length === all.length) return false;
    write(KEYS.plans, next);
    if (read(KEYS.currentPlan, "") === id) {
      write(KEYS.currentPlan, "");
    }
    dispatch("deleted", { planId: id });
    return true;
  };

  global.StudyHubHubbyPlanStore = Object.freeze({
    KEYS,
    getAll,
    getById,
    getCurrent,
    savePlan,
    updatePlan,
    setCurrent,
    markImported,
    archive,
    remove,
    syncStatuses,
  });
})(window);
