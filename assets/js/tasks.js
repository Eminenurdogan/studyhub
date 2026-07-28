const TASK_STORAGE_KEY = "studyhub.tasks.v1";
const courseStore = window.StudyHubCourseStore;

const STATUS_LABELS = {
  pending: "Bekleyen",
  "in-progress": "Devam Ediyor",
  completed: "Tamamlandı",
};

const PRIORITY_LABELS = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

const elements = {
  page: document.querySelector(".dashboard-page"),
  drawer: document.querySelector("#taskCreatePanel"),
  drawerTitle: document.querySelector("#taskCreatePanelTitle"),
  drawerOpenButton: document.querySelector("#openTaskDrawer"),
  drawerBackdrop: document.querySelector(".task-drawer-backdrop"),
  drawerCloseButtons: document.querySelectorAll("[data-task-drawer-close]"),
  form: document.querySelector("#taskCreateForm"),
  saveButton: document.querySelector("#taskSaveButton"),
  list: document.querySelector("#taskList"),
  emptyState: document.querySelector("#taskEmptyState"),
  filterEmptyState: document.querySelector("#taskFilterEmptyState"),
  count: document.querySelector("#taskCount"),
  pageFeedback: document.querySelector("#taskPageFeedback"),
  formFeedback: document.querySelector("#taskFormFeedback"),
  toast: document.querySelector("#taskToast"),
  search: document.querySelector("#taskSearch"),
  courseFilter: document.querySelector("#courseFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  statusTabs: document.querySelectorAll("[data-task-status]"),
  statusCounts: document.querySelectorAll("[data-task-status-count]"),
  title: document.querySelector("#taskTitle"),
  description: document.querySelector("#taskDescription"),
  course: document.querySelector("#taskCourse"),
  priority: document.querySelector("#taskPriority"),
  dueDate: document.querySelector("#taskDueDate"),
  duration: document.querySelector("#taskDuration"),
  tags: document.querySelector("#taskTags"),
  titleError: document.querySelector("#taskTitleError"),
  courseError: document.querySelector("#taskCourseError"),
  dueDateError: document.querySelector("#taskDueDateError"),
};

const state = {
  tasks: [],
  courses: [],
  editingTaskId: null,
  activeStatus: "",
  drawerPreviouslyFocusedElement: null,
  toastTimer: null,
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");

const createId = (prefix) =>
  window.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readStorageArray = (key, fallback = []) => {
  try {
    const storedValue = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return Array.isArray(storedValue) ? storedValue : fallback;
  } catch (error) {
    console.error(`${key} verisi yüklenemedi.`, error);
    return fallback;
  }
};

const writeStorageArray = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`${key} verisi kaydedilemedi.`, error);
    return false;
  }
};

const loadTasks = () =>
  readStorageArray(TASK_STORAGE_KEY).filter(
    (task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.course === "string" &&
      typeof task.dueDate === "string",
  ).map((task) => ({
    ...task,
    description: typeof task.description === "string" ? task.description : "",
    priority: PRIORITY_LABELS[task.priority] ? task.priority : "medium",
    duration: Number.isFinite(Number(task.duration)) ? Number(task.duration) : null,
    tags: Array.isArray(task.tags) ? task.tags : [],
    status: STATUS_LABELS[task.status] ? task.status : "pending",
  }));

const announce = (message) => {
  if (elements.pageFeedback) {
    elements.pageFeedback.textContent = "";
    window.requestAnimationFrame(() => {
      elements.pageFeedback.textContent = message;
    });
  }
};

const showToast = (message) => {
  if (!elements.toast) {
    return;
  }

  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  elements.toast.classList.add("is-visible");

  state.toastTimer = window.setTimeout(() => {
    elements.toast?.classList.remove("is-visible");
    elements.toast.hidden = true;
  }, 3200);
};

const showFormFeedback = (message) => {
  if (elements.formFeedback) {
    elements.formFeedback.textContent = message;
    elements.formFeedback.hidden = false;
  }
};

const clearFieldError = (input, errorElement) => {
  input?.removeAttribute("aria-invalid");
  input?.closest(".task-form-field")?.classList.remove("has-error");

  if (errorElement) {
    errorElement.textContent = "";
  }
};

const setFieldError = (input, errorElement, message) => {
  input?.setAttribute("aria-invalid", "true");
  input?.closest(".task-form-field")?.classList.add("has-error");

  if (errorElement) {
    errorElement.textContent = message;
  }
};

const clearFormErrors = () => {
  clearFieldError(elements.title, elements.titleError);
  clearFieldError(elements.course, elements.courseError);
  clearFieldError(elements.dueDate, elements.dueDateError);

  if (elements.formFeedback) {
    elements.formFeedback.textContent = "";
    elements.formFeedback.hidden = true;
  }
};

const resetTaskForm = () => {
  elements.form?.reset();
  state.editingTaskId = null;
  clearFormErrors();

  if (elements.drawerTitle) {
    elements.drawerTitle.textContent = "Yeni Görev";
  }
  if (elements.saveButton) {
    elements.saveButton.textContent = "Kaydet";
  }
};

const getDrawerFocusableElements = () => {
  if (!elements.drawer) {
    return [];
  }

  return Array.from(
    elements.drawer.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  );
};

const isDrawerOpen = () =>
  elements.drawer?.classList.contains("is-open") ?? false;

const openDrawer = () => {
  if (
    !elements.drawer ||
    !elements.drawerOpenButton ||
    !elements.drawerBackdrop ||
    !elements.page
  ) {
    return;
  }

  state.drawerPreviouslyFocusedElement = document.activeElement;
  elements.drawer.classList.add("is-open");
  elements.drawerBackdrop.classList.add("is-visible");
  elements.page.classList.add("task-drawer-open");
  elements.drawer.setAttribute("aria-hidden", "false");
  elements.drawerOpenButton.setAttribute("aria-expanded", "true");

  window.requestAnimationFrame(() => elements.title?.focus());
};

const closeDrawer = ({ reset = true } = {}) => {
  if (
    !elements.drawer ||
    !elements.drawerOpenButton ||
    !elements.drawerBackdrop ||
    !elements.page
  ) {
    return;
  }

  elements.drawer.classList.remove("is-open");
  elements.drawerBackdrop.classList.remove("is-visible");
  elements.page.classList.remove("task-drawer-open");
  elements.drawer.setAttribute("aria-hidden", "true");
  elements.drawerOpenButton.setAttribute("aria-expanded", "false");

  if (reset) {
    resetTaskForm();
  }

  if (
    state.drawerPreviouslyFocusedElement instanceof HTMLElement &&
    document.contains(state.drawerPreviouslyFocusedElement)
  ) {
    state.drawerPreviouslyFocusedElement.focus();
  }

  state.drawerPreviouslyFocusedElement = null;
};

const openCreateDrawer = () => {
  resetTaskForm();
  openDrawer();
};

const handleDrawerKeydown = (event) => {
  if (!isDrawerOpen()) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeDrawer();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getDrawerFocusableElements();
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (!firstElement || !lastElement) {
    event.preventDefault();
  } else if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

const appendOption = (select, value, label) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
};

const renderCourseOptions = () => {
  const selectedCourse = elements.course?.value ?? "";
  const selectedFilter = elements.courseFilter?.value ?? "";

  elements.course?.replaceChildren();
  elements.courseFilter?.replaceChildren();

  if (elements.course) {
    appendOption(elements.course, "", "Ders seçin");
  }
  if (elements.courseFilter) {
    appendOption(elements.courseFilter, "", "Tüm dersler");
  }

  state.courses.forEach((course) => {
    if (elements.course) {
      appendOption(elements.course, course.id, course.name);
    }
    if (elements.courseFilter) {
      appendOption(elements.courseFilter, course.id, course.name);
    }
  });

  if (elements.course?.querySelector(`option[value="${CSS.escape(selectedCourse)}"]`)) {
    elements.course.value = selectedCourse;
  }
  if (
    elements.courseFilter?.querySelector(
      `option[value="${CSS.escape(selectedFilter)}"]`,
    )
  ) {
    elements.courseFilter.value = selectedFilter;
  }
};

const getCourseName = (courseId) =>
  state.courses.find((course) => course.id === courseId)?.name ?? "Silinmiş ders";

const formatDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const createButton = (label, action, taskId, className) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.taskAction = action;
  button.dataset.taskId = taskId;
  button.textContent = label;
  return button;
};

const appendMetaItem = (list, label, value) => {
  const item = document.createElement("li");
  const itemLabel = document.createElement("span");
  const itemValue = document.createElement("strong");
  itemLabel.textContent = label;
  itemValue.textContent = value;
  item.append(itemLabel, itemValue);
  list.append(item);
};

const createTaskElement = (task) => {
  const article = document.createElement("article");
  const header = document.createElement("div");
  const titleGroup = document.createElement("div");
  const title = document.createElement("h4");
  const priority = document.createElement("span");
  const statusLabel = document.createElement("label");
  const statusSelect = document.createElement("select");
  const description = document.createElement("p");
  const metaList = document.createElement("ul");
  const tagList = document.createElement("ul");
  const actions = document.createElement("div");

  article.className = "task-item";
  article.dataset.taskId = task.id;
  header.className = "task-item__header";
  titleGroup.className = "task-item__title-group";
  title.className = "task-item__title";
  title.textContent = task.title;

  priority.className = `task-item__priority task-item__priority--${task.priority}`;
  priority.textContent = PRIORITY_LABELS[task.priority];
  titleGroup.append(title, priority);

  statusLabel.className = "task-item__status-control";
  statusLabel.textContent = "Durum";
  statusSelect.className = `task-item__status task-item__status--${task.status}`;
  statusSelect.dataset.taskAction = "status";
  statusSelect.dataset.taskId = task.id;
  statusSelect.setAttribute("aria-label", `${task.title} görev durumunu değiştir`);

  Object.entries(STATUS_LABELS).forEach(([value, label]) => {
    appendOption(statusSelect, value, label);
  });
  statusSelect.value = task.status;
  statusLabel.append(statusSelect);

  header.append(titleGroup, statusLabel);
  article.append(header);

  description.className = "task-item__description";
  description.textContent = task.description || "Açıklama eklenmedi.";
  article.append(description);

  metaList.className = "task-item__meta";
  appendMetaItem(metaList, "Ders", getCourseName(task.course));
  appendMetaItem(metaList, "Son teslim", formatDate(task.dueDate));
  appendMetaItem(
    metaList,
    "Tahmini süre",
    task.duration ? `${task.duration} dakika` : "Belirtilmedi",
  );
  article.append(metaList);

  tagList.className = "task-item__tags";
  tagList.setAttribute("aria-label", "Görev etiketleri");
  const visibleTags = task.tags.length > 0 ? task.tags : ["Etiket yok"];
  visibleTags.forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    tagList.append(item);
  });
  article.append(tagList);

  actions.className = "task-item__actions";
  actions.append(
    createButton("Düzenle", "edit", task.id, "task-item__edit"),
    createButton("Sil", "delete", task.id, "task-item__delete"),
  );
  article.append(actions);

  return article;
};

const getFilteredTasks = () => {
  const searchValue = normalizeText(elements.search?.value);
  const courseValue = elements.courseFilter?.value ?? "";
  const priorityValue = elements.priorityFilter?.value ?? "";

  return state.tasks.filter((task) => {
    const searchableText = normalizeText(
      [task.title, task.description, getCourseName(task.course), ...task.tags].join(
        " ",
      ),
    );

    return (
      (!searchValue || searchableText.includes(searchValue)) &&
      (!courseValue || task.course === courseValue) &&
      (!priorityValue || task.priority === priorityValue) &&
      (!state.activeStatus || task.status === state.activeStatus)
    );
  });
};

const renderCounters = (visibleCount) => {
  if (elements.count) {
    elements.count.textContent =
      visibleCount === state.tasks.length
        ? `${state.tasks.length} görev`
        : `${visibleCount} / ${state.tasks.length} görev`;
  }

  const counts = state.tasks.reduce(
    (result, task) => {
      result.all += 1;
      result[task.status] += 1;
      return result;
    },
    { all: 0, pending: 0, "in-progress": 0, completed: 0 },
  );

  elements.statusCounts.forEach((counter) => {
    counter.textContent = counts[counter.dataset.taskStatusCount] ?? 0;
  });
};

const renderTasks = () => {
  if (
    !elements.list ||
    !elements.emptyState ||
    !elements.filterEmptyState
  ) {
    return;
  }

  const filteredTasks = getFilteredTasks();
  elements.list.replaceChildren();
  renderCounters(filteredTasks.length);

  const hasTasks = state.tasks.length > 0;
  const hasFilteredTasks = filteredTasks.length > 0;

  elements.emptyState.hidden = hasTasks;
  elements.filterEmptyState.hidden = !hasTasks || hasFilteredTasks;
  elements.list.hidden = !hasFilteredTasks;

  if (!hasFilteredTasks) {
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredTasks.forEach((task) => fragment.append(createTaskElement(task)));
  elements.list.append(fragment);
};

const validateTaskForm = () => {
  clearFormErrors();
  const invalidFields = [];

  if (!elements.title?.value.trim()) {
    setFieldError(
      elements.title,
      elements.titleError,
      "Görev adı alanı zorunludur.",
    );
    invalidFields.push(elements.title);
  }

  if (!elements.course?.value) {
    setFieldError(
      elements.course,
      elements.courseError,
      "Lütfen bir ders seç.",
    );
    invalidFields.push(elements.course);
  }

  if (!elements.dueDate?.value) {
    setFieldError(
      elements.dueDate,
      elements.dueDateError,
      "Son teslim tarihi alanı zorunludur.",
    );
    invalidFields.push(elements.dueDate);
  }

  if (invalidFields.length > 0) {
    showFormFeedback("Lütfen işaretlenen zorunlu alanları tamamla.");
    invalidFields[0]?.focus();
    return false;
  }

  return true;
};

const getTaskFormValues = () => {
  const durationValue = Number.parseInt(elements.duration?.value ?? "", 10);
  const tags = Array.from(
    new Set(
      (elements.tags?.value ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

  return {
    title: elements.title?.value.trim() ?? "",
    description: elements.description?.value.trim() ?? "",
    course: elements.course?.value ?? "",
    priority: elements.priority?.value ?? "medium",
    dueDate: elements.dueDate?.value ?? "",
    duration:
      Number.isFinite(durationValue) && durationValue > 0 ? durationValue : null,
    tags,
  };
};

const handleTaskFormSubmit = (event) => {
  event.preventDefault();

  if (!validateTaskForm()) {
    return;
  }

  const values = getTaskFormValues();
  const editingTask = state.tasks.find(
    (task) => task.id === state.editingTaskId,
  );
  let nextTasks;
  let message;

  if (editingTask) {
    const updatedTask = {
      ...editingTask,
      ...values,
      updatedAt: new Date().toISOString(),
    };
    nextTasks = state.tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    );
    message = `${updatedTask.title} görevi güncellendi.`;
  } else {
    const newTask = {
      id: createId("task"),
      ...values,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    nextTasks = [newTask, ...state.tasks];
    message = `${newTask.title} görevi oluşturuldu.`;
  }

  if (!writeStorageArray(TASK_STORAGE_KEY, nextTasks)) {
    showFormFeedback(
      "Görev kaydedilemedi. Tarayıcı depolama iznini kontrol edip tekrar dene.",
    );
    return;
  }

  state.tasks = nextTasks;
  renderTasks();
  closeDrawer();
  showToast(message);
  announce(message);
};

const openEditDrawer = (taskId) => {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  resetTaskForm();
  state.editingTaskId = task.id;
  elements.title.value = task.title;
  elements.description.value = task.description;
  elements.course.value = task.course;
  elements.priority.value = task.priority;
  elements.dueDate.value = task.dueDate;
  elements.duration.value = task.duration ?? "";
  elements.tags.value = task.tags.join(", ");

  if (elements.drawerTitle) {
    elements.drawerTitle.textContent = "Görevi Düzenle";
  }
  if (elements.saveButton) {
    elements.saveButton.textContent = "Değişiklikleri Kaydet";
  }

  openDrawer();
};

const deleteTask = async (taskId) => {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task || !window.StudyHubConfirmationDialog) {
    return;
  }

  const isConfirmed = await window.StudyHubConfirmationDialog.open({
    title: "Görevi sil",
    description:
      "Bu görevi silmek istediğine emin misin? Bu işlem geri alınamaz.",
    cancelLabel: "İptal",
    confirmLabel: "Sil",
  });

  if (!isConfirmed) {
    return;
  }

  const nextTasks = state.tasks.filter((item) => item.id !== taskId);

  if (!writeStorageArray(TASK_STORAGE_KEY, nextTasks)) {
    showToast("Görev silinemedi. Lütfen tekrar dene.");
    return;
  }

  state.tasks = nextTasks;
  renderTasks();
  showToast(`${task.title} görevi silindi.`);
  announce(`${task.title} görevi silindi.`);
};

const updateTaskStatus = (taskId, status) => {
  if (!STATUS_LABELS[status]) {
    return;
  }

  const task = state.tasks.find((item) => item.id === taskId);

  if (!task || task.status === status) {
    return;
  }

  const nextTasks = state.tasks.map((item) =>
    item.id === taskId
      ? { ...item, status, updatedAt: new Date().toISOString() }
      : item,
  );

  if (!writeStorageArray(TASK_STORAGE_KEY, nextTasks)) {
    showToast("Görev durumu güncellenemedi.");
    renderTasks();
    return;
  }

  state.tasks = nextTasks;
  renderTasks();
  const message = `${task.title} durumu ${STATUS_LABELS[status]} olarak güncellendi.`;
  showToast(message);
  announce(message);
};

const handleTaskListClick = (event) => {
  const actionButton = event.target.closest("[data-task-action]");

  if (!actionButton || actionButton.dataset.taskAction === "status") {
    return;
  }

  if (actionButton.dataset.taskAction === "edit") {
    openEditDrawer(actionButton.dataset.taskId);
  } else if (actionButton.dataset.taskAction === "delete") {
    deleteTask(actionButton.dataset.taskId);
  }
};

const handleTaskListChange = (event) => {
  const statusSelect = event.target.closest('[data-task-action="status"]');

  if (statusSelect) {
    updateTaskStatus(statusSelect.dataset.taskId, statusSelect.value);
  }
};

const handleStatusTabClick = (event) => {
  const selectedTab = event.currentTarget;
  state.activeStatus = selectedTab.dataset.taskStatus ?? "";

  elements.statusTabs.forEach((tab) => {
    const isActive = tab === selectedTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  renderTasks();
};

const initializeTaskManagement = () => {
  if (!elements.form || !elements.list) {
    return;
  }

  state.courses = courseStore?.getAll() ?? [];
  state.tasks = loadTasks();
  renderCourseOptions();
  renderTasks();

  elements.drawerOpenButton?.addEventListener("click", openCreateDrawer);
  elements.drawerBackdrop?.addEventListener("click", () => closeDrawer());
  elements.drawerCloseButtons.forEach((button) => {
    button.addEventListener("click", () => closeDrawer());
  });
  document.addEventListener("keydown", handleDrawerKeydown);
  elements.form.addEventListener("submit", handleTaskFormSubmit);
  elements.list.addEventListener("click", handleTaskListClick);
  elements.list.addEventListener("change", handleTaskListChange);
  elements.search?.addEventListener("input", renderTasks);
  elements.courseFilter?.addEventListener("change", renderTasks);
  elements.priorityFilter?.addEventListener("change", renderTasks);
  elements.statusTabs.forEach((tab) => {
    tab.addEventListener("click", handleStatusTabClick);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === courseStore?.STORAGE_KEY) {
      state.courses = courseStore.getAll();
      renderCourseOptions();
      renderTasks();
    }
  });

  elements.title?.addEventListener("input", () => {
    clearFieldError(elements.title, elements.titleError);
  });
  elements.course?.addEventListener("change", () => {
    clearFieldError(elements.course, elements.courseError);
  });
  elements.dueDate?.addEventListener("change", () => {
    clearFieldError(elements.dueDate, elements.dueDateError);
  });
};

initializeTaskManagement();
