import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function localPath() {
  return path.join(process.cwd(), LOCAL_FILE);
}

function getProjectId(): string | null {
  const p = localPath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))?.projectId ?? null;
  } catch {
    return null;
  }
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

export async function push(keyName?: string) {
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

    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      console.log(chalk.red("No .env file found in this directory."));
      return;
    }

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const allKeys = readEnvFile(envPath);

    if (!Object.keys(allKeys).length) {
      console.log(chalk.yellow("No keys found in .env"));
      return;
    }

    if (keyName) {
      if (!(keyName in allKeys)) {
        console.log(chalk.red(`Key "${keyName}" not found in .env`));
        return;
      }
      await api.post(
        `/projects/${projectId}/keys`,
        { key: keyName, value: allKeys[keyName] },
        { headers }
      );
      console.log(chalk.green(`Pushed: ${keyName}`));
      return;
    }

    const entries = Object.entries(allKeys);
    await api.post(
      `/projects/${projectId}/keys/bulk`,
      { keys: entries.map(([key, value]) => ({ key, value })) },
      { headers }
    );
    console.log(chalk.green(`Pushed ${entries.length} key(s) to project`));
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("Push failed:"), status, data || err.message);
  }
}
