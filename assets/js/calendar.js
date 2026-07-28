const CALENDAR_TASK_STORAGE_KEY = "studyhub.tasks.v1";

const calendarCourseStore = window.StudyHubCourseStore;

const calendarElements = {
  grid: document.querySelector("#calendarGrid"),
  monthTitle: document.querySelector("#calendarMonthTitle"),
  previousButton: document.querySelector("#previousMonth"),
  todayButton: document.querySelector("#todayButton"),
  nextButton: document.querySelector("#nextMonth"),
  selectedDayTitle: document.querySelector("#selectedDayTitle"),
  selectedDayCount: document.querySelector("#selectedDayCount"),
  dayTaskList: document.querySelector("#selectedDayTaskList"),
  dayEmpty: document.querySelector("#selectedDayEmpty"),
};

const CALENDAR_PRIORITY_LABELS = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

const CALENDAR_STATUS_LABELS = {
  pending: "Bekleyen",
  "in-progress": "Devam Ediyor",
  completed: "Tamamlandı",
};

const calendarState = {
  tasks: [],
  courses: [],
  visibleMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ),
};

const toDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const parseDateKey = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");

  if (!match) {
    return null;
  }

  const date = new Date(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10) - 1,
    Number.parseInt(match[3], 10),
  );

  return toDateKey(date) === value ? date : null;
};

const readCalendarTasks = () => {
  try {
    const storedTasks = JSON.parse(
      window.localStorage.getItem(CALENDAR_TASK_STORAGE_KEY) ?? "[]",
    );

    if (!Array.isArray(storedTasks)) {
      return [];
    }

    return storedTasks
      .filter(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.title === "string" &&
          parseDateKey(task.dueDate),
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        course: typeof task.course === "string" ? task.course : "",
        priority: CALENDAR_PRIORITY_LABELS[task.priority]
          ? task.priority
          : "medium",
        status: CALENDAR_STATUS_LABELS[task.status] ? task.status : "pending",
        dueDate: task.dueDate,
      }));
  } catch (error) {
    console.error("Takvim görevleri yüklenemedi.", error);
    return [];
  }
};

const getCalendarCourseName = (courseId) =>
  calendarState.courses.find((course) => course.id === courseId)?.name ??
  "Silinmiş ders";

const formatCalendarMonth = (date) =>
  new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatCalendarDay = (date) =>
  new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const getTasksForDate = (dateKey) =>
  calendarState.tasks
    .filter((task) => task.dueDate === dateKey)
    .sort((firstTask, secondTask) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (
        priorityOrder[firstTask.priority] -
          priorityOrder[secondTask.priority] ||
        firstTask.title.localeCompare(secondTask.title, "tr")
      );
    });

const appendCalendarDetail = (list, label, value) => {
  const item = document.createElement("li");
  const itemLabel = document.createElement("span");
  const itemValue = document.createElement("strong");
  itemLabel.textContent = label;
  itemValue.textContent = value;
  item.append(itemLabel, itemValue);
  list.append(item);
};

const createDayTaskItem = (task) => {
  const article = document.createElement("article");
  const title = document.createElement("h4");
  const details = document.createElement("ul");

  article.className = `calendar-task calendar-task--${task.priority}`;
  title.className = "calendar-task__title";
  title.textContent = task.title;
  details.className = "calendar-task__details";

  appendCalendarDetail(details, "Ders", getCalendarCourseName(task.course));
  appendCalendarDetail(
    details,
    "Öncelik",
    CALENDAR_PRIORITY_LABELS[task.priority],
  );
  appendCalendarDetail(details, "Durum", CALENDAR_STATUS_LABELS[task.status]);
  appendCalendarDetail(details, "Son teslim", formatCalendarDay(parseDateKey(task.dueDate)));

  article.append(title, details);
  return article;
};

const renderSelectedDay = () => {
  if (
    !calendarElements.selectedDayTitle ||
    !calendarElements.selectedDayCount ||
    !calendarElements.dayTaskList ||
    !calendarElements.dayEmpty
  ) {
    return;
  }

  const selectedDateKey = toDateKey(calendarState.selectedDate);
  const dayTasks = getTasksForDate(selectedDateKey);

  calendarElements.selectedDayTitle.textContent = formatCalendarDay(
    calendarState.selectedDate,
  );
  calendarElements.selectedDayCount.textContent = `${dayTasks.length} görev`;
  calendarElements.dayTaskList.replaceChildren();
  calendarElements.dayTaskList.hidden = dayTasks.length === 0;
  calendarElements.dayEmpty.hidden = dayTasks.length > 0;

  const fragment = document.createDocumentFragment();
  dayTasks.forEach((task) => fragment.append(createDayTaskItem(task)));
  calendarElements.dayTaskList.append(fragment);
};

const createPriorityIndicators = (tasks) => {
  const container = document.createElement("span");
  container.className = "calendar-day__indicators";
  container.setAttribute("aria-hidden", "true");

  tasks.slice(0, 4).forEach((task) => {
    const dot = document.createElement("i");
    dot.className = `calendar-priority-dot calendar-priority-dot--${task.priority}`;
    container.append(dot);
  });

  if (tasks.length > 4) {
    const overflow = document.createElement("span");
    overflow.className = "calendar-day__overflow";
    overflow.textContent = `+${tasks.length - 4}`;
    container.append(overflow);
  }

  return container;
};

const createTaskPreview = (tasks) => {
  const preview = document.createElement("span");
  preview.className = "calendar-day__task-preview";
  preview.textContent =
    tasks.length === 1 ? tasks[0].title : `${tasks.length} görev`;
  return preview;
};

const selectCalendarDate = (date) => {
  calendarState.selectedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (
    date.getMonth() !== calendarState.visibleMonth.getMonth() ||
    date.getFullYear() !== calendarState.visibleMonth.getFullYear()
  ) {
    calendarState.visibleMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    );
  }

  renderCalendar();
};

const moveCalendarSelection = (dayDifference) => {
  const nextDate = new Date(
    calendarState.selectedDate.getFullYear(),
    calendarState.selectedDate.getMonth(),
    calendarState.selectedDate.getDate() + dayDifference,
  );
  selectCalendarDate(nextDate);
  window.requestAnimationFrame(() => {
    calendarElements.grid
      ?.querySelector(`[data-date="${toDateKey(nextDate)}"]`)
      ?.focus();
  });
};

const handleCalendarDayKeydown = (event) => {
  const movementByKey = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  };
  const dayDifference = movementByKey[event.key];

  if (dayDifference) {
    event.preventDefault();
    moveCalendarSelection(dayDifference);
  }
};

const createCalendarDay = (date) => {
  const button = document.createElement("button");
  const dayNumber = document.createElement("span");
  const dateKey = toDateKey(date);
  const dayTasks = getTasksForDate(dateKey);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(calendarState.selectedDate);
  const isCurrentMonth =
    date.getMonth() === calendarState.visibleMonth.getMonth();

  button.type = "button";
  button.className = "calendar-day";
  button.dataset.date = dateKey;
  button.setAttribute("role", "gridcell");
  button.tabIndex = dateKey === selectedKey ? 0 : -1;
  button.setAttribute(
    "aria-label",
    `${formatCalendarDay(date)}, ${dayTasks.length} görev`,
  );
  button.setAttribute("aria-pressed", String(dateKey === selectedKey));
  button.classList.toggle("is-outside-month", !isCurrentMonth);
  button.classList.toggle("is-selected", dateKey === selectedKey);

  if (dateKey === todayKey) {
    button.classList.add("is-today");
    button.setAttribute("aria-current", "date");
  }

  dayNumber.className = "calendar-day__number";
  dayNumber.textContent = date.getDate();
  button.append(dayNumber);

  if (dayTasks.length > 0) {
    button.classList.add("has-tasks");
    button.append(createPriorityIndicators(dayTasks), createTaskPreview(dayTasks));
  }

  button.addEventListener("click", () => selectCalendarDate(date));
  button.addEventListener("keydown", handleCalendarDayKeydown);
  return button;
};

function renderCalendar() {
  if (!calendarElements.grid || !calendarElements.monthTitle) {
    return;
  }

  calendarElements.monthTitle.textContent = formatCalendarMonth(
    calendarState.visibleMonth,
  );
  calendarElements.grid.replaceChildren();

  const firstDayOfMonth = new Date(
    calendarState.visibleMonth.getFullYear(),
    calendarState.visibleMonth.getMonth(),
    1,
  );
  const mondayBasedOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStartDate = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    1 - mondayBasedOffset,
  );
  const fragment = document.createDocumentFragment();

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = document.createElement("div");
    week.className = "calendar-week-row";
    week.setAttribute("role", "row");

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const gridDayIndex = weekIndex * 7 + dayIndex;
      const date = new Date(
        gridStartDate.getFullYear(),
        gridStartDate.getMonth(),
        gridStartDate.getDate() + gridDayIndex,
      );
      week.append(createCalendarDay(date));
    }

    fragment.append(week);
  }

  calendarElements.grid.append(fragment);
  renderSelectedDay();
}

const changeVisibleMonth = (monthDifference) => {
  const targetMonth = new Date(
    calendarState.visibleMonth.getFullYear(),
    calendarState.visibleMonth.getMonth() + monthDifference,
    1,
  );
  calendarState.visibleMonth = targetMonth;
  calendarState.selectedDate = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    1,
  );
  renderCalendar();
};

const goToToday = () => {
  const today = new Date();
  calendarState.visibleMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );
  calendarState.selectedDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  renderCalendar();
};

const refreshCalendarData = () => {
  calendarState.tasks = readCalendarTasks();
  calendarState.courses = calendarCourseStore?.getAll() ?? [];
  renderCalendar();
};

const initializeCalendar = () => {
  if (!calendarElements.grid) {
    return;
  }

  refreshCalendarData();
  calendarElements.previousButton?.addEventListener("click", () => {
    changeVisibleMonth(-1);
  });
  calendarElements.nextButton?.addEventListener("click", () => {
    changeVisibleMonth(1);
  });
  calendarElements.todayButton?.addEventListener("click", goToToday);
  window.addEventListener("storage", (event) => {
    if (
      event.key === CALENDAR_TASK_STORAGE_KEY ||
      event.key === calendarCourseStore?.STORAGE_KEY
    ) {
      refreshCalendarData();
    }
  });
};

initializeCalendar();
