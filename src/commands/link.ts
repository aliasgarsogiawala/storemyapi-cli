import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { createInterface } from "readline";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function localPath() {
  return path.join(process.cwd(), LOCAL_FILE);
}

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function looksLikeId(input: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    input
  );
}

function writeLocal(project: any) {
  fs.writeFileSync(
    localPath(),
    JSON.stringify(
      {
        projectId: project.id,
        projectName: project.name,
        linkedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(chalk.green("Project linked successfully."));
  console.log(`Project: ${project.name}`);
  console.log(`Configuration written to ${LOCAL_FILE}`);
}

async function askNumber(promptText: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((resolve) =>
    rl.question(promptText, (ans) => resolve(ans))
  );
  rl.close();
  return answer;
}

async function manualSelect(projects: any[]) {
  console.log("Select a project:");
  projects.forEach((p, i) => {
    const keys = typeof p.keyCount === "number" ? p.keyCount : Number(p.keyCount) || 0;
    console.log(`  ${i + 1}) ${p.name} (keys: ${keys})`);
  });

  while (true) {
    const ans = (await askNumber("Enter a number: ")).trim();
    const idx = Number(ans);

    if (Number.isInteger(idx) && idx >= 1 && idx <= projects.length) {
      return projects[idx - 1];
    }

    console.log("Invalid selection. Try again.");
  }
}

function readLocal(): { projectId: string; projectName: string } | null {
  const p = localPath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export async function link(nameOrId?: string) {
  try {
    const auth = getConfig();

    if (!auth?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run 'storemyapi login' first.");
      return;
    }

    const existing = readLocal();
    if (existing) {
      console.log(`Currently linked to: ${chalk.bold(existing.projectName)}`);
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Switch to a different project?",
          default: false,
        },
      ]);
      if (!proceed) {
        console.log(chalk.yellow("Aborted."));
        return;
      }
    }

    const res = await api.get("/projects", {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });

    const projects = Array.isArray(res?.data?.projects) ? res.data.projects : [];

    if (!projects.length) {
      console.log("No projects found for this account.");
      return;
    }

    if (typeof nameOrId === "string" && nameOrId.trim()) {
      const query = nameOrId.trim();

      const selected =
        looksLikeId(query)
          ? projects.find((p: any) => p.id === query)
          : projects.find((p: any) => normalize(p.name) === normalize(query));

      if (!selected) {
        console.log(`No project found matching "${query}".`);
        return;
      }

      writeLocal(selected);
      return;
    }

    let selectedProject: any | null = null;

    const canUseInquirer = Boolean(process.stdout.isTTY && process.stdin.isTTY);

    if (canUseInquirer) {
      try {
        const answer = await inquirer.prompt([
          {
            type: "select",
            name: "projectId",
            message: "Select a project:",
            choices: projects.map((p: any) => ({
              name: `${p.name} (keys: ${Number(p.keyCount) || 0})`,
              value: p.id,
            })),
            pageSize: 12,
          },
        ]);

        selectedProject = projects.find((p: any) => p.id === answer.projectId) ?? null;
      } catch {
        selectedProject = null;
      }
    }

    if (!selectedProject) {
      selectedProject = await manualSelect(projects);
    }

    if (!selectedProject) {
      console.log("Invalid project selection.");
      return;
    }

    writeLocal(selectedProject);
  } catch (err: any) {
    console.error("Link command failed:", err?.response?.data || err.message);
  }
}