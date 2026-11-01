const test = require("node:test");
const assert = require("node:assert/strict");
const { ObjectId } = require("mongodb");
const { calculateEvm, getScheduleImpact } = require("../calculations");
const { validateRecord } = require("../server");

test("calculates PV, EV, AC, CPI and SPI", () => {
  assert.deepEqual(calculateEvm({ budget: 5000000, progress: 50, actualCost: 2000000 }), {
    plannedValue: 5000000, earnedValue: 2500000, actualCost: 2000000, cpi: 1.25, spi: 0.5
  });
});

test("calculates time-phased and cost-weighted earned value", () => {
  const evm = calculateEvm({
    budget: 100,
    actualCost: 20,
    today: new Date("2026-01-06T00:00:00Z"),
    tasks: [
      { plannedCost: 100, progress: 50, startDate: "2026-01-01", endDate: "2026-01-11" }
    ]
  });
  assert.equal(evm.plannedValue, 50);
  assert.equal(evm.earnedValue, 50);
  assert.equal(evm.cpi, 2.5);
  assert.equal(evm.spi, 1);
});

test("finds overdue activities and downstream work", () => {
  const first = new ObjectId();
  const second = new ObjectId();
  const impact = getScheduleImpact([
    { _id: first, name: "Appointment scheduling", endDate: "2026-01-01", status: "In Progress" },
    { _id: second, name: "Hospital testing", endDate: "2026-12-01", status: "Not Started", dependencies: [first] }
  ], new Date("2026-01-05T00:00:00Z"));
  assert.equal(impact.length, 1);
  assert.equal(impact[0].daysLate, 4);
  assert.deepEqual(impact[0].affected, ["Hospital testing"]);
});

test("rejects invalid task dates and invalid risk scores", () => {
  assert.throws(() => validateRecord("tasks", {
    name: "Test", assignee: "QA", startDate: "2026-07-10", endDate: "2026-07-01", plannedCost: 10
  }), /End date cannot be before start date/);
  assert.throws(() => validateRecord("risks", {
    title: "Test risk", likelihood: 6, impact: 2, response: "Fix it", owner: "PM"
  }), /from 1 to 5/);
});
