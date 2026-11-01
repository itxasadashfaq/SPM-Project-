window.pages.risks = async () => {
  const risks = await api.get("/risks");
  const ordered = [...risks].sort((a, b) => b.score - a.score);
  return `${heading("Risk & response planning", "Likelihood × impact matrix and preventive or corrective actions", '<button class="btn" data-action="add-risk">+ Add risk</button>')}
    <section class="card"><h2 class="card-title">Prioritization matrix</h2><p class="card-subtitle">Score = likelihood × impact. Higher scores should be reviewed first.</p>
      <div class="table-wrap"><table><thead><tr><th>RANK</th><th>RISK / ISSUE</th><th>LIKELIHOOD (1–5)</th><th>IMPACT (1–5)</th><th>SCORE</th><th>PRIORITY</th></tr></thead><tbody>${ordered.map((risk, index) => `<tr><td>${index + 1}</td><td><strong>${escapeHtml(risk.title)}</strong></td><td>${risk.likelihood}</td><td>${risk.impact}</td><td>${risk.score}</td><td class="${risk.score >= 15 ? "risk-high" : ""}">${risk.score >= 15 ? "High" : risk.score >= 8 ? "Medium" : "Low"}</td></tr>`).join("") || '<tr><td colspan="6" class="empty">No risks recorded.</td></tr>'}</tbody></table></div>
    </section>
    <section class="card"><h2 class="card-title">PDPC — response plan</h2><p class="card-subtitle">Problem → possible outcome → preventive or corrective response → owner</p>
      ${ordered.map((risk) => `<div class="alert ${risk.score >= 15 ? "danger" : ""}"><strong>${escapeHtml(risk.title)}</strong> → <span>${escapeHtml(risk.response)}</span><br><small>Owner: ${escapeHtml(risk.owner)} · Score ${risk.score} · ${escapeHtml(risk.status)}</small></div>`).join("") || '<div class="empty">Add a risk to build the response plan.</div>'}
    </section>
    <div id="risk-form" class="modal-backdrop" style="display:none"><div class="modal"><button class="modal-close" data-action="close-modal">×</button><h2>Add project risk</h2>
      <form id="risk-create" class="form-grid"><div class="field full"><label>Risk or issue</label><input name="title" required></div><div class="field"><label>Likelihood (1–5)</label><input type="number" min="1" max="5" name="likelihood" value="3" required></div><div class="field"><label>Impact (1–5)</label><input type="number" min="1" max="5" name="impact" value="3" required></div><div class="field"><label>Owner</label><input name="owner" required></div><div class="field full"><label>Preventive / corrective action</label><textarea name="response" required placeholder="Prevent: … Correct: …"></textarea></div><div class="form-actions field full"><button class="btn">Save risk</button></div></form>
    </div></div>`;
};
