const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const { calculateEvm, getScheduleImpact } = require("./calculations");

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const databaseName = process.env.MONGODB_DATABASE || "smart_healthcare_pm";
const collections = ["requirements", "changes", "tasks", "expenses", "defects", "checklists", "risks"];
let db;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res, next) => {
  try {
    await db.command({ ping: 1 });
    res.json({ database: "connected" });
  } catch (error) { next(error); }
});

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${label} is required.`);
  }
  return value.trim();
}

function validMoney(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw badRequest(`${label} must be a valid non-negative amount.`);
  }
  return amount;
}

function validDate(value, label) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw badRequest(`${label} must be a valid date.`);
  }
  return date.toISOString().slice(0, 10);
}

function toObjectId(value) {
  if (!ObjectId.isValid(value)) throw badRequest("Invalid record id.");
  return new ObjectId(value);
}

async function seedDatabase() {
  const existingProject = await db.collection("project").findOne({});
  if (existingProject) {
    await db.collection("project").updateOne(
      { _id: existingProject._id },
      { $set: {
        qualityPlan: existingProject.qualityPlan || "QA regression testing for appointments, patient records, billing and laboratory reports.",
        closureNotes: existingProject.closureNotes || "",
        closureDate: existingProject.closureDate || ""
      } }
    );
    const existingTasks = await db.collection("tasks").find().toArray();
    for (const task of existingTasks) {
      if (!task.wbsParent) {
        const wbsParent = task.name.includes("initiation") ? "1. Project management"
          : task.name.includes("testing") || task.name.includes("rollout") ? "3. Testing and rollout"
            : "2. Core hospital modules";
        await db.collection("tasks").updateOne({ _id: task._id }, { $set: { wbsParent } });
      }
    }
    const changeTitle = "AI preliminary diagnosis and mobile application";
    if (!await db.collection("changes").findOne({ title: changeTitle })) {
      await db.collection("changes").insertOne({
        title: changeTitle,
        justification: "Hospital management requested AI-assisted preliminary diagnosis and mobile access.",
        costImpact: 800000,
        scheduleImpactDays: 21,
        priority: "High",
        status: "Pending",
        createdAt: new Date()
      });
    }
    return;
  }
  await db.collection("project").insertOne({
    name: "Smart Healthcare Project Management System",
    objective: "Deliver appointment, laboratory, doctor schedule, online consultation and billing software for five hospitals.",
    stakeholders: "Hospital management, doctors, patients, project team",
    scope: "Patient appointments, laboratory reports, doctor schedules, online consultations and billing",
    exclusions: "AI preliminary diagnosis and mobile application (not approved yet)",
    approvedBudget: 5000000,
    deadline: "2026-08-21",
    status: "In Progress",
    qualityPlan: "QA regression testing for appointments, patient records, billing and laboratory reports.",
    closureNotes: "",
    closureDate: "",
    createdAt: new Date()
  });

  await db.collection("requirements").insertMany([
    { title: "Patient appointment scheduling", priority: "High", status: "Approved", description: "Book and manage appointments across five hospitals." },
    { title: "Patient records", priority: "High", status: "Approved", description: "Securely manage patient details and visit history." },
    { title: "Laboratory reports", priority: "Medium", status: "Approved", description: "Store and share laboratory results." },
    { title: "AI preliminary diagnosis", priority: "High", status: "Proposed", description: "Provide an AI-based preliminary diagnosis." },
    { title: "Mobile application", priority: "Medium", status: "Proposed", description: "Provide mobile access for patients and doctors." }
  ]);
  await db.collection("changes").insertOne({
    title: "AI preliminary diagnosis and mobile application",
    justification: "Hospital management requested AI-assisted preliminary diagnosis and mobile access.",
    costImpact: 800000,
    scheduleImpactDays: 21,
    priority: "High",
    status: "Pending",
    createdAt: new Date()
  });

  const tasks = await db.collection("tasks").insertMany([
    { name: "Project initiation and requirements", wbsParent: "1. Project management", assignee: "Project Manager", startDate: "2026-05-04", endDate: "2026-05-15", progress: 100, status: "Completed", plannedCost: 450000, dependencies: [], milestone: true },
    { name: "Database and patient records", wbsParent: "2. Core hospital modules", assignee: "Database Developer", startDate: "2026-05-18", endDate: "2026-06-12", progress: 70, status: "In Progress", plannedCost: 900000, dependencies: [], milestone: false },
    { name: "Appointment scheduling", wbsParent: "2. Core hospital modules", assignee: "Backend Developer 1", startDate: "2026-06-01", endDate: "2026-06-26", progress: 55, status: "In Progress", plannedCost: 850000, dependencies: [], milestone: false },
    { name: "Hospital billing and laboratory reports", wbsParent: "2. Core hospital modules", assignee: "Backend Developer 2", startDate: "2026-06-15", endDate: "2026-07-10", progress: 15, status: "In Progress", plannedCost: 800000, dependencies: [], milestone: false },
    { name: "Web interface and online consultation", wbsParent: "2. Core hospital modules", assignee: "Frontend Developers", startDate: "2026-06-15", endDate: "2026-07-17", progress: 20, status: "In Progress", plannedCost: 900000, dependencies: [], milestone: false },
    { name: "Integration, testing and hospital rollout", wbsParent: "3. Testing and rollout", assignee: "QA Engineer", startDate: "2026-07-20", endDate: "2026-08-21", progress: 0, status: "Not Started", plannedCost: 1100000, dependencies: [], milestone: true }
  ]);
  const taskIds = Object.values(tasks.insertedIds);
  await db.collection("tasks").updateOne({ _id: taskIds[5] }, { $set: { dependencies: [taskIds[1], taskIds[2], taskIds[3], taskIds[4]] } });

  await db.collection("expenses").insertMany([
    { description: "Project initiation and requirements", amount: 450000, date: "2026-05-15", taskName: "Project initiation and requirements" },
    { description: "Database and scheduling development", amount: 1050000, date: "2026-06-20", taskName: "Database and patient records" }
  ]);
  await db.collection("defects").insertMany([
    { title: "Appointment time-slot conflict", severity: "Critical", assignee: "Backend Developer 1", status: "Open", description: "Two patients can be assigned the same doctor time slot." },
    { title: "Patient record update error", severity: "Critical", assignee: "Database Developer", status: "Open", description: "Some patient record updates are not saved correctly." }
  ]);
  await db.collection("checklists").insertMany([
    { item: "Appointment scheduling test", result: "Fail", notes: "Investigate overlapping time slots." },
    { item: "Patient record security review", result: "Pending", notes: "Verify access and update behavior." }
  ]);
  await db.collection("risks").insertOne({
    title: "Critical defects delay hospital rollout",
    likelihood: 4,
    impact: 5,
    response: "Prevent: add regression tests. Correct: assign developers to fix and QA to retest.",
    owner: "Project Manager",
    status: "Open"
  });
}

app.get("/api/project", async (req, res, next) => {
  try { res.json(await db.collection("project").findOne({})); } catch (error) { next(error); }
});

app.put("/api/project", async (req, res, next) => {
  try {
    const body = req.body;
    const project = {
      name: validText(body.name, "Project name"),
      objective: validText(body.objective, "Objective"),
      stakeholders: validText(body.stakeholders, "Stakeholders"),
      scope: validText(body.scope, "Scope"),
      exclusions: String(body.exclusions || "").trim(),
      approvedBudget: validMoney(body.approvedBudget, "Approved budget"),
      deadline: validDate(body.deadline, "Deadline"),
      status: validText(body.status, "Status"),
      qualityPlan: validText(body.qualityPlan, "Quality plan"),
      closureNotes: String(body.closureNotes || "").trim(),
      closureDate: body.status === "Completed" ? validDate(body.closureDate || new Date().toISOString(), "Closure date") : ""
    };
    await db.collection("project").updateOne({}, { $set: project }, { upsert: true });
    res.json(project);
  } catch (error) { next(error); }
});

app.get("/api/dashboard", async (req, res, next) => {
  try {
    const [project, tasks, expenses, changes, defects] = await Promise.all([
      db.collection("project").findOne({}),
      db.collection("tasks").find().toArray(),
      db.collection("expenses").find().toArray(),
      db.collection("changes").find().toArray(),
      db.collection("defects").find().toArray()
    ]);
    const plannedTaskCost = tasks.reduce((sum, task) => sum + Number(task.plannedCost || 0), 0);
    const earnedTaskCost = tasks.reduce((sum, task) => sum + Number(task.plannedCost || 0) * Number(task.progress || 0) / 100, 0);
    const progress = plannedTaskCost ? earnedTaskCost / plannedTaskCost * 100 : 0;
    const actualCost = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const evm = calculateEvm({ budget: plannedTaskCost || project.approvedBudget, progress, actualCost, tasks });
    const approvedChanges = changes.filter((change) => change.status === "Approved");
    const pendingChanges = changes.filter((change) => change.status === "Pending").length;
    const criticalDefects = defects.filter((defect) => defect.severity === "Critical" && defect.status !== "Resolved").length;
    res.json({
      project, progress, actualCost, evm, pendingChanges, criticalDefects,
      delayed: getScheduleImpact(tasks),
      tasks: tasks.map(({ _id, name, startDate, endDate, progress: taskProgress, status, milestone }) =>
        ({ _id, name, startDate, endDate, progress: taskProgress, status, milestone })),
      approvedChanges
    });
  } catch (error) { next(error); }
});

app.get("/api/:collection", async (req, res, next) => {
  try {
    if (!collections.includes(req.params.collection)) throw badRequest("Unknown module.");
    res.json(await db.collection(req.params.collection).find().sort({ createdAt: -1, _id: -1 }).toArray());
  } catch (error) { next(error); }
});

app.post("/api/:collection", async (req, res, next) => {
  try {
    const collection = req.params.collection;
    if (!collections.includes(collection)) throw badRequest("Unknown module.");
    const item = validateRecord(collection, req.body);
    item.createdAt = new Date();
    const result = await db.collection(collection).insertOne(item);
    res.status(201).json({ ...item, _id: result.insertedId });
  } catch (error) { next(error); }
});

app.put("/api/:collection/:id", async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    if (!collections.includes(collection)) throw badRequest("Unknown module.");
    const item = validateRecord(collection, req.body);
    const result = await db.collection(collection).findOneAndUpdate(
      { _id: toObjectId(id) }, { $set: item }, { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Record not found." });
    res.json(result);
  } catch (error) { next(error); }
});

app.post("/api/changes/:id/decision", async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!["Approved", "Rejected"].includes(status)) throw badRequest("Decision must be Approved or Rejected.");
    const id = toObjectId(req.params.id);
    const changes = db.collection("changes");
    const change = await changes.findOne({ _id: id });
    if (!change) return res.status(404).json({ error: "Change request not found." });
    if (change.status !== "Pending") throw badRequest("Only pending change requests can be decided.");
    if (status === "Approved") {
      const project = await db.collection("project").findOne({});
      const newDeadline = new Date(`${project.deadline}T00:00:00Z`);
      newDeadline.setUTCDate(newDeadline.getUTCDate() + change.scheduleImpactDays);
      await db.collection("project").updateOne(
        { _id: project._id },
        { $inc: { approvedBudget: change.costImpact }, $set: { deadline: newDeadline.toISOString().slice(0, 10) } }
      );
      await db.collection("requirements").insertOne({
        title: change.title, priority: change.priority || "High", status: "Approved",
        description: change.justification, changeRequestId: id, createdAt: new Date()
      });
    }
    const result = await changes.findOneAndUpdate(
      { _id: id }, { $set: { status, decidedAt: new Date() } }, { returnDocument: "after" }
    );
    res.json(result);
  } catch (error) { next(error); }
});

function validateRecord(collection, body) {
  if (collection === "requirements") {
    const status = body.status || "Proposed";
    if (!["Proposed", "Approved", "Rejected"].includes(status)) throw badRequest("Invalid requirement status.");
    return { title: validText(body.title, "Requirement title"), description: String(body.description || "").trim(), priority: body.priority || "Medium", status };
  }
  if (collection === "changes") {
    const status = body.status || "Pending";
    if (status !== "Pending") throw badRequest("Change requests must be submitted as Pending.");
    return {
      title: validText(body.title, "Change title"), justification: validText(body.justification, "Justification"),
      costImpact: validMoney(body.costImpact, "Cost impact"),
      scheduleImpactDays: validMoney(body.scheduleImpactDays, "Schedule impact"),
      priority: body.priority || "High", status
    };
  }
  if (collection === "tasks") {
    const progress = Number(body.progress || 0);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw badRequest("Progress must be between 0 and 100.");
    const startDate = validDate(body.startDate, "Start date");
    const endDate = validDate(body.endDate, "End date");
    if (endDate < startDate) throw badRequest("End date cannot be before start date.");
    return {
      name: validText(body.name, "Activity name"), assignee: validText(body.assignee, "Assignee"),
      wbsParent: validText(body.wbsParent, "WBS deliverable"),
      startDate, endDate, progress, status: body.status || "Not Started",
      plannedCost: validMoney(body.plannedCost, "Planned cost"),
      dependencies: Array.isArray(body.dependencies) ? body.dependencies.filter(ObjectId.isValid).map((id) => new ObjectId(id)) : [],
      milestone: Boolean(body.milestone)
    };
  }
  if (collection === "expenses") {
    return {
      description: validText(body.description, "Expense description"),
      amount: validMoney(body.amount, "Expense amount"), date: validDate(body.date, "Expense date"),
      taskName: String(body.taskName || "").trim()
    };
  }
  if (collection === "defects") {
    if (!["Low", "Medium", "High", "Critical"].includes(body.severity)) throw badRequest("Choose a valid defect severity.");
    return {
      title: validText(body.title, "Defect title"), severity: body.severity,
      assignee: validText(body.assignee, "Assignee"), status: body.status || "Open",
      description: String(body.description || "").trim()
    };
  }
  if (collection === "checklists") {
    if (!["Pass", "Fail", "Pending"].includes(body.result)) throw badRequest("Choose Pass, Fail or Pending.");
    return { item: validText(body.item, "Checklist item"), result: body.result, notes: String(body.notes || "").trim() };
  }
  if (collection === "risks") {
    const likelihood = Number(body.likelihood);
    const impact = Number(body.impact);
    if (![likelihood, impact].every((number) => Number.isInteger(number) && number >= 1 && number <= 5)) {
      throw badRequest("Likelihood and impact must be whole numbers from 1 to 5.");
    }
    return {
      title: validText(body.title, "Risk title"), likelihood, impact,
      response: validText(body.response, "Risk response"), owner: validText(body.owner, "Risk owner"),
      status: body.status || "Open", score: likelihood * impact
    };
  }
  throw badRequest("Unknown module.");
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : "Server error. Check the server console and database connection." });
});

async function start() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(databaseName);
  await seedDatabase();
  app.listen(port, () => console.log(`Smart Healthcare PM is running at http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Could not start the application. Make sure MongoDB is running and MONGODB_URI is correct.", error);
    process.exitCode = 1;
  });
}

module.exports = { app, validateRecord, start };
