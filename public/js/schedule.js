window.pages.schedule = async () => {
  const tasks = await api.get("/tasks");
  const sorted = [...tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const minDate = sorted.length ? new Date(`${sorted[0].startDate}T00:00:00Z`) : new Date();
  const maxDate = sorted.length ? new Date(`${sorted.reduce((max, task) => task.endDate > max ? task.endDate : max, sorted[0].endDate)}T00:00:00Z`) : minDate;
  const span = Math.max(1, (maxDate - minDate) / 86400000);
  const groups = [...new Set(tasks.map((task) => task.wbsParent))];
  return `${heading("Schedule & team", "Activities, owners, planned dates, dependencies and progress", '<button class="btn" data-action="add-task">+ Add activity</button>')}
    <section class="card"><h2 class="card-title">WBS work packages</h2><p class="card-subtitle">Project → deliverable → assigned work packages</p>
      ${groups.map((group, index) => `<div style="margin:12px 0"><strong>${index + 1}. ${escapeHtml(group)}</strong><ul style="margin:7px 0 0 20px;color:#697586;font-size:12px">${tasks.filter((task) => task.wbsParent === group).map((task) => `<li style="padding:4px 0">${escapeHtml(task.name)} · ${escapeHtml(task.assignee)}</li>`).join("")}</ul></div>`).join("") || '<div class="empty">Add work packages to build the WBS.</div>'}
    </section>
    <section class="card"><h2 class="card-title">Project timeline</h2><p class="card-subtitle">Bar length represents reported completion; ◆ identifies a milestone</p>
      <div class="chart">${sorted.map((task) => {
        const offset = Math.max(0, (new Date(`${task.startDate}T00:00:00Z`) - minDate) / 86400000 / span * 100);
        const width = Math.max(3, (new Date(`${task.endDate}T00:00:00Z`) - new Date(`${task.startDate}T00:00:00Z`)) / 86400000 / span * 100);
        return `<div class="chart-row"><div class="chart-name" title="${escapeHtml(task.name)}">${task.milestone ? "◆ " : ""}${escapeHtml(task.name)}</div><div class="chart-track"><div class="chart-bar ${task.status === "Completed" ? "done" : ""}" style="position:absolute;left:${offset}%;width:${width}%;opacity:.3"></div><div class="chart-bar" style="position:absolute;left:${offset}%;width:${Math.max(1, width * task.progress / 100)}%;background:${task.status === "Completed" ? "#3578b9" : "#28a27d"}"></div><span class="chart-label">${task.startDate} → ${task.endDate} · ${task.progress}%</span></div></div>`;
      }).join("") || '<div class="empty">Add project activities to build the timeline.</div>'}</div>
    </section>
    <section class="card"><h2 class="card-title">Activities & responsibilities</h2><p class="card-subtitle">Schedule risks and dependent work are highlighted on the dashboard</p>
      <div class="table-wrap"><table><thead><tr><th>ACTIVITY</th><th>OWNER</th><th>DATES</th><th>PLANNED COST</th><th>PROGRESS</th><th>STATUS</th><th></th></tr></thead><tbody>${tasks.map((task) => `<tr><td><strong>${escapeHtml(task.name)}</strong>${task.milestone ? " ◆" : ""}</td><td>${escapeHtml(task.assignee)}</td><td>${task.startDate} – ${task.endDate}</td><td>${money(task.plannedCost)}</td><td><form class="progress-form" data-id="${task._id}"><input style="width:65px;padding:5px" type="number" min="0" max="100" name="progress" value="${task.progress}"> %</form></td><td>${badge(task.status)}</td><td><button class="btn secondary" data-action="update-progress" data-id="${task._id}">Save</button></td></tr>`).join("") || '<tr><td colspan="7" class="empty">No activities added.</td></tr>'}</tbody></table></div>
    </section>
    <div id="task-form" class="modal-backdrop" style="display:none"><div class="modal"><button class="modal-close" data-action="close-modal">×</button><h2>Add project activity</h2>
      <form id="task-create" class="form-grid">
        <div class="field full"><label>Activity name</label><input name="name" required></div><div class="field"><label>WBS deliverable / parent</label><input name="wbsParent" required placeholder="e.g. 2. Core hospital modules"></div><div class="field"><label>Assignee</label><input name="assignee" required></div><div class="field"><label>Status</label><select name="status"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
        <div class="field"><label>Start date</label><input type="date" name="startDate" required></div><div class="field"><label>End date</label><input type="date" name="endDate" required></div>
        <div class="field"><label>Planned cost (PKR)</label><input type="number" min="0" name="plannedCost" value="0"></div><div class="field"><label>Progress (%)</label><input type="number" min="0" max="100" name="progress" value="0"></div>
        <div class="field full"><label>Depends on (select one or more activities)</label><select name="dependencies" multiple size="4">${tasks.map((task) => `<option value="${task._id}">${escapeHtml(task.name)}</option>`).join("")}</select></div>
        <div class="field full"><label><input type="checkbox" name="milestone" style="width:auto"> This activity is a milestone</label></div>
        <div class="form-actions field full"><button class="btn">Save activity</button></div>
      </form>
    </div></div>`;
};
