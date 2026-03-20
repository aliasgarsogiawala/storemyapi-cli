import fs from "fs";
import path from "path";
import chalk from "chalk";
import { spawn } from "child_process";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function getProjectId(): string | null {
  const p = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))?.projectId ?? null;
  } catch {
    return null;
  }
}

export async function envRun(args: string[]) {
  try {
    const auth = getConfig();
    if (!auth?.accessToken) {
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.log(chalk.red("No linked project found."));
      console.log("Run: storemyapi init  or  storemyapi link");
      return;
    }

    if (!args.length) {
      console.log(chalk.red("No command provided."));
      console.log("Usage: storemyapi env run -- <command> [args...]");
      return;
    }

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(`/cli/keys?projectId=${projectId}`, { headers });
    const keys: { key: string; value: string }[] = res.data?.keys ?? [];

    const injected: Record<string, string> = {};
    for (const k of keys) {
      injected[k.key] = k.value;
    }

    const env = { ...process.env, ...injected };
    const [cmd, ...cmdArgs] = args;

    const child = spawn(cmd, cmdArgs, {
      env,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (err) => {
      console.error(chalk.red(`Failed to run command: ${err.message}`));
      process.exit(1);
    });

    child.on("close", (code) => {
      process.exit(code ?? 0);
    });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("env run failed:"), status, data || err.message);
  }
}
