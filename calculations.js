function calculateEvm({ budget, progress, actualCost, tasks = [], today = new Date() }) {
  const projectBudget = Number(budget) || 0;
  const plannedValue = tasks.length
    ? tasks.reduce((sum, task) => {
      const cost = Number(task.plannedCost) || 0;
      const start = new Date(`${task.startDate}T00:00:00Z`);
      const end = new Date(`${task.endDate}T00:00:00Z`);
      const reportDate = new Date(today);
      let plannedProgress = 0;
      if (reportDate >= end) plannedProgress = 1;
      else if (reportDate > start && end > start) plannedProgress = (reportDate - start) / (end - start);
      return sum + cost * plannedProgress;
    }, 0)
    : projectBudget;
  const earnedValue = tasks.length
    ? tasks.reduce((sum, task) => sum + (Number(task.plannedCost) || 0) * (Number(task.progress) || 0) / 100, 0)
    : projectBudget * (Number(progress) || 0) / 100;
  const cost = Number(actualCost) || 0;

  return {
    plannedValue: Math.round(plannedValue * 100) / 100,
    earnedValue,
    actualCost: cost,
    cpi: cost === 0 ? null : earnedValue / cost,
    spi: plannedValue === 0 ? null : earnedValue / plannedValue
  };
}

function getScheduleImpact(tasks, today = new Date()) {
  const byId = new Map(tasks.map((task) => [String(task._id), task]));
  const delayed = tasks.filter((task) =>
    task.status !== "Completed" &&
    task.endDate &&
    new Date(task.endDate) < today
  );

  return delayed.map((task) => {
    const affected = [];
    const visited = new Set();
    const queue = [String(task._id)];

    while (queue.length) {
      const currentId = queue.shift();
      for (const dependent of tasks) {
        const dependencies = (dependent.dependencies || []).map(String);
        const dependentId = String(dependent._id);
        if (
          dependencies.includes(currentId) &&
          !visited.has(dependentId) &&
          byId.has(dependentId)
        ) {
          visited.add(dependentId);
          affected.push(dependent.name);
          queue.push(dependentId);
        }
      }
    }

    const daysLate = Math.ceil((today - new Date(task.endDate)) / 86400000);
    return { taskId: String(task._id), taskName: task.name, daysLate, affected };
  });
}

module.exports = { calculateEvm, getScheduleImpact };
