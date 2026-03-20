import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

const ENV_CANDIDATES = [".env.local", ".env"];

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

function resolveEnvFile(file?: string): string | null {
  if (file) {
    const p = path.resolve(process.cwd(), file);
    return fs.existsSync(p) ? p : null;
  }
  for (const candidate of ENV_CANDIDATES) {
    const p = path.join(process.cwd(), candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
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

export async function push(keyName?: string, opts: { file?: string } = {}) {
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

    const envPath = resolveEnvFile(opts.file);
    if (!envPath) {
      if (opts.file) {
        console.log(chalk.red(`File not found: ${opts.file}`));
      } else {
        console.log(chalk.red("No .env or .env.local file found in this directory."));
      }
      return;
    }

    const envFile = path.basename(envPath);
    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const allKeys = readEnvFile(envPath);

    if (!Object.keys(allKeys).length) {
      console.log(chalk.yellow(`No keys found in ${envFile}`));
      return;
    }

    if (keyName) {
      if (!(keyName in allKeys)) {
        console.log(chalk.red(`Key "${keyName}" not found in ${envFile}`));
        return;
      }
      await api.post(
        `/cli/keys`,
        { key: keyName, value: allKeys[keyName], projectId },
        { headers }
      );
      console.log(chalk.green(`Pushed: ${keyName}`) + chalk.gray(`  (from ${envFile})`));
      return;
    }

    const entries = Object.entries(allKeys);
    await api.post(
      `/cli/keys`,
      { keys: entries.map(([key, value]) => ({ key, value })), projectId },
      { headers }
    );
    console.log(chalk.green(`Pushed ${entries.length} key(s) to project`) + chalk.gray(`  (from ${envFile})`));
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("Push failed:"), status, data || err.message);
  }
}
