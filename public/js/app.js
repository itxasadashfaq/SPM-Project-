const main = document.getElementById("main-content");
const toast = document.getElementById("toast");

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
async function showPage(name) {
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.page === name));
  main.innerHTML = '<div class="loading">Loading project data…</div>';
  try { main.innerHTML = await pages[name](); }
  catch (error) { main.innerHTML = `<section class="card"><div class="alert danger">${escapeHtml(error.message)}</div></section>`; }
}
function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}
api.get("/health").then(() => {
  document.getElementById("db-status").textContent = "MongoDB connected";
}).catch(() => {
  document.getElementById("db-light").style.background = "#c2413b";
  document.getElementById("db-status").textContent = "Database unavailable";
});
document.addEventListener("click", async (event) => {
  const nav = event.target.closest(".nav-item");
  if (nav) return showPage(nav.dataset.page);
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const toggle = (selector) => document.querySelector(selector)?.classList.toggle("open");
  try {
    if (action === "add-requirement") toggle("#requirement-form");
    if (action === "add-change") toggle("#change-form");
    if (action === "add-expense") {
      const form = document.querySelector("#expense-form");
      form?.classList.add("open");
      form?.scrollIntoView({ behavior: "smooth", block: "center" });
      form?.querySelector("input[name='description']")?.focus({ preventScroll: true });
    }
    if (action === "add-defect") toggle("#defect-form");
    if (action === "add-check") toggle("#check-form");
    if (action === "cancel-form") button.closest(".inline-form")?.classList.remove("open");
    if (action === "add-task") document.querySelector("#task-form").style.display = "grid";
    if (action === "add-risk") document.querySelector("#risk-form").style.display = "grid";
    if (action === "close-modal") button.closest(".modal-backdrop").style.display = "none";
    if (action === "edit-requirement") {
      const requirements = await api.get("/requirements");
      const selected = requirements.find((item) => item._id === id);
      const form = document.querySelector("#requirement-create");
      form.id = "requirement-update";
      form.dataset.id = id;
      form.dataset.status = selected.status;
      form.elements.title.value = selected.title;
      form.elements.priority.value = selected.priority;
      form.elements.description.value = selected.description || "";
      form.querySelector("button[type='submit'], button:not([type])").textContent = "Update requirement";
      document.querySelector("#requirement-form").classList.add("open");
    }
    if (action === "approve-requirement") {
      const requirement = await api.get("/requirements");
      const selected = requirement.find((item) => item._id === id);
      await api.put(`/requirements/${id}`, { ...selected, status: "Approved" });
      notify("Requirement approved and added to scope."); await showPage("scope");
    }
    if (action === "decide-change") {
      await api.post(`/changes/${id}/decision`, { status: button.dataset.status });
      notify(button.dataset.status === "Approved" ? "Approved: scope, budget and deadline updated." : "Change request rejected.");
      await showPage("scope");
    }
    if (action === "resolve-defect") {
      const items = await api.get("/defects");
      const defect = items.find((item) => item._id === id);
      await api.put(`/defects/${id}`, { ...defect, status: "Resolved" });
      notify("Defect marked as resolved."); await showPage("quality");
    }
    if (action === "update-progress") {
      const form = document.querySelector(`.progress-form[data-id="${id}"]`);
      const [task] = (await api.get("/tasks")).filter((item) => item._id === id);
      const progress = Number(new FormData(form).get("progress"));
      await api.put(`/tasks/${id}`, { ...task, progress, status: progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started" });
      notify("Activity progress updated."); await showPage("schedule");
    }
  } catch (error) { notify(error.message); }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  const definitions = {
    "charter-form": async (data) => api.put("/project", data),
    "requirement-create": async (data) => api.post("/requirements", data),
    "requirement-update": async (data) => api.put(`/requirements/${form.dataset.id}`, { ...data, status: form.dataset.status }),
    "change-create": async (data) => api.post("/changes", { ...data, costImpact: Number(data.costImpact), scheduleImpactDays: Number(data.scheduleImpactDays) }),
    "task-create": async (data) => api.post("/tasks", { ...data, dependencies: Array.from(form.elements.dependencies.selectedOptions, (option) => option.value), progress: Number(data.progress), plannedCost: Number(data.plannedCost), milestone: form.elements.milestone.checked }),
    "expense-create": async (data) => api.post("/expenses", { ...data, amount: Number(data.amount) }),
    "defect-create": async (data) => api.post("/defects", data),
    "check-create": async (data) => api.post("/checklists", data),
    "risk-create": async (data) => api.post("/risks", { ...data, likelihood: Number(data.likelihood), impact: Number(data.impact) })
  };
  const action = definitions[form.id];
  if (!action) return;
  event.preventDefault();
  try {
    await action(formData(form));
    notify("Saved successfully.");
    const page = document.querySelector(".nav-item.active")?.dataset.page || "dashboard";
    await showPage(page);
  } catch (error) { notify(error.message); }
});

showPage("dashboard");
