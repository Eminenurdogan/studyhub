(function initializeConfirmationDialog(global) {
  let activeRequest = null;
  let previouslyFocusedElement = null;

  const overlay = document.createElement("div");
  const dialog = document.createElement("section");
  const icon = document.createElement("div");
  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const iconUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
  const title = document.createElement("h2");
  const description = document.createElement("p");
  const details = document.createElement("p");
  const actions = document.createElement("div");
  const cancelButton = document.createElement("button");
  const alternativeButton = document.createElement("button");
  const confirmButton = document.createElement("button");

  overlay.className = "confirmation-dialog-overlay";
  overlay.hidden = true;
  dialog.className = "confirmation-dialog";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "confirmationDialogTitle");
  dialog.setAttribute("aria-describedby", "confirmationDialogDescription");
  icon.className = "confirmation-dialog__icon";
  icon.setAttribute("aria-hidden", "true");
  iconUse.setAttribute("href", "assets/icons/dashboard-nav.svg#triangle-alert");
  iconSvg.append(iconUse);
  icon.append(iconSvg);
  title.id = "confirmationDialogTitle";
  title.className = "confirmation-dialog__title";
  description.id = "confirmationDialogDescription";
  description.className = "confirmation-dialog__description";
  details.className = "confirmation-dialog__details";
  details.hidden = true;
  actions.className = "confirmation-dialog__actions";
  cancelButton.type = "button";
  cancelButton.className = "confirmation-dialog__cancel";
  alternativeButton.type = "button";
  alternativeButton.className =
    "confirmation-dialog__cancel confirmation-dialog__alternative";
  alternativeButton.hidden = true;
  confirmButton.type = "button";
  confirmButton.className = "confirmation-dialog__confirm";

  actions.append(cancelButton, alternativeButton, confirmButton);
  dialog.append(icon, title, description, details, actions);
  overlay.append(dialog);
  document.body.append(overlay);

  const getFocusableElements = () =>
    Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

  const finish = (confirmed) => {
    if (!activeRequest) {
      return;
    }

    const request = activeRequest;
    activeRequest = null;
    overlay.classList.remove("is-visible");
    overlay.hidden = true;
    document.body.classList.remove("confirmation-dialog-open");

    if (
      previouslyFocusedElement instanceof HTMLElement &&
      document.contains(previouslyFocusedElement)
    ) {
      previouslyFocusedElement.focus();
    }

    previouslyFocusedElement = null;
    request.resolve(confirmed);
  };

  const handleKeydown = (event) => {
    if (!activeRequest) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    const currentElement =
      event.target instanceof HTMLElement ? event.target : document.activeElement;
    const activeElementIndex = focusableElements.indexOf(currentElement);

    if (!firstElement || !lastElement) {
      event.preventDefault();
    } else if (event.shiftKey && activeElementIndex <= 0) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      activeElementIndex >= focusableElements.length - 1
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      finish(false);
    }
  });
  overlay.addEventListener("keydown", handleKeydown);
  cancelButton.addEventListener("click", () => finish(false));
  alternativeButton.addEventListener("click", () => finish("alternative"));
  confirmButton.addEventListener("click", () => finish(true));

  const open = ({
    title: dialogTitle = "İşlemi onayla",
    description: dialogDescription = "Bu işlemi gerçekleştirmek istediğine emin misin?",
    details: dialogDetails = "",
    cancelLabel = "İptal",
    alternativeLabel = "",
    confirmLabel = "Onayla",
  } = {}) => {
    if (activeRequest) {
      finish(false);
    }

    title.textContent = dialogTitle;
    description.textContent = dialogDescription;
    details.textContent = dialogDetails;
    details.hidden = !dialogDetails;
    cancelButton.textContent = cancelLabel;
    alternativeButton.textContent = alternativeLabel;
    alternativeButton.hidden = !alternativeLabel;
    confirmButton.textContent = confirmLabel;
    previouslyFocusedElement = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("confirmation-dialog-open");

    return new Promise((resolve) => {
      activeRequest = { resolve };
      global.requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
        cancelButton.focus();
      });
    });
  };

  global.StudyHubConfirmationDialog = Object.freeze({ open });
})(window);
