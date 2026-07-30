(function initializeHubbyPlanCenter(global) {
  "use strict";

  const planStore = global.StudyHubHubbyPlanStore;
  const center = document.querySelector("#hubbyPlanCenter");
  const history = document.querySelector("#hubbyPlanHistory");

  if (!planStore || !center || !history) return;

  const formatDate = (value) =>
    new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const formatDuration = (minutes) => {
    const total = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(total / 60);
    const remainder = total % 60;

    if (!hours) return `${remainder} dk`;
    return remainder ? `${hours} sa ${remainder} dk` : `${hours} sa`;
  };

  const statusLabels = {
    draft: "Taslak",
    imported: "Aktarıldı",
    completed: "Tamamlandı",
    archived: "Arşivlendi",
  };

  const createButton = (label, action, planId, className = "") => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.planAction = action;
    button.dataset.planId = planId;
    button.className = className;
    return button;
  };

  const render = () => {
    const plans = planStore.getAll();
    center.hidden = plans.length === 0;
    history.replaceChildren();

    if (!plans.length) return;

    const fragment = document.createDocumentFragment();

    plans.forEach((plan) => {
      const item = document.createElement("article");
      const content = document.createElement("div");
      const titleRow = document.createElement("div");
      const title = document.createElement("strong");
      const status = document.createElement("span");
      const meta = document.createElement("span");
      const summary = document.createElement("span");
      const actions = document.createElement("div");

      content.className = "hubby-plan-history__content";
      titleRow.className = "hubby-plan-history__title";
      actions.className = "hubby-plan-history__actions";

      title.textContent = plan.name || "Çalışma Planı";
      status.className = `hubby-plan-status hubby-plan-status--${plan.status}`;
      status.textContent = statusLabels[plan.status] || "Taslak";
      meta.textContent = `${plan.sourceFileName || "Dosyasız plan"} · ${formatDate(plan.createdAt)}`;
      summary.textContent = `${plan.summary.courseCount} ders · ${plan.summary.taskCount} görev · ${formatDuration(plan.summary.totalMinutes)}`;

      titleRow.append(title, status);
      content.append(titleRow, meta, summary);
      actions.append(
        createButton("Aç", "open", plan.id, "is-primary"),
        createButton("Sil", "delete", plan.id, "is-danger"),
      );
      item.append(content, actions);
      fragment.append(item);
    });

    history.append(fragment);
  };

  const deletePlan = async (planId) => {
    const confirmed = await global.StudyHubConfirmationDialog?.open({
      title: "Planı sil",
      description:
        "Bu planı geçmişten silmek istediğine emin misin? Bu işlem geri alınamaz.",
      cancelLabel: "İptal",
      confirmLabel: "Sil",
    });

    if (!confirmed) return;
    planStore.remove(planId);
    render();
  };

  center.addEventListener("click", (event) => {
    const button = event.target.closest("[data-plan-action]");
    if (!button) return;

    const plan = planStore.getById(button.dataset.planId);
    if (!plan) return;

    if (button.dataset.planAction === "delete") {
      deletePlan(plan.id);
      return;
    }

    planStore.setCurrent(plan.id);
    global.dispatchEvent(
      new CustomEvent("hubby:open-plan", {
        detail: { plan, scrollToPreview: true },
      }),
    );
  });

  global.addEventListener("hubby:history-changed", render);
  global.addEventListener("studyhub:data-changed", render);
  render();

  global.StudyHubHubbyPlanCenter = Object.freeze({ render });
})(window);
