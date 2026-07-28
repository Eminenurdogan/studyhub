const dashboardSidebar = document.querySelector("#appSidebar");
const sidebarMenuButton = document.querySelector(".sidebar-menu-button");
const sidebarCloseButton = document.querySelector(".sidebar-close-button");
const sidebarBackdrop = document.querySelector(".sidebar-backdrop");
const dashboardPage = document.querySelector(".dashboard-page");

const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");

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
