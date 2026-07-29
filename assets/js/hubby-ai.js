const hubbyEngine = window.StudyHubHubbyEngine;
const selectHubby = (selector) => document.querySelector(selector);

const hubbyElements = {
  plan: selectHubby("#dailyPlan"),
  insights: selectHubby("#hubbyInsights"),
  report: selectHubby("#weeklyReport"),
  create: selectHubby("#createTodayPlan"),
  transfer: selectHubby("#transferPlan"),
  file: selectHubby("#hubbyFile"),
  fileStatus: selectHubby("#fileStatus"),
  uploadStage: selectHubby("#hubbyUploadStage"),
  analysisStage: selectHubby("#hubbyAnalysisStage"),
  analysisTitle: selectHubby("#hubbyAnalysisTitle"),
  progress: selectHubby("#hubbyAnalysisProgress"),
  results: selectHubby("#hubbyAnalysisResults"),
  generateWeekly: selectHubby("#generateWeeklyPlan"),
  weeklyPreview: selectHubby("#hubbyWeeklyPreview"),
  weeklyDays: selectHubby("#hubbyWeeklyDays"),
  importActions: selectHubby("#hubbyImportActions"),
  dropzone: selectHubby("#hubbyDropzone"),
  changeFile: selectHubby("#changeHubbyFile"),
  form: selectHubby("#hubbyChatForm"),
  prompt: selectHubby("#hubbyPrompt"),
  messages: selectHubby("#hubbyMessages"),
  toast: selectHubby("#hubbyToast"),
};

const hubbyState = {
  data: hubbyEngine?.getState() || {
    tasks: [],
    courses: [],
    sessions: [],
    settings: {},
    savedPlan: [],
  },
  dailyPlan: [],
  weeklyPlan: [],
  analysis: null,
  toastTimer: 0,
  progressTimer: 0,
};

const showHubbyToast = (message) => {
  window.clearTimeout(hubbyState.toastTimer);
  hubbyElements.toast.textContent = message;
  hubbyElements.toast.hidden = false;
  hubbyState.toastTimer = window.setTimeout(() => {
    hubbyElements.toast.hidden = true;
  }, 3200);
};

const renderDailyPlan = () => {
  hubbyElements.plan.replaceChildren();
  if (!hubbyState.dailyPlan.length) {
    const empty = document.createElement("p");
    empty.className = "hubby-empty";
    empty.textContent =
      "Planlanabilecek aktif görev bulunamadı. Önce Görevler modülünden görev oluştur.";
    hubbyElements.plan.append(empty);
    hubbyElements.transfer.disabled = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  hubbyState.dailyPlan.forEach((item) => {
    const article = document.createElement("article");
    const order = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const course = document.createElement("small");
    const duration = document.createElement("b");
    order.textContent = item.order;
    title.textContent = item.title;
    course.textContent = item.course;
    duration.textContent = `${item.minutes}/${item.minutes === 25 ? 5 : 10} dk`;
    content.append(title, course);
    article.append(order, content, duration);
    fragment.append(article);
  });
  hubbyElements.plan.append(fragment);
  hubbyElements.transfer.disabled = false;
};

const renderInsights = () => {
  const insights = hubbyEngine.buildInsights(hubbyState.data);
  hubbyElements.insights.replaceChildren(
    ...insights.map((insight) => {
      const article = document.createElement("article");
      const icon = document.createElement("span");
      const content = document.createElement("div");
      const title = document.createElement("strong");
      const detail = document.createElement("p");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = insight.icon;
      title.textContent = insight.title;
      detail.textContent = insight.detail;
      content.append(title, detail);
      article.append(icon, content);
      return article;
    }),
  );
};

const renderReport = () => {
  const report = hubbyEngine.buildReport(hubbyState.data);
  hubbyElements.report.replaceChildren(
    ...report.map(([label, value]) => {
      const article = document.createElement("article");
      const name = document.createElement("span");
      const result = document.createElement("strong");
      name.textContent = label;
      result.textContent = value;
      article.append(name, result);
      return article;
    }),
  );
};

const createAnalysisResult = (icon, label, value, tone = "") => {
  const article = document.createElement("article");
  const symbol = document.createElement("span");
  const content = document.createElement("div");
  const name = document.createElement("small");
  const result = document.createElement("strong");
  if (tone) article.dataset.tone = tone;
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = icon;
  name.textContent = label;
  result.textContent = value;
  content.append(name, result);
  article.append(symbol, content);
  return article;
};

const renderAnalysis = (analysis) => {
  const courses = analysis.detectedCourses.length
    ? analysis.detectedCourses.join(", ")
    : analysis.requiresRemoteExtraction
      ? "İçerik çıkarımı bekleniyor"
      : "Ders adı bulunamadı";
  const priorities = analysis.priorityTasks.length
    ? analysis.priorityTasks.join(" → ")
    : "Aktif görev bulunmuyor";
  const status = analysis.requiresRemoteExtraction
    ? createAnalysisResult(
        "🔒",
        "Güvenli içerik analizi",
        "AI sağlayıcısı bağlandığında etkinleşecek",
        "notice",
      )
    : createAnalysisResult(
        "✓",
        "Yerel analiz",
        "CSV içeriği cihazında işlendi",
        "success",
      );

  hubbyElements.results.replaceChildren(
    createAnalysisResult("📚", "Algılanan dersler", courses),
    createAnalysisResult(
      "📅",
      "Teslim tarihleri",
      `${analysis.deadlineCount} tarih algılandı`,
    ),
    createAnalysisResult(
      "📝",
      "Sınav tarihleri",
      `${analysis.examCount} sınav satırı algılandı`,
    ),
    createAnalysisResult("🎯", "StudyHub öncelik sırası", priorities),
    createAnalysisResult(
      "⏱️",
      "Mevcut görevlerin tahmini süresi",
      hubbyEngine.minutesText(analysis.estimatedMinutes),
    ),
    createAnalysisResult(
      "🗓️",
      "Önerilen çalışma günleri",
      `${analysis.studyDayCount} gün önerildi`,
    ),
    status,
  );
  hubbyElements.results.hidden = false;
  hubbyElements.generateWeekly.hidden = false;
};

const renderWeeklyPreview = () => {
  hubbyState.weeklyPlan =
    hubbyState.analysis?.weeklyPlan ||
    hubbyEngine.buildWeeklyPlan(hubbyState.data);
  const fragment = document.createDocumentFragment();

  hubbyState.weeklyPlan.forEach((day) => {
    const article = document.createElement("article");
    const header = document.createElement("div");
    const label = document.createElement("strong");
    const date = document.createElement("span");
    const list = document.createElement("ul");
    const total = document.createElement("small");
    label.textContent = day.label;
    date.textContent = day.shortDate;
    header.append(label, date);
    if (!day.tasks.length) {
      const item = document.createElement("li");
      item.className = "is-rest";
      item.textContent = "Dinlenme veya tekrar günü";
      list.append(item);
    } else {
      day.tasks.slice(0, 3).forEach((task) => {
        const item = document.createElement("li");
        const taskName = document.createElement("span");
        const duration = document.createElement("b");
        taskName.textContent = task.title;
        duration.textContent = `${task.minutes} dk`;
        item.append(taskName, duration);
        list.append(item);
      });
    }
    total.textContent = day.totalMinutes
      ? `Toplam ${hubbyEngine.minutesText(day.totalMinutes)}`
      : "Boş zaman";
    article.append(header, list, total);
    fragment.append(article);
  });

  hubbyElements.weeklyDays.replaceChildren(fragment);
  hubbyElements.weeklyPreview.hidden = false;
  hubbyElements.importActions.hidden = false;
  hubbyElements.weeklyPreview.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
  showHubbyToast("Haftalık çalışma planı önizlemesi hazır.");
};

const resetFileStage = () => {
  window.clearInterval(hubbyState.progressTimer);
  hubbyState.analysis = null;
  hubbyState.weeklyPlan = [];
  hubbyElements.file.value = "";
  hubbyElements.uploadStage.hidden = false;
  hubbyElements.analysisStage.hidden = true;
  hubbyElements.results.hidden = true;
  hubbyElements.generateWeekly.hidden = true;
  hubbyElements.weeklyPreview.hidden = true;
  hubbyElements.importActions.hidden = true;
  hubbyElements.results.replaceChildren();
  hubbyElements.weeklyDays.replaceChildren();
  hubbyElements.progress.style.setProperty("--analysis-progress", "0%");
  hubbyElements.progress.setAttribute("aria-valuenow", "0");
};

const finishFileAnalysis = async (file) => {
  try {
    hubbyState.analysis =
      await hubbyEngine.localAnalysisProvider.analyzeFile(
        file,
        hubbyState.data,
      );
    hubbyElements.analysisTitle.textContent =
      hubbyState.analysis.requiresRemoteExtraction
        ? "Dosyan Planlama İçin Hazır"
        : "Hubby Dosyanı Analiz Etti";
    renderAnalysis(hubbyState.analysis);
  } catch {
    hubbyElements.analysisTitle.textContent = "Dosya okunamadı";
    hubbyElements.results.replaceChildren(
      createAnalysisResult(
        "⚠️",
        "Analiz hatası",
        "Dosya içeriğini ve kodlamasını kontrol edip tekrar dene.",
        "notice",
      ),
    );
    hubbyElements.results.hidden = false;
  }
};

const processFile = (file) => {
  if (!file) return;
  const allowed = /\.(pdf|docx?|xlsx?|csv|png|jpe?g)$/i.test(file.name);
  if (!allowed || file.size > 10 * 1024 * 1024) {
    showHubbyToast(
      "PDF, Word, Excel, CSV, PNG veya JPG biçiminde, 10 MB'dan küçük bir dosya seç.",
    );
    resetFileStage();
    return;
  }

  window.clearInterval(hubbyState.progressTimer);
  hubbyElements.uploadStage.hidden = true;
  hubbyElements.analysisStage.hidden = false;
  hubbyElements.results.hidden = true;
  hubbyElements.generateWeekly.hidden = true;
  hubbyElements.weeklyPreview.hidden = true;
  hubbyElements.importActions.hidden = true;
  hubbyElements.analysisTitle.textContent = "Hubby Dosyanı Analiz Ediyor...";
  hubbyElements.fileStatus.textContent =
    `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  let value = 0;
  hubbyState.progressTimer = window.setInterval(() => {
    value = Math.min(100, value + 10);
    hubbyElements.progress.style.setProperty(
      "--analysis-progress",
      `${value}%`,
    );
    hubbyElements.progress.setAttribute("aria-valuenow", String(value));
    if (value === 100) {
      window.clearInterval(hubbyState.progressTimer);
      finishFileAnalysis(file);
    }
  }, 90);
};

const addMessage = (text, type) => {
  const message = document.createElement("div");
  message.className = `hubby-message hubby-message--${type}`;
  message.textContent = text;
  hubbyElements.messages.append(message);
  hubbyElements.messages.scrollTop = hubbyElements.messages.scrollHeight;
};

const askHubby = (question) => {
  const prompt = String(question || "").trim();
  if (!prompt) return;
  addMessage(prompt, "user");
  hubbyElements.prompt.value = "";
  window.setTimeout(() => {
    addMessage(hubbyEngine.answer(prompt, hubbyState.data), "assistant");
  }, 180);
};

const loadHubby = () => {
  hubbyState.data = hubbyEngine.getState();
  hubbyState.dailyPlan = hubbyState.data.savedPlan;
  renderDailyPlan();
  renderInsights();
  renderReport();
};

hubbyElements.create.addEventListener("click", () => {
  hubbyState.dailyPlan = hubbyEngine.buildDailyPlan(hubbyState.data);
  renderDailyPlan();
  showHubbyToast(
    hubbyState.dailyPlan.length
      ? "Bugünkü planın gerçek görevlerine göre hazırlandı."
      : "Plan için aktif görev bulunamadı.",
  );
});

hubbyElements.transfer.addEventListener("click", () => {
  const plannedAt = new Date().toISOString();
  const planByTask = new Map(
    hubbyState.dailyPlan.map((item) => [item.taskId, item]),
  );
  const tasks = hubbyState.data.tasks.map((task) => {
    const planItem = planByTask.get(task.id);
    return planItem
      ? {
          ...task,
          hubbyPlanOrder: planItem.order,
          suggestedPomodoroMinutes: planItem.minutes,
          hubbyPlannedAt: plannedAt,
          updatedAt: plannedAt,
        }
      : task;
  });
  window.localStorage.setItem(
    hubbyEngine.KEYS.tasks,
    JSON.stringify(tasks),
  );
  window.localStorage.setItem(
    hubbyEngine.KEYS.plan,
    JSON.stringify(hubbyState.dailyPlan),
  );
  hubbyState.data.tasks = tasks;
  showHubbyToast("Günlük plan Görevler ve Pomodoro akışına hazırlandı.");
});

hubbyElements.file.addEventListener("change", () => {
  processFile(hubbyElements.file.files[0]);
});
hubbyElements.changeFile.addEventListener("click", resetFileStage);
hubbyElements.generateWeekly.addEventListener("click", renderWeeklyPreview);

["dragenter", "dragover"].forEach((type) => {
  hubbyElements.dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    hubbyElements.dropzone.classList.add("is-dragging");
  });
});
["dragleave", "drop"].forEach((type) => {
  hubbyElements.dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    hubbyElements.dropzone.classList.remove("is-dragging");
  });
});
hubbyElements.dropzone.addEventListener("drop", (event) => {
  processFile(event.dataTransfer.files[0]);
});
hubbyElements.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    hubbyElements.file.click();
  }
});

document.querySelectorAll("[data-import-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!hubbyState.weeklyPlan.length) return;
    window.localStorage.setItem(
      "studyhub.hubby.weekly-plan.v1",
      JSON.stringify({
        createdAt: new Date().toISOString(),
        sourceFile: hubbyState.analysis?.fileName || "",
        days: hubbyState.weeklyPlan,
      }),
    );
    showHubbyToast(
      "Plan taslağı kaydedildi. Modül aktarımı alan eşleştirme onayıyla etkinleşecek.",
    );
  });
});

document.querySelectorAll(".hubby-suggestions button").forEach((button) => {
  button.addEventListener("click", () => {
    askHubby(button.dataset.prompt || button.textContent);
  });
});

hubbyElements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  askHubby(hubbyElements.prompt.value);
});

window.addEventListener("storage", loadHubby);
loadHubby();
