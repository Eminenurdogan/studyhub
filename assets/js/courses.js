const TASK_STORAGE_KEY = "studyhub.tasks.v1";

const courseStore = window.StudyHubCourseStore;

const elements = {
  page: document.querySelector(".courses-page"),
  drawer: document.querySelector("#courseDrawer"),
  drawerTitle: document.querySelector("#courseDrawerTitle"),
  openButton: document.querySelector("#openCourseDrawer"),
  closeButtons: document.querySelectorAll("[data-course-drawer-close]"),
  backdrop: document.querySelector(".course-drawer-backdrop"),
  form: document.querySelector("#courseForm"),
  saveButton: document.querySelector("#courseSaveButton"),
  formFeedback: document.querySelector("#courseFormFeedback"),
  list: document.querySelector("#courseList"),
  emptyState: document.querySelector("#courseEmptyState"),
  count: document.querySelector("#courseCount"),
  pageFeedback: document.querySelector("#coursePageFeedback"),
  toast: document.querySelector("#courseToast"),
  name: document.querySelector("#courseName"),
  color: document.querySelector("#courseColor"),
  description: document.querySelector("#courseDescription"),
  nameError: document.querySelector("#courseNameError"),
};

const state = {
  courses: [],
  editingCourseId: null,
  previouslyFocusedElement: null,
  toastTimer: null,
};

const createId = () =>
  window.crypto?.randomUUID?.() ??
  `course-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const announce = (message) => {
  if (!elements.pageFeedback) {
    return;
  }

  elements.pageFeedback.textContent = "";
  window.requestAnimationFrame(() => {
    elements.pageFeedback.textContent = message;
  });
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

const clearFieldError = (input, errorElement) => {
  input?.removeAttribute("aria-invalid");
  input?.closest(".course-form-field")?.classList.remove("has-error");

  if (errorElement) {
    errorElement.textContent = "";
  }
};

const setFieldError = (input, errorElement, message) => {
  input?.setAttribute("aria-invalid", "true");
  input?.closest(".course-form-field")?.classList.add("has-error");

  if (errorElement) {
    errorElement.textContent = message;
  }
};

const clearFormErrors = () => {
  clearFieldError(elements.name, elements.nameError);

  if (elements.formFeedback) {
    elements.formFeedback.textContent = "";
    elements.formFeedback.hidden = true;
  }
};

const showFormFeedback = (message) => {
  if (elements.formFeedback) {
    elements.formFeedback.textContent = message;
    elements.formFeedback.hidden = false;
  }
};

const resetForm = () => {
  elements.form?.reset();
  state.editingCourseId = null;
  clearFormErrors();

  if (elements.drawerTitle) {
    elements.drawerTitle.textContent = "Yeni Ders";
  }
  if (elements.saveButton) {
    elements.saveButton.textContent = "Kaydet";
  }
};

const isDrawerOpen = () =>
  elements.drawer?.classList.contains("is-open") ?? false;

const getFocusableElements = () => {
  if (!elements.drawer) {
    return [];
  }

  return Array.from(
    elements.drawer.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  );
};

const openDrawer = () => {
  if (
    !elements.page ||
    !elements.drawer ||
    !elements.openButton ||
    !elements.backdrop
  ) {
    return;
  }

  state.previouslyFocusedElement = document.activeElement;
  elements.drawer.classList.add("is-open");
  elements.backdrop.classList.add("is-visible");
  elements.page.classList.add("course-drawer-open");
  elements.drawer.setAttribute("aria-hidden", "false");
  elements.openButton.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => elements.name?.focus());
};

const closeDrawer = () => {
  if (
    !elements.page ||
    !elements.drawer ||
    !elements.openButton ||
    !elements.backdrop
  ) {
    return;
  }

  elements.drawer.classList.remove("is-open");
  elements.backdrop.classList.remove("is-visible");
  elements.page.classList.remove("course-drawer-open");
  elements.drawer.setAttribute("aria-hidden", "true");
  elements.openButton.setAttribute("aria-expanded", "false");
  resetForm();

  if (
    state.previouslyFocusedElement instanceof HTMLElement &&
    document.contains(state.previouslyFocusedElement)
  ) {
    state.previouslyFocusedElement.focus();
  }

  state.previouslyFocusedElement = null;
};

const openCreateDrawer = () => {
  resetForm();
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

  const focusableElements = getFocusableElements();
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

const createActionButton = (label, action, courseId, className) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.dataset.courseAction = action;
  button.dataset.courseId = courseId;
  button.textContent = label;
  return button;
};

const createCourseCard = (course) => {
  const article = document.createElement("article");
  const accent = document.createElement("span");
  const header = document.createElement("div");
  const titleGroup = document.createElement("div");
  const title = document.createElement("h4");
  const description = document.createElement("p");
  const actions = document.createElement("div");

  article.className = `course-card course-card--${course.color}`;
  article.dataset.courseId = course.id;
  accent.className = "course-card__accent";
  accent.setAttribute("aria-hidden", "true");
  header.className = "course-card__header";
  titleGroup.className = "course-card__title-group";
  title.className = "course-card__title";
  title.textContent = course.name;
  titleGroup.append(title);
  header.append(titleGroup);

  description.className = "course-card__description";
  description.textContent = course.description || "Açıklama eklenmedi.";

  actions.className = "course-card__actions";
  actions.append(
    createActionButton("Düzenle", "edit", course.id, "course-card__edit"),
    createActionButton("Sil", "delete", course.id, "course-card__delete"),
  );

  article.append(accent, header, description, actions);
  return article;
};

const renderCourses = () => {
  if (!elements.list || !elements.emptyState || !elements.count) {
    return;
  }

  elements.list.replaceChildren();
  elements.count.textContent = `${state.courses.length} ders`;

  if (state.courses.length === 0) {
    elements.list.hidden = true;
    elements.emptyState.hidden = false;
    return;
  }

  const fragment = document.createDocumentFragment();
  state.courses.forEach((course) => fragment.append(createCourseCard(course)));
  elements.list.append(fragment);
  elements.list.hidden = false;
  elements.emptyState.hidden = true;
};

const validateForm = () => {
  clearFormErrors();
  const name = elements.name?.value.trim() ?? "";
  const invalidFields = [];

  if (!name) {
    setFieldError(elements.name, elements.nameError, "Ders adı zorunludur.");
    invalidFields.push(elements.name);
  } else if (
    courseStore.hasDuplicateName(state.courses, name, state.editingCourseId)
  ) {
    setFieldError(
      elements.name,
      elements.nameError,
      "Bu isimde bir ders zaten bulunuyor.",
    );
    invalidFields.push(elements.name);
  }

  if (invalidFields.length > 0) {
    showFormFeedback("Lütfen işaretlenen alanları kontrol et.");
    invalidFields[0]?.focus();
    return false;
  }

  return true;
};

const getFormValues = () => {
  return {
    name: elements.name?.value.trim() ?? "",
    color: elements.color?.value ?? "lavender",
    description: elements.description?.value.trim() ?? "",
  };
};

const handleFormSubmit = (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const values = getFormValues();
  const editingCourse = state.courses.find(
    (course) => course.id === state.editingCourseId,
  );
  let nextCourses;
  let message;

  if (editingCourse) {
    const updatedCourse = {
      ...editingCourse,
      ...values,
      updatedAt: new Date().toISOString(),
    };
    nextCourses = state.courses.map((course) =>
      course.id === updatedCourse.id ? updatedCourse : course,
    );
    message = `${updatedCourse.name} dersi güncellendi.`;
  } else {
    const newCourse = {
      id: createId(),
      ...values,
      createdAt: new Date().toISOString(),
    };
    nextCourses = [newCourse, ...state.courses];
    message = `${newCourse.name} dersi oluşturuldu.`;
  }

  if (!courseStore.saveAll(nextCourses)) {
    showFormFeedback(
      "Ders kaydedilemedi. Tarayıcı depolama iznini kontrol edip tekrar dene.",
    );
    return;
  }

  state.courses = nextCourses;
  renderCourses();
  closeDrawer();
  showToast(message);
  announce(message);
};

const openEditDrawer = (courseId) => {
  const course = state.courses.find((item) => item.id === courseId);

  if (!course) {
    return;
  }

  resetForm();
  state.editingCourseId = course.id;
  elements.name.value = course.name;
  elements.color.value = course.color;
  elements.description.value = course.description;

  if (elements.drawerTitle) {
    elements.drawerTitle.textContent = "Dersi Düzenle";
  }
  if (elements.saveButton) {
    elements.saveButton.textContent = "Değişiklikleri Kaydet";
  }

  openDrawer();
};

const getLinkedTaskCount = (courseId) => {
  try {
    const tasks = JSON.parse(window.localStorage.getItem(TASK_STORAGE_KEY) ?? "[]");
    return Array.isArray(tasks)
      ? tasks.filter((task) => task?.course === courseId).length
      : 0;
  } catch (error) {
    console.error("Derse bağlı görevler kontrol edilemedi.", error);
    return 0;
  }
};

const deleteCourse = async (courseId) => {
  const course = state.courses.find((item) => item.id === courseId);

  if (!course || !window.StudyHubConfirmationDialog) {
    return;
  }

  const linkedTaskCount = getLinkedTaskCount(courseId);
  const linkedTaskWarning =
    linkedTaskCount > 0
      ? `Bu derse bağlı ${linkedTaskCount} görev silinmeyecek ancak ders bağlantıları artık bulunamayacak.`
      : "";

  const isConfirmed = await window.StudyHubConfirmationDialog.open({
    title: "Dersi sil",
    description:
      "Bu dersi silmek istediğine emin misin? Bu işlem geri alınamaz.",
    details: linkedTaskWarning,
    cancelLabel: "İptal",
    confirmLabel: "Sil",
  });

  if (!isConfirmed) {
    return;
  }

  const nextCourses = state.courses.filter((item) => item.id !== courseId);

  if (!courseStore.saveAll(nextCourses)) {
    showToast("Ders silinemedi. Lütfen tekrar dene.");
    return;
  }

  state.courses = nextCourses;
  renderCourses();
  const message = `${course.name} dersi silindi.`;
  showToast(message);
  announce(message);
};

const handleListClick = (event) => {
  const actionButton = event.target.closest("[data-course-action]");

  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.courseAction === "edit") {
    openEditDrawer(actionButton.dataset.courseId);
  } else if (actionButton.dataset.courseAction === "delete") {
    deleteCourse(actionButton.dataset.courseId);
  }
};

const initializeCourses = () => {
  if (!courseStore || !elements.form || !elements.list) {
    return;
  }

  state.courses = courseStore.getAll();
  courseStore.saveAll(state.courses);
  renderCourses();

  elements.openButton?.addEventListener("click", openCreateDrawer);
  elements.backdrop?.addEventListener("click", closeDrawer);
  elements.closeButtons.forEach((button) => {
    button.addEventListener("click", closeDrawer);
  });
  document.addEventListener("keydown", handleDrawerKeydown);
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.list.addEventListener("click", handleListClick);
  window.addEventListener("storage", (event) => {
    if (event.key === courseStore.STORAGE_KEY) {
      state.courses = courseStore.getAll();
      renderCourses();
    }
  });
  elements.name?.addEventListener("input", () => {
    clearFieldError(elements.name, elements.nameError);
  });
};

initializeCourses();
