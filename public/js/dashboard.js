window.pages = window.pages || {};
const money = (amount) => `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;
const badge = (status) => {
  const tone = ["Approved", "Completed", "Resolved", "Pass"].includes(status) ? "green"
    : ["Pending", "In Progress", "Medium"].includes(status) ? "yellow"
      : ["Critical", "Open", "Fail", "Rejected"].includes(status) ? "red" : "blue";
  return `<span class="badge ${tone}">${escapeHtml(status || "—")}</span>`;
};
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function heading(title, subtitle, button = "") {
  return `<div class="page-heading"><div><div class="eyebrow">SMART HEALTHCARE PROJECT</div><h1>${title}</h1><p>${subtitle}</p></div>${button}</div>`;
}
function stat(label, value, note, tone = "") {
  return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value ${tone}">${value}</div><div class="stat-note">${note}</div></div>`;
}
window.pages.dashboard = async () => {
  const data = await api.get("/dashboard");
  const { project, progress, actualCost, evm } = data;
  const performanceWarnings = [];
  if (evm.cpi !== null && evm.cpi < 0.9) performanceWarnings.push("Cost warning: CPI is below 0.90.");
  if (evm.spi < 0.9) performanceWarnings.push("Schedule warning: SPI is below 0.90.");
  const scheduleRows = data.delayed.length
    ? data.delayed.map((item) => `<div class="alert danger"><strong>${escapeHtml(item.taskName)}</strong> is ${item.daysLate} day(s) late${item.affected.length ? `; affects ${item.affected.map(escapeHtml).join(", ")}` : ""}.</div>`).join("")
    : `<div class="alert good">No overdue activities.</div>`;
  const approvedChange = data.approvedChanges.reduce((sum, item) => sum + item.costImpact, 0);
  return `${heading("Project dashboard", "Project health, delivery progress and items needing attention")}
    <div class="stats-grid">
      ${stat("Overall progress", `${Math.round(progress)}%`, `${project.status} · due ${project.deadline}`, "good")}
      ${stat("Approved budget", money(project.approvedBudget), approvedChange ? `${money(approvedChange)} added by approved changes` : "Initial approved baseline")}
      ${stat("Actual expenditure", money(actualCost), `CPI ${evm.cpi === null ? "—" : evm.cpi.toFixed(2)} · SPI ${evm.spi.toFixed(2)}`, actualCost > project.approvedBudget ? "warn" : "")}
      ${stat("Open critical defects", data.criticalDefects, `${data.pendingChanges} pending change request(s)`, data.criticalDefects ? "warn" : "good")}
    </div>
    <div class="dashboard-grid">
      <section class="card"><h2 class="card-title">Project delivery</h2><p class="card-subtitle">${escapeHtml(project.name)} · five hospitals</p>
        <div class="progress-top"><span>Team activity progress</span><strong>${Math.round(progress)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, progress)}%"></div></div>
        <div style="margin-top:18px">${performanceWarnings.map((warning) => `<div class="alert">${warning}</div>`).join("") || '<div class="alert good">Cost and schedule performance are within warning thresholds.</div>'}</div>
      </section>
      <section class="card"><h2 class="card-title">Schedule watch</h2><p class="card-subtitle">Overdue work and downstream activities</p>${scheduleRows}</section>
      <section class="card"><h2 class="card-title">Project timeline</h2><p class="card-subtitle">Planned work-package dates</p>
        <div class="chart">${data.tasks.map((task) => `<div class="chart-row"><div class="chart-name" title="${escapeHtml(task.name)}">${task.milestone ? "◆ " : ""}${escapeHtml(task.name)}</div><div class="chart-track"><div class="chart-bar ${task.status === "Completed" ? "done" : ""}" style="width:${Math.max(4, task.progress)}%"></div><span class="chart-label">${task.progress}% · ${escapeHtml(task.status)}</span></div></div>`).join("")}</div>
      </section>
      <section class="card"><h2 class="card-title">Earned value snapshot</h2><p class="card-subtitle">Current project indicators</p>
        <table><tbody><tr><td>Planned Value (PV)</td><td><strong>${money(evm.plannedValue)}</strong></td></tr><tr><td>Earned Value (EV)</td><td><strong>${money(evm.earnedValue)}</strong></td></tr><tr><td>Actual Cost (AC)</td><td><strong>${money(evm.actualCost)}</strong></td></tr><tr><td>Cost Performance Index</td><td>${evm.cpi === null ? "—" : evm.cpi.toFixed(2)}</td></tr><tr><td>Schedule Performance Index</td><td>${evm.spi.toFixed(2)}</td></tr></tbody></table>
      </section>
    </div>`;
};
