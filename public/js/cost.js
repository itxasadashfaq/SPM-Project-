window.pages.cost = async () => {
  const [dashboard, expenses, tasks] = await Promise.all([api.get("/dashboard"), api.get("/expenses"), api.get("/tasks")]);
  const evm = dashboard.evm;
  return `${heading("Cost management & EVM", "Record expenditure and monitor project performance", '<button class="btn" data-action="add-expense">+ Record expense</button>')}
    <div class="stats-grid">
      ${stat("Approved budget", money(dashboard.project.approvedBudget), "Current approved baseline")}
      ${stat("Planned Value (PV)", money(evm.plannedValue), "Time-phased value used in this simple baseline")}
      ${stat("Earned Value (EV)", money(evm.earnedValue), `${Math.round(dashboard.progress)}% project activity progress`)}
      ${stat("Actual Cost (AC)", money(evm.actualCost), `CPI ${evm.cpi === null ? "—" : evm.cpi.toFixed(2)} · SPI ${evm.spi.toFixed(2)}`, evm.actualCost > dashboard.project.approvedBudget ? "warn" : "")}
    </div>
    <section class="card"><h2 class="card-title">Performance indicators</h2><p class="card-subtitle">CPI = EV ÷ AC · SPI = EV ÷ PV · Values below 0.90 trigger a warning</p>
      <div class="stats-grid" style="margin-top:14px;margin-bottom:0">
        ${stat("Cost Performance Index", evm.cpi === null ? "—" : evm.cpi.toFixed(2), evm.cpi !== null && evm.cpi < 0.9 ? "Cost overrun warning" : "At or above target", evm.cpi !== null && evm.cpi < 0.9 ? "warn" : "good")}
        ${stat("Schedule Performance Index", evm.spi.toFixed(2), evm.spi < 0.9 ? "Schedule delay warning" : "At or above target", evm.spi < 0.9 ? "warn" : "good")}
        ${stat("Available budget", money(Math.max(0, dashboard.project.approvedBudget - dashboard.actualCost)), "Approved budget less actual expenditure", dashboard.actualCost > dashboard.project.approvedBudget ? "warn" : "good")}
        ${stat("Planned activity costs", money(tasks.reduce((sum, task) => sum + Number(task.plannedCost || 0), 0)), "Sum of activity estimates")}
      </div>
    </section>
    <section class="card"><h2 class="card-title">Expenditure register</h2><p class="card-subtitle">Every saved expense contributes to Actual Cost (AC)</p>
      <div id="expense-form" class="inline-form"><form id="expense-create" class="form-grid"><div class="field"><label>Description</label><input name="description" required></div><div class="field"><label>Amount (PKR)</label><input name="amount" type="number" min="0" required></div><div class="field"><label>Date</label><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Activity</label><select name="taskName"><option value="">General project cost</option>${tasks.map((task) => `<option>${escapeHtml(task.name)}</option>`).join("")}</select></div><div class="field full form-actions"><button class="btn">Save expense</button><button type="button" class="btn secondary" data-action="cancel-form">Cancel</button></div></form></div>
      <div class="table-wrap"><table><thead><tr><th>EXPENSE</th><th>ACTIVITY</th><th>DATE</th><th>AMOUNT</th></tr></thead><tbody>${expenses.map((expense) => `<tr><td>${escapeHtml(expense.description)}</td><td>${escapeHtml(expense.taskName || "General")}</td><td>${expense.date}</td><td><strong>${money(expense.amount)}</strong></td></tr>`).join("") || '<tr><td colspan="4" class="empty">No expenses recorded.</td></tr>'}</tbody></table></div>
    </section>`;
};
