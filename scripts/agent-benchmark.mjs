#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_TASKS_FILE = "benchmarks/agent-suite/tasks.json";

function parseArgs(argv) {
  const args = {
    tasksFile: DEFAULT_TASKS_FILE,
    list: false,
    initReport: null,
    scoreReport: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--tasks" && argv[i + 1]) {
      args.tasksFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--list") {
      args.list = true;
      continue;
    }
    if (arg === "--init-report" && argv[i + 1]) {
      args.initReport = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--score" && argv[i + 1]) {
      args.scoreReport = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function validateSuite(suite) {
  const errors = [];
  if (!suite || typeof suite !== "object") {
    errors.push("suite must be an object");
    return errors;
  }

  if (!Array.isArray(suite.tasks) || suite.tasks.length === 0) {
    errors.push("suite.tasks must be a non-empty array");
    return errors;
  }

  const ids = new Set();
  for (const task of suite.tasks) {
    if (!task.id || typeof task.id !== "string") {
      errors.push("task.id must be a string");
      continue;
    }
    if (ids.has(task.id)) {
      errors.push(`duplicate task id: ${task.id}`);
    }
    ids.add(task.id);
    if (typeof task.weight !== "number" || task.weight <= 0) {
      errors.push(`task '${task.id}' weight must be > 0`);
    }
  }

  return errors;
}

export function createReportTemplate(suite) {
  return {
    suite: suite.name,
    generatedAt: new Date().toISOString(),
    evaluator: "replace-with-evaluator-id",
    notes: "",
    evaluations: suite.tasks.map((task) => ({
      taskId: task.id,
      status: "not_scored",
      score: null,
      notes: "",
      evidence: [],
    })),
  };
}

function normalizeStatusToScore(status) {
  if (status === "pass") return 100;
  if (status === "partial") return 60;
  if (status === "fail") return 0;
  return null;
}

function gradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function scoreReport(suite, report) {
  const suiteTasks = new Map(suite.tasks.map((task) => [task.id, task]));
  const reportEntries = Array.isArray(report.evaluations) ? report.evaluations : [];
  const errors = [];

  let weightedScore = 0;
  let totalWeight = 0;
  const byTask = [];

  for (const task of suite.tasks) {
    const evaluation = reportEntries.find((entry) => entry.taskId === task.id);
    if (!evaluation) {
      errors.push(`missing evaluation for task: ${task.id}`);
      continue;
    }

    let score = typeof evaluation.score === "number" ? evaluation.score : null;
    if (score === null) {
      score = normalizeStatusToScore(evaluation.status);
    }

    if (typeof score !== "number") {
      errors.push(`task '${task.id}' has no score and unsupported status '${evaluation.status}'`);
      continue;
    }

    if (score < 0 || score > 100) {
      errors.push(`task '${task.id}' score must be in [0, 100]`);
      continue;
    }

    weightedScore += score * task.weight;
    totalWeight += task.weight;
    byTask.push({
      taskId: task.id,
      title: task.title,
      weight: task.weight,
      score,
      weightedContribution: Number((score * task.weight).toFixed(2)),
    });
  }

  for (const evaluation of reportEntries) {
    if (!suiteTasks.has(evaluation.taskId)) {
      errors.push(`unknown task id in report: ${evaluation.taskId}`);
    }
  }

  if (errors.length > 0) {
    return { errors, summary: null };
  }

  const finalScore = totalWeight === 0 ? 0 : Number((weightedScore / totalWeight).toFixed(2));
  return {
    errors: [],
    summary: {
      suite: suite.name,
      evaluatedAt: new Date().toISOString(),
      finalScore,
      grade: gradeFromScore(finalScore),
      tasksEvaluated: byTask.length,
      byTask,
    },
  };
}

function printTaskList(suite) {
  console.log(`Suite: ${suite.name}`);
  console.log(`Description: ${suite.description}`);
  console.log(`Tasks: ${suite.tasks.length}`);
  console.log("");
  for (const task of suite.tasks) {
    console.log(`- ${task.id} (${task.category}, weight ${task.weight})`);
    console.log(`  ${task.title}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tasksPath = resolve(process.cwd(), args.tasksFile);
  if (!existsSync(tasksPath)) {
    console.error(`AGENT BENCHMARK FAILED: tasks file not found (${args.tasksFile})`);
    process.exit(1);
  }

  const suite = readJson(tasksPath);
  const suiteErrors = validateSuite(suite);
  if (suiteErrors.length > 0) {
    for (const error of suiteErrors) {
      console.error(`AGENT BENCHMARK FAILED: ${error}`);
    }
    process.exit(1);
  }

  if (args.list) {
    printTaskList(suite);
  }

  if (args.initReport) {
    const reportPath = resolve(process.cwd(), args.initReport);
    mkdirSync(dirname(reportPath), { recursive: true });
    const template = createReportTemplate(suite);
    writeFileSync(reportPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
    console.log(`AGENT BENCHMARK TEMPLATE CREATED: ${reportPath}`);
  }

  if (args.scoreReport) {
    const reportPath = resolve(process.cwd(), args.scoreReport);
    if (!existsSync(reportPath)) {
      console.error(`AGENT BENCHMARK FAILED: report file not found (${args.scoreReport})`);
      process.exit(1);
    }
    const report = readJson(reportPath);
    const result = scoreReport(suite, report);
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.error(`AGENT BENCHMARK FAILED: ${error}`);
      }
      process.exit(1);
    }
    console.log(`AGENT BENCHMARK SCORE: ${result.summary.finalScore} (${result.summary.grade})`);
    console.log(JSON.stringify(result.summary, null, 2));
  }

  if (!args.list && !args.initReport && !args.scoreReport) {
    printTaskList(suite);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
