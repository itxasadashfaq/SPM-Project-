window.pages.charter = async () => {
  const project = await api.get("/project");
  return `${heading("Project charter & plan", "Update the approved project baseline and project management plan")}
    <form id="charter-form" class="card">
      <h2 class="card-title">Project charter</h2><p class="card-subtitle">Objectives, stakeholders, scope boundaries, budget and deadline</p>
      <div class="form-grid">
        <div class="field full"><label>Project name</label><input name="name" required value="${escapeHtml(project.name)}"></div>
        <div class="field full"><label>Project objective</label><textarea name="objective" required>${escapeHtml(project.objective)}</textarea></div>
        <div class="field"><label>Stakeholders</label><input name="stakeholders" required value="${escapeHtml(project.stakeholders)}"></div>
        <div class="field"><label>Project status</label><select name="status">${["In Progress","On Hold","Completed"].map((s) => `<option ${project.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div class="field full"><label>Approved project scope</label><textarea name="scope" required>${escapeHtml(project.scope)}</textarea></div>
        <div class="field full"><label>Out of scope / not approved</label><textarea name="exclusions">${escapeHtml(project.exclusions)}</textarea></div>
        <div class="field full"><label>Quality management plan</label><textarea name="qualityPlan" required>${escapeHtml(project.qualityPlan || "")}</textarea></div>
        <div class="field"><label>Approved budget (PKR)</label><input type="number" min="0" step="1000" name="approvedBudget" required value="${project.approvedBudget}"></div>
        <div class="field"><label>Project deadline</label><input type="date" name="deadline" required value="${project.deadline}"></div>
        <div class="field full"><label>Project closure notes (complete when closing)</label><textarea name="closureNotes">${escapeHtml(project.closureNotes || "")}</textarea></div>
        <input type="hidden" name="closureDate" value="${escapeHtml(project.closureDate || "")}">
        ${project.closureDate ? `<div class="field full"><label>Closure date</label><input value="${escapeHtml(project.closureDate)}" disabled></div>` : ""}
      </div>
      <div class="form-actions"><button class="btn" type="submit">Save project plan</button></div>
    </form>
    <section class="card"><h2 class="card-title">Project responsibilities</h2><p class="card-subtitle">Assigned delivery team for this five-hospital project</p>
      <div class="table-wrap"><table><thead><tr><th>ROLE</th><th>TEAM SIZE</th><th>RESPONSIBILITY</th></tr></thead><tbody>
      <tr><td>Project Manager</td><td>1</td><td>Charter, approvals, schedule and reporting</td></tr><tr><td>Backend Developers</td><td>2</td><td>Appointments, records, billing and integrations</td></tr><tr><td>Frontend Developers</td><td>2</td><td>Web interface and online consultation</td></tr><tr><td>Database Developer</td><td>1</td><td>Patient and project data design</td></tr><tr><td>QA Engineer</td><td>1</td><td>Testing, inspection and defect verification</td></tr>
      </tbody></table></div>
    </section>`;
};
