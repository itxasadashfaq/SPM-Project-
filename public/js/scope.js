window.pages.scope = async () => {
  const [requirements, changes, tasks] = await Promise.all([api.get("/requirements"), api.get("/changes"), api.get("/tasks")]);
  return `${heading("Scope & change control", "Only approved requirements enter the project scope", '<button class="btn" data-action="add-requirement">+ Add requirement</button>')}
    <section class="card"><div class="section-header"><div><h2 class="card-title">Requirements register</h2><p class="card-subtitle">Approve scope items or keep them proposed until accepted</p></div></div>
      <div id="requirement-form" class="inline-form"><form id="requirement-create" class="form-grid">
        <div class="field"><label>Requirement</label><input name="title" required></div><div class="field"><label>Priority</label><select name="priority"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
        <div class="field full"><label>Description</label><textarea name="description"></textarea></div><div class="form-actions field full"><button class="btn">Save as proposed</button><button class="btn secondary" type="button" data-action="cancel-form">Cancel</button></div>
      </form></div>
      <div class="table-wrap"><table><thead><tr><th>REQUIREMENT</th><th>PRIORITY</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${requirements.map((r) => `<tr><td><strong>${escapeHtml(r.title)}</strong><br><small>${escapeHtml(r.description)}</small></td><td>${badge(r.priority)}</td><td>${badge(r.status)}</td><td><button class="btn secondary" data-action="edit-requirement" data-id="${r._id}">Edit</button> ${r.status === "Proposed" ? `<button class="btn secondary" data-action="approve-requirement" data-id="${r._id}">Approve</button>` : ""}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">No requirements added.</td></tr>'}</tbody></table></div>
    </section>
    <section class="card"><h2 class="card-title">Work Breakdown Structure (WBS)</h2><p class="card-subtitle">Project → deliverable → work packages (from the scheduled activities)</p>
      ${[...new Set(tasks.map((task) => task.wbsParent))].map((group, index) => `<div style="margin:12px 0"><strong>${index + 1}. ${escapeHtml(group)}</strong><ul style="margin:7px 0 0 20px;color:#697586;font-size:12px">${tasks.filter((task) => task.wbsParent === group).map((task) => `<li style="padding:4px 0">${escapeHtml(task.name)} — ${badge(task.status)}</li>`).join("")}</ul></div>`).join("") || '<div class="empty">Add activities to build the WBS.</div>'}
    </section>
    <section class="card"><div class="section-header"><div><h2 class="card-title">Change requests</h2><p class="card-subtitle">Approved changes update the scope, budget and project deadline</p></div><button class="btn" data-action="add-change">+ New change request</button></div>
      <div id="change-form" class="inline-form"><form id="change-create" class="form-grid">
        <div class="field"><label>Change title</label><input name="title" required placeholder="AI preliminary diagnosis & mobile app"></div>
        <div class="field"><label>Priority</label><select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div class="field full"><label>Justification</label><textarea name="justification" required placeholder="Why is this change needed?"></textarea></div>
        <div class="field"><label>Cost impact (PKR)</label><input name="costImpact" type="number" min="0" value="800000" required></div>
        <div class="field"><label>Schedule impact (days)</label><input name="scheduleImpactDays" type="number" min="0" value="21" required></div>
        <div class="form-actions field full"><button class="btn">Submit for approval</button><button class="btn secondary" type="button" data-action="cancel-form">Cancel</button></div>
      </form></div>
      <div class="table-wrap"><table><thead><tr><th>CHANGE</th><th>JUSTIFICATION</th><th>COST</th><th>SCHEDULE</th><th>STATUS / DECISION</th></tr></thead><tbody>${changes.map((c) => `<tr><td><strong>${escapeHtml(c.title)}</strong></td><td>${escapeHtml(c.justification)}</td><td>${money(c.costImpact)}</td><td>+${c.scheduleImpactDays} days</td><td>${c.status === "Pending" ? `<button class="btn" data-action="decide-change" data-status="Approved" data-id="${c._id}">Approve</button> <button class="btn secondary" data-action="decide-change" data-status="Rejected" data-id="${c._id}">Reject</button>` : badge(c.status)}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">No change requests yet.</td></tr>'}</tbody></table></div>
    </section>`;
};
